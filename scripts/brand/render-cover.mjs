// Renders the bilingual Facebook Page cover (1640x924), in the same style as the link preview.
// Usage: node scripts/brand/render-cover.mjs <fonts-dir-with-local.css> [out.png] [--check]
// Needs Playwright (not a project dependency): set PLAYWRIGHT_MODULE to its index.mjs if it isn't resolvable.
// Phones show the whole image; computers show only the middle band (y 150-773), so all content sits there.
// The round profile photo covers a bottom corner on phones (left or right with an Arabic interface), so both stay empty.
import fs from "node:fs";
import path from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const [fontsDir, out = "public/brand/agyal-facebook-cover.png", flag] = process.argv.slice(2);
const check = flag === "--check";
const fontCss = fs.readFileSync(path.join(fontsDir, "local.css"), "utf8");

const MARK = `<svg viewBox="0 0 96 96"><rect x="16" y="54" width="16" height="26" rx="6" fill="#fff" opacity=".5"/><rect x="40" y="38" width="16" height="42" rx="6" fill="#fff" opacity=".75"/><rect x="64" y="20" width="16" height="60" rx="6" fill="#fff"/><circle cx="72" cy="10" r="5" fill="#EF8A5F"/></svg>`;

const overlay = check
  ? `<div style="position:absolute;left:0;right:0;top:150px;height:624px;border:4px solid #ff0"></div>
     <div style="position:absolute;left:40px;bottom:-60px;width:300px;height:300px;border-radius:50%;border:4px dashed #ff0"></div>
     <div style="position:absolute;right:40px;bottom:-60px;width:300px;height:300px;border-radius:50%;border:4px dashed #ff0"></div>`
  : "";

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
*{margin:0;box-sizing:border-box}
html,body{width:1640px;height:924px;overflow:hidden}
body{background:#1D47A3;position:relative;color:#fff}
.ar{font-family:'IBM Plex Sans Arabic',sans-serif}
.en{font-family:'Inter',sans-serif}
.glow{position:absolute;border-radius:50%}
.band{position:absolute;left:0;right:0;top:150px;height:624px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:28px 0 26px}
.lockup{display:flex;align-items:center;gap:18px;font-size:40px;font-weight:700}
.lockup svg{width:60px;height:60px}
.cols{display:grid;grid-template-columns:560px 2px 560px;gap:64px;align-items:center}
.rule{height:200px;background:rgba(255,255,255,.28);border-radius:2px}
.col{display:grid;gap:22px}
.h{font-size:68px;font-weight:700}
.h.ar{line-height:1.3}
.h.en{line-height:1.12;letter-spacing:-0.03em}
.sub{font-size:27px;font-weight:500;opacity:.85}
.cta{display:flex;flex-direction:column;align-items:center;gap:14px;font-size:26px}
.pill{background:#fff;color:#1D47A3;border-radius:999px;padding:12px 44px;font-weight:700;display:flex;flex-direction:column;align-items:center;line-height:1.25}
</style></head><body>
<div class="glow" style="right:-140px;top:-220px;width:640px;height:640px;background:radial-gradient(circle,rgba(208,100,58,.45),transparent 65%)"></div>
<div class="glow" style="left:-220px;bottom:-300px;width:800px;height:800px;background:radial-gradient(circle,rgba(123,159,240,.55),transparent 65%)"></div>
<div class="band">
  <div class="lockup">${MARK}<span class="en" style="letter-spacing:.06em">AGYAL</span><span style="opacity:.4;font-weight:400">|</span><span class="ar">أجيال</span></div>
  <div class="cols">
    <div class="col en" dir="ltr" style="text-align:left">
      <div class="h en">Egypt's bonds,<br>in your pocket.</div>
      <div class="sub en">T-bills · Bonds · Sukuk · Eurobonds</div>
    </div>
    <div class="rule"></div>
    <div class="col ar" dir="rtl" style="text-align:right">
      <div class="h ar">سندات مصر،<br>في جيبك.</div>
      <div class="sub ar">أذون الخزانة · السندات · الصكوك · اليوروبوند</div>
    </div>
  </div>
  <div class="cta">
    <span class="pill"><span class="en">Join the waitlist</span><span class="ar">انضم لقائمة الانتظار</span></span>
    <span class="en" style="font-weight:600;opacity:.9">agyal.net</span>
  </div>
</div>
${overlay}
</body></html>`;

const tmp = path.join(fontsDir, "cover-tmp.html");
fs.writeFileSync(tmp, html);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1640, height: 924 } });
await page.goto("file://" + path.resolve(tmp));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
fs.unlinkSync(tmp);
console.log("wrote", out);
