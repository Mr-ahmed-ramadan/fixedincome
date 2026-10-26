// Renders the bilingual YouTube channel banner (2560x1440), in the same style as the Facebook cover.
// Usage: node scripts/brand/render-youtube-banner.mjs <fonts-dir-with-local.css> [out.png] [--check]
// Needs Playwright (not a project dependency): set PLAYWRIGHT_MODULE to its index.mjs if it isn't resolvable.
// TVs show the whole image, computers a 2560x423 strip and phones only the centre 1546x423, so all content sits there.
import fs from "node:fs";
import path from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const [fontsDir, out = "public/brand/agyal-youtube-banner.png", flag] = process.argv.slice(2);
const check = flag === "--check";
const fontCss = fs.readFileSync(path.join(fontsDir, "local.css"), "utf8");

const MARK = `<svg viewBox="0 0 96 96"><rect x="16" y="54" width="16" height="26" rx="6" fill="#fff" opacity=".5"/><rect x="40" y="38" width="16" height="42" rx="6" fill="#fff" opacity=".75"/><rect x="64" y="20" width="16" height="60" rx="6" fill="#fff"/><circle cx="72" cy="10" r="5" fill="#EF8A5F"/></svg>`;

const overlay = check
  ? `<div style="position:absolute;left:0;right:0;top:508px;height:423px;border:5px solid #ff0"></div>
     <div style="position:absolute;left:507px;top:508px;width:1546px;height:423px;border:5px dashed #0ff"></div>`
  : "";

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
*{margin:0;box-sizing:border-box}
html,body{width:2560px;height:1440px;overflow:hidden}
body{background:#1D47A3;position:relative;color:#fff}
.ar{font-family:'IBM Plex Sans Arabic',sans-serif}
.en{font-family:'Inter',sans-serif}
.glow{position:absolute;border-radius:50%}
.safe{position:absolute;left:507px;top:508px;width:1546px;height:423px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:56px;padding:0 90px}
.col{display:grid;gap:14px}
.h{font-size:60px;font-weight:700}
.h.ar{line-height:1.3}
.h.en{line-height:1.1;letter-spacing:-0.03em}
.sub{font-size:24px;font-weight:500;opacity:.85}
.mid{display:grid;justify-items:center;gap:18px;padding:0 48px;border-inline:2px solid rgba(255,255,255,.25)}
.mid svg{width:120px;height:120px}
.name{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:700}
.url{font-size:24px;font-weight:600;opacity:.85}
</style></head><body>
<div class="glow" style="right:300px;top:-250px;width:1000px;height:1000px;background:radial-gradient(circle,rgba(208,100,58,.4),transparent 65%)"></div>
<div class="glow" style="left:200px;bottom:-350px;width:1200px;height:1200px;background:radial-gradient(circle,rgba(123,159,240,.5),transparent 65%)"></div>
<div class="safe">
  <div class="col en" dir="ltr" style="text-align:left">
    <div class="h en">Egypt's bonds,<br>in your pocket.</div>
    <div class="sub en">T-bills · Bonds · Sukuk · Eurobonds</div>
  </div>
  <div class="mid">
    ${MARK}
    <div class="name"><span class="en" style="letter-spacing:.06em">AGYAL</span><span style="opacity:.4;font-weight:400">|</span><span class="ar">أجيال</span></div>
    <div class="url en">agyal.net</div>
  </div>
  <div class="col ar" dir="rtl" style="text-align:right">
    <div class="h ar">سندات مصر،<br>في جيبك.</div>
    <div class="sub ar">أذون الخزانة · السندات · الصكوك · اليوروبوند</div>
  </div>
</div>
${overlay}
</body></html>`;

const tmp = path.join(fontsDir, "banner-tmp.html");
fs.writeFileSync(tmp, html);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });
await page.goto("file://" + path.resolve(tmp));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
fs.unlinkSync(tmp);
console.log("wrote", out);
