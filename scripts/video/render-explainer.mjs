// Renders a vertical (1080x1920, 30 fps) explainer video from a data file in ./explainers, frame by frame.
// Usage: node scripts/video/render-explainer.mjs <slug> <ar|en> <fonts-dir-with-local.css> [out.mp4] [--stills]
//   --stills writes one PNG per scene (mid-scene) instead of the video, to check layout quickly.
// Needs Playwright (not a project dependency): set PLAYWRIGHT_MODULE to its index.mjs if it isn't resolvable.
//
// Animation is deterministic: every frame the page's seek(t) sets each element's style from its data attributes.
//   data-k="t:v,t:v,..."   keyframes (seconds from the element's scene start) for a 0..1 progress value
//   data-fx="rise|pop|grow|fade|sweep"   how that progress is shown (default rise)
//   data-num="t:v,t:v" + data-fmt="int|pct1|pct2"   a number that moves between keyframe values
//   data-h="t:v,..."   height in % (bar charts)
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import zlib from "node:zlib";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const [slug, lang, fontsDir, outArg, flag] = process.argv.slice(2);
const stills = flag === "--stills" || outArg === "--stills";
const out = outArg && outArg !== "--stills" ? outArg : `public/brand/videos/${slug}-${lang}.mp4`;
const W = 1080, H = 1920, FPS = 30;

const video = (await import(path.resolve(`scripts/video/explainers/${slug}.mjs`))).default(lang);
const duration = video.scenes[video.scenes.length - 1].end;
const ar = lang === "ar";
const fontCss = fs.readFileSync(path.join(fontsDir, "local.css"), "utf8");

// Captions: the main language big, the other small underneath. Words rise one after another.
const words = (text, t0, step = 0.06) =>
  text.split(" ").map((w, i) => `<span class="w" data-k="${(t0 + i * step).toFixed(2)}:0,${(t0 + i * step + 0.45).toFixed(2)}:1">${w}</span>`).join(" ");
const captions = video.captions
  .map((c) => {
    const main = ar ? c.ar : c.en, sub = ar ? c.en : c.ar;
    return `<div class="cap" data-start="${c.start}" data-end="${c.end}">
      <div class="cap-main ${ar ? "ar" : "en"}" dir="${ar ? "rtl" : "ltr"}">${words(main, 0.05)}</div>
      <div class="cap-sub ${ar ? "en" : "ar"}" dir="${ar ? "ltr" : "rtl"}" data-k="0.35:0,0.8:1" data-fx="fade">${sub}</div>
    </div>`;
  })
  .join("");

