/**
 * Dharmshala price list PDF (90-day plan E10.2) -> public/chakrio-dharmshala-price-list.pdf
 *
 * Prices come from src/data/plans.json and the WhatsApp CTA from src/config/demo.js,
 * so re-run this whenever either changes:  npm run price-list   (commit the PDF)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import puppeteer from 'puppeteer';
import { DEMO_WA_NUMBER, DEMO_PREFILL_DHARMSHALA_HI, demoHref } from '../src/config/demo.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'chakrio-dharmshala-price-list.pdf');
const plans = JSON.parse(fs.readFileSync(path.join(root, 'src/data/plans.json'), 'utf8'))
  .filter((p) => p.is_public && p.segment === 'dharmshala')
  .sort((a, b) => a.sort - b.sort);

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const rooms = (p) => (p.rooms_max == null ? `${p.rooms_min}+` : `${p.rooms_min}–${p.rooms_max}`);
const phone = `+${DEMO_WA_NUMBER.slice(0, 2)} ${DEMO_WA_NUMBER.slice(2, 7)} ${DEMO_WA_NUMBER.slice(7)}`;
const link = demoHref(DEMO_PREFILL_DHARMSHALA_HI);
const qr = renderToStaticMarkup(createElement(QRCodeSVG, { value: link, size: 112, level: 'M', fgColor: '#1A1720' }));
const asOf = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const rows = plans.map((p) => `
  <tr class="${p.key === 'seva' ? 'hot' : ''}">
    <td><b>${p.name}</b>${p.key === 'seva' ? '<span class="tag">सबसे लोकप्रिय</span>' : ''}</td>
    <td>${rooms(p)}</td>
    <td class="num">${inr(p.monthly_inr)}</td>
    <td class="num">${p.annual_inr ? inr(p.annual_inr) : '<span class="muted">अनुरोध पर<br>on request</span>'}</td>
    <td class="num">${inr(p.setup_inr)}</td>
  </tr>`).join('');

const features = [
  ['एक मैसेज में पूरे ग्रुप की बुकिंग', 'A whole pilgrim group booked in one message'],
  ['हिंदी, अंग्रेज़ी या मिली-जुली भाषा में', 'Type in Hindi, English or both'],
  ['हर महीने की 1 तारीख को आय-व्यय रिपोर्ट WhatsApp पर', 'Monthly P&L on WhatsApp on the 1st'],
  ['प्रसाद, मरम्मत, हर खर्च एक मैसेज में दर्ज', 'Every expense logged in one message'],
  ['त्योहार से पहले पुराने यात्रियों को संदेश', 'Festival messages to past guests'],
  ['चेक-आउट के बाद Google रिव्यू का अनुरोध', 'Google review request after checkout'],
];

const html = `<!doctype html><html lang="hi"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font: 10.5pt/1.5 'Hanken Grotesk', 'Noto Sans Devanagari', sans-serif; color: #2B2733; background: #FFFFFF; }
  .page { padding: 13mm 15mm 10mm; height: 297mm; display: flex; flex-direction: column; }
  .hi { font-family: 'Noto Sans Devanagari', 'Hanken Grotesk', sans-serif; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #E7E2D6; padding-bottom: 5mm; }
  .brand { font-weight: 800; font-size: 20pt; letter-spacing: -.02em; color: #1A1720; }
  h1 { font-size: 17pt; line-height: 1.25; font-weight: 700; color: #1A1720; margin-top: 5mm; }
  h1 small { display: block; font: 600 11pt 'Hanken Grotesk', sans-serif; color: #7A7486; }
  .promise { margin-top: 3mm; color: #8A6A1F; font-weight: 600; }
  h2 { font-size: 11.5pt; font-weight: 700; color: #1A1720; margin: 5mm 0 2mm; }
  h2 small { font: 600 9.5pt 'Hanken Grotesk', sans-serif; color: #7A7486; margin-left: 2mm; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 8.5pt; font-weight: 600; color: #7A7486; padding: 2mm 3mm; border-bottom: 1px solid #E7E2D6; line-height: 1.3; }
  td { padding: 2.3mm 3mm; border-bottom: 1px solid #EFEBE2; font-size: 11pt; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  th.num { text-align: right; }
  tr.hot td { background: #FBF6EA; }
  .tag { display: inline-block; margin-left: 2mm; font-size: 7.5pt; font-weight: 600; color: #8A6A1F; border: 1px solid #E3D3A8; border-radius: 9999px; padding: 0 2mm; vertical-align: 1px; }
  .muted { color: #7A7486; font-size: 8.5pt; line-height: 1.2; display: inline-block; }
  .note { font-size: 9pt; color: #5E5869; margin-top: 2mm; }
  ol { list-style: none; counter-reset: s; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
  ol li { counter-increment: s; border: 1px solid #E7E2D6; border-radius: 6px; padding: 3mm; font-size: 9.5pt; line-height: 1.45; }
  ol li::before { content: counter(s); display: block; font-weight: 800; color: #A8822F; font-size: 12pt; margin-bottom: 1mm; }
  ol li .en, ul li .en { display: block; color: #7A7486; font-size: 8.5pt; margin-top: .5mm; }
  ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm 6mm; }
  ul li { font-size: 9.5pt; padding-left: 4mm; position: relative; }
  ul li::before { content: ''; position: absolute; left: 0; top: 2.2mm; width: 1.6mm; height: 1.6mm; background: #C9A24B; border-radius: 1px; }
  .addons { font-size: 9pt; color: #5E5869; margin-top: 3mm; }
  footer { margin-top: auto; display: flex; gap: 6mm; align-items: center; border-top: 1px solid #E7E2D6; padding-top: 5mm; }
  footer .cta { flex: 1; }
  footer .cta b { font-size: 13pt; color: #1A1720; display: block; }
  footer .cta .ph { font-size: 15pt; font-weight: 800; color: #1A1720; letter-spacing: .01em; margin: 1mm 0; }
  footer .small { font-size: 8.5pt; color: #7A7486; }
</style></head><body><div class="page">
  <header>
    <div class="brand">Chakrio</div>
    <div class="small">chakrio.com/dharmshala · ${asOf}</div>
  </header>

  <h1 class="hi">धर्मशाला मूल्य सूची<small>Dharmshala price list</small></h1>
  <p class="promise hi">हर बुकिंग, हर रुपया — ट्रस्टी के WhatsApp पर। <span style="color:#7A7486;font-weight:400">Every booking, every rupee, on the trustee's WhatsApp.</span></p>

  <h2 class="hi">प्लान<small>Plans, priced by room count</small></h2>
  <table>
    <thead><tr>
      <th>प्लान<br>Plan</th><th>कमरे<br>Rooms</th><th class="num">मासिक<br>Monthly</th>
      <th class="num">वार्षिक (2 महीने मुफ़्त)<br>Yearly, 2 months free</th><th class="num">सेटअप, एक बार<br>One-time setup</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="note hi">सभी कीमतें GST के अतिरिक्त। डॉरमेट्री कमरे या बेड के हिसाब से। · Prices exclude GST. Dorms billed per room or per bed.</p>

  <h2 class="hi">30 दिन का पायलट<small>How the 30-day pilot works</small></h2>
  <ol class="hi">
    <li>अपने प्लान का सेटअप शुल्क दें (प्लान के 2 महीने)।<span class="en">Pay your plan's one-time setup fee (2 months of the plan).</span></li>
    <li>हम आपके कमरे लोड करते हैं, बॉट सेट करते हैं और मैनेजर को सिखाते हैं।<span class="en">We load your rooms, set up the bot and train your manager.</span></li>
    <li>30 दिन असली बुकिंग पर चलाइए। पायलट के बाद 30 दिन में वार्षिक प्लान लें तो सेटअप शुल्क पहले साल में से घटेगा।<span class="en">Run live for 30 days. Go yearly within 30 days of the pilot ending and the setup fee comes off your first year.</span></li>
  </ol>

  <h2 class="hi">हर प्लान में<small>Every plan includes</small></h2>
  <ul class="hi">${features.map(([hi, en]) => `<li>${hi}<span class="en">${en}</span></li>`).join('')}</ul>
  <p class="addons hi">त्योहार संदेश ₹1.25 प्रति डिलीवर मैसेज · OTA चैनल मैनेजर ₹2,000/माह · Festival campaigns ₹1.25 per delivered message · OTA channel manager ₹2,000/month</p>

  <footer>
    ${qr}
    <div class="cta hi">
      <b>डेमो के लिए WhatsApp करें</b>
      <div class="ph">${phone}</div>
      <div class="small">QR स्कैन करें या इस नंबर पर लिखें · Scan or message for a demo<br>रघुलीला धाम, गोवर्धन (60 कमरे) Chakrio पर चलता है · Raghuleela Dham, Goverdhan (60 rooms) runs on Chakrio</div>
    </div>
  </footer>
</div></body></html>`;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluateHandle('document.fonts.ready');
await page.pdf({ path: out, format: 'A4', printBackground: true });
await browser.close();
console.log(`Wrote ${path.relative(root, out)} (${plans.length} plans, WhatsApp ${phone})`);
