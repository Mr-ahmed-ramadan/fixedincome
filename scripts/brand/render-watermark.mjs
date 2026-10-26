// Renders the YouTube video watermark: 300x300 PNG (YouTube needs square, at least 150x150, under 1 MB),
// a rounded blue tile with the white ladder mark on a transparent background, so it reads on any video.
// Usage: node scripts/brand/render-watermark.mjs [out.png]
// Needs Playwright (not a project dependency): set PLAYWRIGHT_MODULE to its index.mjs if it isn't resolvable.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const out = process.argv[2] || "public/brand/agyal-youtube-watermark.png";

const html = `<!doctype html><html><body style="margin:0;background:transparent">
<div id="c" style="width:300px;height:300px;display:grid;place-items:center">
  <div style="width:270px;height:270px;border-radius:64px;background:#1D47A3;display:grid;place-items:center;box-shadow:0 0 0 6px rgba(255,255,255,.9)">
    <svg viewBox="0 0 96 96" style="width:190px;height:190px"><rect x="16" y="54" width="16" height="26" rx="6" fill="#fff" opacity=".5"/><rect x="40" y="38" width="16" height="42" rx="6" fill="#fff" opacity=".75"/><rect x="64" y="20" width="16" height="60" rx="6" fill="#fff"/><circle cx="72" cy="10" r="5" fill="#EF8A5F"/></svg>
  </div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 300, height: 300 } });
await page.setContent(html);
await page.locator("#c").screenshot({ path: out, omitBackground: true });
await browser.close();
console.log("wrote", out);
