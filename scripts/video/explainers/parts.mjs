// Shared drawings for the explainer videos (flat SVG, white on the brand blue).

/** A government building: pediment, columns, steps. */
export const GOV = (size) => `<svg viewBox="0 0 120 120" width="${size}" height="${size}" fill="none">
  <path d="M60 14 108 40H12Z" fill="#fff"/><rect x="14" y="44" width="92" height="7" rx="2" fill="#fff" opacity=".85"/>
  ${[22, 40, 58, 76, 94].map((x) => `<rect x="${x - 4}" y="54" width="10" height="40" rx="2" fill="#fff" opacity=".9"/>`).join("")}
  <rect x="10" y="96" width="100" height="8" rx="2" fill="#fff"/><rect x="4" y="106" width="112" height="8" rx="2" fill="#fff" opacity=".7"/>
  <circle cx="60" cy="32" r="4" fill="#EF8A5F"/></svg>`;

/** A bank: a simpler building with a coin on the door. */
export const BANK = (size) => `<svg viewBox="0 0 120 120" width="${size}" height="${size}" fill="none">
  <path d="M60 16 106 38H14Z" fill="#fff" opacity=".7"/>
  <rect x="18" y="42" width="84" height="56" rx="6" fill="#fff" opacity=".55"/>
  <circle cx="60" cy="70" r="14" fill="#0B1330" opacity=".5"/><text x="60" y="77" text-anchor="middle" font-size="20" font-family="Inter" font-weight="800" fill="#fff">£</text>
  <rect x="10" y="100" width="100" height="8" rx="2" fill="#fff" opacity=".6"/></svg>`;

/** Closing card: the ladder bars grow, then the name, the join pill and the address. */
export const LOGO_OUTRO = (lang) => {
  const ar = lang === "ar";
  return `<div style="display:grid;justify-items:center;gap:40px">
    <div style="display:flex;align-items:flex-end;gap:22px;height:220px;position:relative">
      <i data-k="0.1:0,0.8:1" data-fx="grow" style="display:block;width:56px;height:96px;border-radius:20px;background:#fff;opacity:.5"></i>
      <i data-k="0.25:0,0.95:1" data-fx="grow" style="display:block;width:56px;height:154px;border-radius:20px;background:#fff;opacity:.75"></i>
      <i data-k="0.4:0,1.1:1" data-fx="grow" style="display:block;width:56px;height:220px;border-radius:20px;background:#fff"></i>
      <b data-k="1:0,1.4:1" data-fx="pop" style="position:absolute;right:10px;top:-58px;width:38px;height:38px;border-radius:50%;background:#EF8A5F"></b>
    </div>
    <div data-k="1.2:0,1.8:1" style="display:flex;align-items:center;gap:22px;font-size:76px;font-weight:800">
      <span class="en" style="letter-spacing:.06em">AGYAL</span><span style="opacity:.4;font-weight:300">|</span><span class="ar">أجيال</span></div>
    <div data-k="1.7:0,2.3:1" data-fx="pop" style="background:#fff;color:#1D47A3;border-radius:999px;padding:20px 48px;display:grid;justify-items:center;font-weight:800;font-size:40px;line-height:1.35">
      <span class="en">Join the waitlist</span><span class="ar">انضم لقائمة الانتظار</span></div>
    <div class="en" data-k="2.1:0,2.7:1" style="font-size:44px;font-weight:700;letter-spacing:.03em">agyal.net</div>
  </div>`;
};
