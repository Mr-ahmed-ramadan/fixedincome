// Builds a labelled storyboard PNG per explainer: one row per scene with its Arabic and English frames,
// the time slot and the voice lines. Usage: node scripts/video/storyboard.mjs <slug> <fonts-dir> <stills-dir>
// (stills come from render-explainer.mjs --stills, named <slug>-<lang>-sceneN.png in <stills-dir>)
import fs from "node:fs";
import path from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const [slug, fontsDir, stillsDir] = process.argv.slice(2);
const v = (await import(path.resolve(`scripts/video/explainers/${slug}.mjs`))).default("ar");
const fontCss = fs.readFileSync(path.join(fontsDir, "local.css"), "utf8");
const ts = (s) => `0:${String(Math.floor(s)).padStart(2, "0")}${s % 1 ? "." + Math.round((s % 1) * 10) : ""}`;
const img = (lang, i) => `data:image/png;base64,${fs.readFileSync(path.join(stillsDir, `${slug}-${lang}-scene${i + 1}.png`)).toString("base64")}`;

const rows = v.scenes.map((s, i) => {
  const lines = v.captions.filter((c) => c.start >= s.start && c.start < s.end);
  return `<div class="row"><div class="n">${i + 1}<small>${ts(s.start)}–${ts(s.end)}</small></div>
    <img src="${img("ar", i)}"><img src="${img("en", i)}">
    <div class="lines">${lines.map((c) => `<div class="t">${ts(c.start)}</div><div class="ar" dir="rtl">${c.ar}</div><div class="en">${c.en}</div>`).join("")}</div></div>`;
}).join("");

const html = `<!doctype html><meta charset="utf-8"><style>${fontCss}
*{margin:0;box-sizing:border-box}body{background:#F4F5FA;color:#0F1630;font-family:Inter,sans-serif;padding:48px;width:1600px}
h1{font-size:40px;margin-bottom:6px}.sub{color:#5D6478;font-size:20px;margin-bottom:32px}
.row{display:grid;grid-template-columns:90px 180px 180px 1fr;gap:24px;align-items:center;background:#fff;border-radius:24px;padding:18px;margin-bottom:16px}
.n{font-size:44px;font-weight:800;color:#1D47A3;display:grid}.n small{font-size:16px;color:#5D6478;font-weight:600}
img{width:180px;border-radius:14px}
.lines{display:grid;gap:4px}.t{font-size:15px;color:#D0643A;font-weight:700;margin-top:8px}
.ar{font-family:'IBM Plex Sans Arabic';font-size:26px;font-weight:600;text-align:right}.en{font-size:20px;color:#5D6478}
</style><body><h1>${v.captions[0].en.replace(/\?.*/, "?")} · ${v.captions[0].ar.replace(/؟.*/, "؟")}</h1>
<div class="sub">Storyboard · ${v.scenes[v.scenes.length - 1].end}s · vertical 1080×1920 · left frame Arabic version, right frame English version</div>${rows}</body>`;

const tmp = path.join(fontsDir, `sb-${slug}.html`);
fs.writeFileSync(tmp, html);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto("file://" + path.resolve(tmp)); await p.evaluate(() => document.fonts.ready);
const out = `public/brand/videos/${slug}-storyboard.png`;
await p.screenshot({ path: out, fullPage: true });
await b.close(); fs.unlinkSync(tmp);
console.log("wrote", out);
