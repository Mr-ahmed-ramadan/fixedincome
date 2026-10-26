// Edits a voice-over recording to fit an explainer, then writes the timing the renderer uses.
// Usage: node scripts/video/edit-voice.mjs <slug> <lang> <recording> <work-dir>
// Reads scripts/video/explainers/<slug>.voice-<lang>.json: one [start, end] (seconds in the recording) per caption line,
// found from the pauses between lines (ffmpeg silencedetect).
// Writes <work-dir>/<slug>-<lang>-voice.wav (clean, slightly deeper, levelled, paced), a quiet generated music bed
// mixed under it (<slug>-<lang>-mix.wav), and <work-dir>/<slug>-<lang>-timing.json with each caption's new start/end.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
// --raw: keep the recording exactly as recorded (no effects, no music, original pacing); only the loudness is levelled.
const raw = args.includes("--raw");
const [slug, lang, recording, work] = args.filter((a) => a !== "--raw");
const video = (await import(path.resolve(`scripts/video/explainers/${slug}.mjs`))).default(lang);
const lines = JSON.parse(fs.readFileSync(`scripts/video/explainers/${slug}.voice-${lang}.json`, "utf8")).lines;
if (lines.length !== video.captions.length) throw new Error(`${lines.length} recorded lines for ${video.captions.length} captions`);

const LEAD_IN = 0.5, SAME_SCENE_GAP = 0.35, NEW_SCENE_GAP = 0.6, PAD_BEFORE = 0.06, PAD_AFTER = 0.14, TAIL = 3.0;
const sceneOf = (c) => video.scenes.findIndex((s) => c.start >= s.start && c.start < s.end);
const ff = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
fs.mkdirSync(work, { recursive: true });

if (raw) {
  const total = Math.ceil(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", recording]).toString()) * 10) / 10;
  const mix = path.join(work, `${slug}-${lang}-mix.wav`);
  ff(["-i", recording, "-ac", "1", "-ar", "48000", "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", mix]);
  const timing = {
    duration: total,
    captions: lines.map(([s], i) => ({ start: +Math.max(0, s - 0.15).toFixed(2), end: +(i + 1 < lines.length ? lines[i + 1][0] - 0.15 : total).toFixed(2) })),
  };
  fs.writeFileSync(path.join(work, `${slug}-${lang}-timing.json`), JSON.stringify(timing, null, 2));
  console.log(`raw voice ${total}s →`, mix);
  process.exit(0);
}

// 1. Clean the whole recording once: rumble cut, gentle denoise, a touch deeper (formants kept, so it stays natural),
//    warmth and presence, then even out peaks.
const clean = path.join(work, `${slug}-${lang}-clean.wav`);
ff(["-i", recording, "-ac", "1", "-ar", "48000", "-af", [
  "highpass=f=75",
  "afftdn=nr=14:nf=-42:tn=1",
  "rubberband=pitch=0.95:formant=preserved",
  "equalizer=f=140:t=q:w=0.9:g=3",
  "equalizer=f=380:t=q:w=1.2:g=-2",
  "equalizer=f=3200:t=q:w=1.0:g=2",
  "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3",
].join(","), clean]);

// 2. Lay the lines out on a new timeline with short, even pauses.
let t = LEAD_IN;
const placed = lines.map(([s, e], i) => {
  if (i > 0) t += sceneOf(video.captions[i]) === sceneOf(video.captions[i - 1]) ? SAME_SCENE_GAP : NEW_SCENE_GAP;
  const from = Math.max(0, s - PAD_BEFORE), len = e + PAD_AFTER - from;
  const at = t;
  t += len;
  return { from, len, at };
});
const total = Math.ceil((t + TAIL) * 10) / 10;
const inputs = placed.flatMap((p) => ["-ss", p.from.toFixed(3), "-t", p.len.toFixed(3), "-i", clean]);
const delays = placed.map((p, i) => `[${i}:a]afade=t=in:d=0.03,afade=t=out:st=${(p.len - 0.05).toFixed(3)}:d=0.05,adelay=${Math.round(p.at * 1000)}:all=1[v${i}]`).join(";");
const voice = path.join(work, `${slug}-${lang}-voice.wav`);
ff([...inputs, "-filter_complex", `${delays};${placed.map((_, i) => `[v${i}]`).join("")}amix=inputs=${placed.length}:normalize=0,apad=whole_dur=${total},atrim=0:${total},loudnorm=I=-15:TP=-1.5:LRA=9[out]`, "-map", "[out]", "-ar", "48000", voice]);

// 3. A soft, slowly changing pad (A minor → F → C → G), generated here so there are no rights issues; ducked under the voice.
const chord = (fs_) => fs_.map((f) => `sin(2*PI*${f}*t)`).join("+");
const prog = [[110, 164.81, 220, 261.63], [87.31, 130.81, 174.61, 220], [130.81, 196, 261.63, 329.63], [98, 146.83, 196, 246.94]];
const expr = prog.map((c, i) => `if(eq(floor(mod(t/8,4)),${i}),${chord(c)},0)`).join("+");
const music = path.join(work, `${slug}-${lang}-music.wav`);
ff(["-f", "lavfi", "-i", `aevalsrc='0.05*(${expr})*(0.75+0.25*sin(2*PI*0.25*t))':s=48000:d=${total}`, "-af",
  `lowpass=f=900,aecho=0.8:0.7:120|240:0.35|0.2,afade=t=in:d=2,afade=t=out:st=${total - 2.5}:d=2.5,volume=-6dB`, music]);
const mix = path.join(work, `${slug}-${lang}-mix.wav`);
ff(["-i", voice, "-i", music, "-filter_complex",
  "[1:a][0:a]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];[0:a][duck]amix=inputs=2:normalize=0:weights=1 0.55,alimiter=limit=0.89[out]",
  "-map", "[out]", "-ar", "48000", mix]);

// 4. Timing for the renderer: each caption runs from its line until the next one starts.
const timing = {
  duration: total,
  captions: placed.map((p, i) => ({ start: +Math.max(0, p.at - 0.15).toFixed(2), end: +(i + 1 < placed.length ? placed[i + 1].at - 0.15 : total).toFixed(2) })),
};
fs.writeFileSync(path.join(work, `${slug}-${lang}-timing.json`), JSON.stringify(timing, null, 2));
console.log(`voice ${total}s →`, mix);
