// Writes the timestamped voice-over script for each explainer (Arabic and English) next to the videos.
// Usage: node scripts/video/write-scripts.mjs
import fs from "node:fs";
import path from "node:path";

const titles = {
  "what-is-a-tbill": ["يعني إيه أذون خزانة؟", "What is a T-bill?"],
  "tbill-vs-bank": ["شهادة البنك ولا أذون الخزانة؟", "Bank deposit or T-bill?"],
};
const ts = (s) => `0:${String(Math.floor(s)).padStart(2, "0")}${s % 1 ? "." + Math.round((s % 1) * 10) : ""}`;
for (const slug of Object.keys(titles)) {
  const v = (await import(path.resolve(`scripts/video/explainers/${slug}.mjs`))).default("ar");
  const block = (lang) => v.captions.map((c) => `[${ts(c.start)}–${ts(c.end)}]  ${c[lang]}`).join("\n");
  const total = v.scenes[v.scenes.length - 1].end;
  const text = `AGYAL · أجيال: voice-over script
${titles[slug][1]} / ${titles[slug][0]}
Length: ${total} seconds. Read each line inside its time slot; a calm, friendly pace. Pauses are fine.
Record in a quiet room, phone 20 cm from your mouth. Send the voice memo back, or record over the video in CapCut.

العربي (مصري)
${block("ar")}

English
${block("en")}
`;
  fs.writeFileSync(`public/brand/videos/${slug}-script.txt`, text);
  console.log("wrote", `public/brand/videos/${slug}-script.txt`);
}