const scenes = video.scenes.map((s) => `<section class="scene" data-start="${s.start}" data-end="${s.end}"><div class="cam">${s.html}</div></section>`).join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0B1330;color:#fff}
body{font-family:${ar ? "'IBM Plex Sans Arabic'" : "Inter"},sans-serif}
.ar{font-family:'IBM Plex Sans Arabic',sans-serif}.en{font-family:'Inter',sans-serif}
.bg{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 0%,#1D47A3 0%,#132E73 45%,#0B1330 100%)}
.glow{position:absolute;border-radius:50%;filter:blur(40px)}
.grain{position:absolute;inset:-200px;opacity:.07;mix-blend-mode:overlay;background-image:url(data:image/png;base64,${noisePng()})}
.vignette{position:absolute;inset:0;background:radial-gradient(130% 90% at 50% 45%,transparent 55%,rgba(0,0,0,.45) 100%)}
.chip{position:absolute;top:250px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:14px;font-size:30px;font-weight:700;opacity:.9}
.chip .bars{display:flex;align-items:flex-end;gap:5px;height:34px}.chip .bars i{display:block;width:9px;border-radius:4px;background:#fff}
.scene{position:absolute;left:0;right:0;top:380px;height:740px;display:grid;place-items:center}
.cam{width:100%;height:100%;display:grid;place-items:center;transform-origin:50% 60%}
.caps{position:absolute;left:90px;right:150px;top:1150px;height:340px}
.cap{position:absolute;inset:0;display:grid;align-content:start;gap:18px;text-align:center}
.cap-main{font-size:${ar ? 60 : 56}px;font-weight:700;line-height:${ar ? 1.45 : 1.2};text-shadow:0 4px 24px rgba(0,0,0,.35)}
.cap-sub{font-size:32px;font-weight:500;opacity:.75;line-height:1.4}
.w{display:inline-block}
.legal{position:absolute;left:90px;right:150px;top:1540px;text-align:center;font-size:24px;opacity:.55}
/* shared visual pieces */
.big{font-size:200px;font-weight:800;letter-spacing:-.03em;line-height:1}
.num{font-family:Inter,sans-serif;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}
.pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:14px 34px;font-size:40px;font-weight:700;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.22)}
.card{border-radius:40px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.14);padding:40px 48px}
.accent{color:#EF8A5F}
.muted{opacity:.7}
.sweep{background:linear-gradient(100deg,#fff 0%,#fff 40%,#FFD9C7 50%,#fff 60%,#fff 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent}
${video.css || ""}
</style></head><body>
<div class="bg"></div>
<div class="glow" id="g1" style="width:900px;height:900px;background:rgba(123,159,240,.35)"></div>
<div class="glow" id="g2" style="width:700px;height:700px;background:rgba(208,100,58,.28)"></div>
<div class="chip"><span class="bars"><i style="height:14px;opacity:.5"></i><i style="height:22px;opacity:.75"></i><i style="height:32px"></i></span><span class="en" style="letter-spacing:.06em">AGYAL</span><span style="opacity:.4;font-weight:400">|</span><span class="ar">أجيال</span></div>
${scenes}
<div class="caps">${captions}</div>
<div class="legal">${ar ? "أرقام استرشادية قبل الضرائب والمصاريف · مش نصيحة استثمارية" : "Indicative figures, before tax and fees · Not investment advice"}</div>
<div class="grain" id="grain"></div><div class="vignette"></div>
<script>
const ease = (x) => (x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2);
const backOut = (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3*Math.pow(x - 1, 3) + c1*Math.pow(x - 1, 2); };
function keys(s) { return s.split(",").map((p) => p.split(":").map(Number)); }
function at(k, t, curve = ease) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i-1], [t1, v1] = k[i]; return v0 + (v1 - v0) * curve((t - t0) / (t1 - t0 || 1)); }
  return k[k.length - 1][1];
}
const fmt = { int: (v) => Math.round(v).toLocaleString("en-US"), pct1: (v) => v.toFixed(1) + "%", pct2: (v) => v.toFixed(2) + "%", plus: (v) => "+" + Math.round(v).toLocaleString("en-US"), approx: (v) => "≈ +" + Math.round(v).toLocaleString("en-US") };
function local(el, t) {
  const box = el.closest("[data-start]");
  return box ? t - Number(box.dataset.start) : t;
}
window.seek = (t, frame) => {
  document.getElementById("g1").style.transform = "translate(" + (-250 + Math.sin(t*.25)*120) + "px," + (-200 + Math.cos(t*.2)*90) + "px)";
  document.getElementById("g2").style.transform = "translate(" + (600 + Math.cos(t*.22)*110) + "px," + (1150 + Math.sin(t*.3)*120) + "px)";
  document.getElementById("grain").style.transform = "translate(" + ((frame*37)%160 - 80) + "px," + ((frame*53)%160 - 80) + "px)";
  for (const box of document.querySelectorAll("[data-start]")) {
    const s = Number(box.dataset.start), e = Number(box.dataset.end), fade = 0.35;
    const v = Math.min(Math.max((t - s) / fade, 0), Math.max(Math.min((e - t) / fade, 1), 0), 1);
    const last = Number(box.dataset.end) >= ${duration};
    box.style.opacity = t < s || (t > e && !last) ? 0 : (last && t > e - fade ? 1 : v);
    const cam = box.querySelector(":scope > .cam");
    if (cam) { const p = Math.min(Math.max((t - s) / (e - s), 0), 1); cam.style.transform = "scale(" + (1 + .06*p) + ")"; }
  }
  for (const el of document.querySelectorAll("[data-k]")) {
    const v = Math.min(Math.max(at(keys(el.dataset.k), local(el, t)), 0), 1);
    const fx = el.dataset.fx || "rise";
    if (fx === "rise") { el.style.opacity = v; el.style.transform = "translateY(" + (1 - v)*40 + "px)"; el.style.filter = "blur(" + (1 - v)*10 + "px)"; }
    else if (fx === "fade") el.style.opacity = v;
    else if (fx === "pop") { const b = v <= 0 ? 0 : backOut(v); el.style.opacity = Math.min(v*2, 1); el.style.transform = "scale(" + (0.5 + 0.5*b) + ")"; }
    else if (fx === "grow") { el.style.transform = "scaleY(" + Math.max(backOut(v), 0.001) + ")"; el.style.transformOrigin = "bottom"; }
    else if (fx === "sweep") el.style.backgroundPosition = (100 - v*200) + "% 0";
  }
  for (const el of document.querySelectorAll("[data-num]")) el.textContent = fmt[el.dataset.fmt || "int"](at(keys(el.dataset.num), local(el, t)));
  for (const el of document.querySelectorAll("[data-h]")) el.style.height = at(keys(el.dataset.h), local(el, t)) + "%";
};
</script></body></html>`;

function noisePng() {
  // 200x200 grey noise, made once with a tiny PNG encoder (no image libraries needed).
  const size = 200;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const v = Math.floor(rand() * 255), o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = raw[o + 1] = raw[o + 2] = v; raw[o + 3] = 255;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]).toString("base64");
}

const tmp = path.join(fontsDir, `video-${slug}-${lang}.html`);
fs.writeFileSync(tmp, html);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto("file://" + path.resolve(tmp));
await page.evaluate(() => document.fonts.ready);

if (stills) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  for (const [i, s] of video.scenes.entries()) {
    const t = Math.min(s.start + (s.end - s.start) * 0.8, duration - 0.05);
    await page.evaluate(([t, f]) => window.seek(t, f), [t, Math.round(t * FPS)]);
    const file = out.replace(/\.mp4$/, "") + `-scene${i + 1}.png`;
    await page.screenshot({ path: file });
    console.log("wrote", file);
  }
} else {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest",
    "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const frames = Math.round(duration * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate(([t, f]) => window.seek(t, f), [f / FPS, f]);
    const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 150 === 0) console.log(`${slug}-${lang}: ${Math.round((f / frames) * 100)}%`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on("close", (c) => (c ? j(new Error("ffmpeg " + c)) : r())));
  // Poster: the outro frame, for the video thumbnail.
  await page.evaluate(([t, f]) => window.seek(t, f), [duration - 0.5, frames]);
  await page.screenshot({ path: out.replace(/\.mp4$/, "-poster.png") });
  console.log("wrote", out);
}
await browser.close();
fs.unlinkSync(tmp);
