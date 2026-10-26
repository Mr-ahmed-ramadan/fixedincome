// "Bank deposit or T-bill?" / «شهادة البنك ولا أذون الخزانة؟», about 37 s.
// Numbers (indicative, from prisma/seed.ts; check /admin before re-rendering):
//   12-month EGP T-bill 25.67% (13 Oct 2026), taxed 20% → 20.54%; Bank A 12-month deposit 17.00% (16 Aug 2026), tax-free.
//   On EGP 100,000 for a year: bank 17,000; T-bill 25,670 before tax, 20,536 after; difference ≈ 3,500.
import { BANK, GOV, LOGO_OUTRO } from "./parts.mjs";

const BANK_H = 17 / 26 * 100; // bar heights relative to the tallest value (26%)
const TBILL_H = 25.67 / 26 * 100;
const TBILL_NET_H = 20.54 / 26 * 100;

export default function (lang) {
  const ar = lang === "ar";
  const L = (a, e) => (ar ? a : e);
  const dir = ar ? "rtl" : "ltr";
  return {
    css: `.chart{display:grid;grid-template-columns:1fr 1fr;gap:90px;width:760px;height:620px;align-items:end}
.col{display:grid;grid-template-rows:auto 1fr auto;height:100%;justify-items:center;gap:16px}
.track{position:relative;width:200px;height:100%;display:flex;align-items:flex-end}
.bar{width:100%;border-radius:28px 28px 10px 10px}
.val{font-size:58px;font-weight:800}.cap2{font-size:30px;opacity:.75;text-align:center}
.lbl{font-size:32px;font-weight:700;display:flex;align-items:center;gap:10px;white-space:nowrap}`,
    scenes: [
      {
        start: 0, end: 4,
        html: `<div style="display:flex;align-items:center;gap:60px" dir="${dir}">
          <div data-k="0.1:0,0.7:1" data-fx="pop">${BANK(240)}</div>
          <div class="big accent" style="font-size:120px" data-k="0.6:0,1.1:1" data-fx="pop">VS</div>
          <div data-k="0.3:0,0.9:1" data-fx="pop">${GOV(240)}</div></div>`,
      },
      {
        start: 4, end: 8,
        html: `<div class="card" style="text-align:center;display:grid;gap:14px;width:800px" data-k="0:0,0.6:1">
          <div style="font-size:150px;font-weight:800;line-height:1"><span class="num" data-num="0.3:0,1.8:100000">0</span></div>
          <div style="font-size:44px;opacity:.75">${L("جنيه · لمدة سنة", "EGP · for one year")}</div></div>`,
      },
      {
        start: 8, end: 25,
        html: `<div class="chart" dir="${dir}">
          <div class="col" data-k="0:0,0.6:1">
            <div class="val"><span class="num" data-num="0.4:0,2.4:17000">0</span></div>
            <div class="track"><div class="bar" style="background:rgba(255,255,255,.55)" data-h="0.3:0,2.4:${BANK_H}"></div></div>
            <div class="lbl">${BANK(52)}<span>${L("وديعة بنك", "Bank deposit")}</span><span class="num">17%</span></div>
          </div>
          <div class="col" data-k="5.6:0,6.2:1">
            <div class="val accent"><span class="num" data-num="6:0,8:25670,11:25670,12.6:20536">0</span></div>
            <div class="track"><div class="bar" style="background:linear-gradient(#EF8A5F,#D0643A)" data-h="5.9:0,8:${TBILL_H},11:${TBILL_H},12.6:${TBILL_NET_H}"></div></div>
            <div class="lbl">${GOV(52)}<span>${L("أذون خزانة", "T-bill")}</span><span class="num" data-num="6:0,8:25.67,11:25.67,12.6:20.54" data-fmt="pct1">0%</span></div>
          </div></div>
          <div class="cap2" style="position:absolute;bottom:-10px;left:0;right:0" data-k="11:0,11.6:1">${L("بعد ضريبة 20% على أذون الخزانة · الوديعة معفاة", "After the 20% tax on T-bills · deposits are tax-free")}</div>`,
      },
      {
        start: 25, end: 30.5,
        html: `<div style="display:grid;justify-items:center;gap:24px;text-align:center">
          <div style="font-size:44px;opacity:.75" data-k="0:0,0.5:1">${L("الفرق في سنة", "Difference in a year")}</div>
          <div class="big sweep" style="font-size:190px" data-k="2:0,3.8:1" data-fx="sweep"><span class="num" data-num="0.3:0,2:3500" data-fmt="approx">≈ +0</span></div>
          <div style="font-size:44px;opacity:.75" data-k="0.8:0,1.3:1">${L("جنيه تقريبًا", "EGP, roughly")}</div></div>`,
      },
      { start: 30.5, end: 37, html: LOGO_OUTRO(lang) },
    ],
    captions: [
      { start: 0, end: 4, ar: "شهادة البنك ولا أذون الخزانة؟ تعالى نحسبها.", en: "Bank deposit or T-bill? Let's do the math." },
      { start: 4, end: 8, ar: "عندك 100,000 جنيه لمدة سنة.", en: "Say you have EGP 100,000 for one year." },
      { start: 8, end: 13.5, ar: "وديعة بنك: حوالي 17%، يعني 17,000 جنيه.", en: "Bank deposit: about 17%, so EGP 17,000." },
      { start: 13.5, end: 18.5, ar: "أذون خزانة: حوالي 25.7% قبل الضريبة.", en: "T-bill: about 25.7% before tax." },
      { start: 18.5, end: 25, ar: "بعد ضريبة الـ20%: حوالي 20.5%، يعني 20,500 جنيه.", en: "After the 20% tax: about 20.5%, so EGP 20,500." },
      { start: 25, end: 30.5, ar: "يعني حوالي 3,500 جنيه زيادة في السنة.", en: "That's about EGP 3,500 more a year." },
      { start: 30.5, end: 33.5, ar: "الأرقام بتتغير مع كل مزاد للبنك المركزي.", en: "Rates change with every central bank auction." },
      { start: 33.5, end: 37, ar: "تابع آخر الأرقام وانضم لقائمة الانتظار على agyal.net", en: "See today's numbers and join the waitlist at agyal.net" },
    ],
  };
}
