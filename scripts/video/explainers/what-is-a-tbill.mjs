// "What is a T-bill?" / «يعني إيه أذون خزانة؟», about 36 s.
// Numbers: 12-month EGP T-bill 25.67% (indicative, as of 13 Oct 2026, from prisma/seed.ts). Check the live
// rate in /admin before re-rendering. Price of EGP 100,000 face value = 100,000 / (1 + 25.67% × 364/365) ≈ 79,600.
import { GOV, LOGO_OUTRO } from "./parts.mjs";

export default function (lang) {
  const ar = lang === "ar";
  const L = (a, e) => (ar ? a : e);
  const dir = ar ? "rtl" : "ltr";
  return {
    css: `.tenors{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;margin-top:48px}
.flow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:26px;width:900px}
.flow .card{text-align:center;display:grid;gap:10px}
.flow .lbl{font-size:34px;opacity:.75}.flow .amt{font-size:64px;font-weight:800}
.arrow{font-size:80px;opacity:.8}`,
    scenes: [
      {
        start: 0, end: 4,
        html: `<div style="display:grid;justify-items:center;gap:30px">
          <div data-k="0.1:0,0.7:1" data-fx="pop">${GOV(300)}</div>
          <div class="big accent" data-k="0.6:0,1.1:1" data-fx="pop">${L("؟", "?")}</div></div>`,
      },
      {
        start: 4, end: 10,
        html: `<div style="display:grid;justify-items:center" dir="${dir}">
          <div data-k="0:0,0.5:1">${GOV(220)}</div>
          <div class="tenors">
            ${[3, 6, 9, 12].map((m, i) => `<span class="pill" data-k="${0.9 + i * 0.35}:0,${1.4 + i * 0.35}:1" data-fx="pop"><span class="num">${m}</span>&nbsp;${L("شهور", "months")}</span>`).join("")}
          </div></div>`,
      },
      {
        start: 10, end: 16,
        html: `<div class="card" style="text-align:center;display:grid;gap:18px;width:820px" data-k="0:0,0.6:1">
          <div style="font-size:40px;opacity:.75">${L("تدفع النهارده", "You pay today")}</div>
          <div style="font-size:150px;font-weight:800;line-height:1"><span class="num" data-num="0.4:0,2.4:79600">0</span></div>
          <div style="font-size:40px;opacity:.75">${L("جنيه · بدل 100,000", "EGP · instead of 100,000")}</div></div>`,
      },
      {
        start: 16, end: 22,
        html: `<div style="display:grid;justify-items:center;gap:44px">
          <div class="flow" dir="${dir}">
            <div class="card" data-k="0:0,0.5:1"><div class="lbl">${L("النهارده", "Today")}</div><div class="amt num">79,600</div></div>
            <div class="arrow" data-k="0.6:0,1:1" data-fx="fade">${ar ? "←" : "→"}</div>
            <div class="card" data-k="1:0,1.5:1"><div class="lbl">${L("بعد سنة", "In a year")}</div><div class="amt num">100,000</div></div>
          </div>
          <div class="pill accent" style="font-size:56px" data-k="2:0,2.6:1" data-fx="pop"><span class="num" data-num="2:0,3.6:20400" data-fmt="plus">+0</span>&nbsp;${L("جنيه", "EGP")}</div></div>`,
      },
      {
        start: 22, end: 27,
        html: `<div style="display:grid;justify-items:center;gap:26px;text-align:center">
          <div style="font-size:44px;opacity:.75" data-k="0:0,0.5:1">${L("العائد الاسترشادي في السنة", "Indicative yield a year")}</div>
          <div class="big sweep" style="font-size:240px" data-k="1.8:0,3.6:1" data-fx="sweep"><span class="num" data-num="0.3:0,1.9:25.67" data-fmt="pct1">0.0%</span></div>
          <div style="font-size:34px;opacity:.65" data-k="1:0,1.5:1">${L("أذون خزانة 12 شهر · 13 أكتوبر 2026 · قبل الضرائب", "12-month T-bill · 13 Oct 2026 · before tax")}</div></div>`,
      },
      {
        start: 27, end: 30.5,
        html: `<div style="display:grid;justify-items:center;gap:34px;text-align:center">
          <div data-k="0:0,0.6:1" data-fx="pop">${GOV(260)}</div>
          <div style="font-size:52px;font-weight:700" data-k="0.5:0,1.1:1">${L("وزارة المالية المصرية", "Egypt's Ministry of Finance")}</div></div>`,
      },
      { start: 30.5, end: 36, html: LOGO_OUTRO(lang) },
    ],
    captions: [
      { start: 0, end: 4, ar: "عمرك سلّفت الحكومة فلوس؟", en: "Ever lent money to the government?" },
      { start: 4, end: 7, ar: "أذون الخزانة يعني بتسلّف الحكومة المصرية فلوسك…", en: "A T-bill means lending the Egyptian government your money…" },
      { start: 7, end: 10, ar: "…لمدة قصيرة: 3 أو 6 أو 9 أو 12 شهر.", en: "…for a short time: 3, 6, 9 or 12 months." },
      { start: 10, end: 16, ar: "بتشتريه بأقل من قيمته: تدفع النهارده حوالي 79,600 جنيه…", en: "You buy it below face value: pay about EGP 79,600 today…" },
      { start: 16, end: 22, ar: "…وبعد سنة تستلم 100,000 كاملين. الفرق ده هو مكسبك.", en: "…and get the full 100,000 in a year. The difference is your return." },
      { start: 22, end: 24.5, ar: "العائد الاسترشادي النهارده حوالي 25.7% في السنة…", en: "Indicative yield today: about 25.7% a year…" },
      { start: 24.5, end: 27, ar: "…قبل الضرايب والمصاريف.", en: "…before tax and fees." },
      { start: 27, end: 30.5, ar: "صادرة من وزارة المالية المصرية.", en: "Issued by Egypt's Ministry of Finance." },
      { start: 30.5, end: 33, ar: "أجيال هتخليك تشتريها من موبايلك.", en: "AGYAL will let you buy them from your phone." },
      { start: 33, end: 36, ar: "انضم لقائمة الانتظار على agyal.net", en: "Join the waitlist at agyal.net" },
    ],
  };
}
