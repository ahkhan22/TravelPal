import { categoryTotals, daySpend, tripTotal, usd } from './format';
import { GRADIENTS } from './gradients';
import type { Day, Expense, Trip } from './types';

// Builds the shareable one-page recap as a self-contained HTML document, ready
// for expo-print to render to a PDF. Mirrors the in-app recap: cover, stats,
// a day-by-day digest, and the trip wallet. Gradient "photos" render as CSS
// backgrounds, so it needs no external assets.

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Renders **bold** markers as <b>, after escaping.
function rich(s: string): string {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

function cssGradient(index: number, angle = 145): string {
  const g = GRADIENTS[((index % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length];
  return `linear-gradient(${angle}deg, ${g.join(', ')})`;
}

function photo(caption: string, gradientIndex: number, tag?: string): string {
  return `<div class="photo" style="background:${cssGradient(gradientIndex)}">
    ${tag ? `<span class="tag">${esc(tag)}</span>` : ''}
    <span class="cap">${esc(caption)}</span>
  </div>`;
}

function dayBlock(day: Day, spend: number): string {
  const heroes = `<div class="heroes ${day.heroes.length > 1 ? 'two' : ''}">
    ${day.heroes
      .slice(0, 2)
      .map((h) => photo(h.caption, h.gradient, h.favorite ? 'favorite' : `Day ${day.index}`))
      .join('')}
  </div>`;

  const ate = day.meals
    .map((m) => `<li><span>${rich(m.name)}</span><span class="c">${esc(m.receipt.usd)}</span></li>`)
    .join('');
  const saw = day.places.map((p) => `<li><span>${esc(p.name)}</span></li>`).join('');

  return `<div class="daycard">
    ${heroes}
    <div class="dc-body">
      <div class="dc-top"><span class="dc-day">DAY ${day.index}</span><h3>${esc(day.title)}</h3></div>
      <div class="dc-date">${esc(day.dateLabel)} · ${esc(usd(spend))} spent</div>
      <div class="mini"><span class="lab">ATE</span><ul>${ate || '<li><span>—</span></li>'}</ul></div>
      <div class="mini"><span class="lab">SAW</span><ul>${saw || '<li><span>—</span></li>'}</ul></div>
    </div>
  </div>`;
}

export function buildRecapHtml(trip: Trip, expenses: Expense[]): string {
  const total = tripTotal(expenses);
  const cats = categoryTotals(expenses);
  const placesCount = trip.days.reduce((n, d) => n + d.places.length, 0);
  const scanned = expenses.filter((e) => e.source === 'scan').length;
  const emailed = expenses.filter((e) => e.source === 'email').length;

  const days = trip.days.map((d) => dayBlock(d, daySpend(expenses, d.index))).join('');
  const catRows = cats
    .map(
      (c) => `<div class="row">
        <span class="lab">${esc(c.category)}</span>
        <div class="bar"><span style="width:${Math.max(3, c.share * 100)}%"></span></div>
        <span class="amt">${esc(usd(c.amount))}</span>
      </div>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
    color: #20292A; background: #FFFDF6; line-height: 1.5;
  }
  .mono { font-family: "SF Mono", Menlo, Consolas, monospace; }
  .serif { font-family: "Palatino Linotype", Palatino, Georgia, serif; }

  .cover {
    position: relative; color: #fff; padding: 30px 26px 24px; border-radius: 10px; overflow: hidden;
    background: ${cssGradient(trip.coverGradient, 150)};
  }
  .cover::after { content:""; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(10,14,15,.05), rgba(10,14,15,.66)); }
  .cover > * { position: relative; z-index: 1; }
  .kicker { font-family: "SF Mono", Menlo, monospace; font-size: 10px; letter-spacing: .22em; text-transform: uppercase; margin: 0 0 10px; opacity:.92; }
  .cover h1 { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-size: 42px; line-height: 1; margin: 0 0 8px; }
  .cover .sub { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-style: italic; font-size: 15px; margin: 0 0 16px; opacity:.96; }
  .cover .route { font-family: "SF Mono", Menlo, monospace; font-size: 11px; border-top: 1px solid rgba(255,255,255,.24); padding-top: 12px; }

  .stats { display: flex; border: 1px solid #E4DCC9; border-top: 0; margin-bottom: 22px; }
  .stat { flex: 1; padding: 14px; border-left: 1px solid #E4DCC9; }
  .stat:first-child { border-left: 0; }
  .stat .n { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-size: 24px; font-weight: 600; }
  .stat .l { font-family: "SF Mono", Menlo, monospace; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: #6C675A; margin-top: 4px; }

  h2.sec { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-size: 20px; margin: 0 0 14px; }
  h2.sec .idx { font-family: "SF Mono", Menlo, monospace; font-size: 11px; color: #C98A00; margin-right: 8px; }

  .daycard { display: grid; grid-template-columns: 1fr 1.15fr; gap: 16px; border: 1px solid #E4DCC9; border-radius: 9px; padding: 12px; margin-bottom: 12px; break-inside: avoid; }
  .heroes { display: grid; gap: 6px; } .heroes.two { grid-template-columns: 1fr 1fr; }
  .photo { position: relative; border-radius: 5px; overflow: hidden; aspect-ratio: 4/3; display: flex; align-items: flex-end; color:#fff; }
  .photo::after { content:""; position:absolute; inset:0; background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,.55)); }
  .photo .cap { position: relative; z-index:1; padding: 8px 10px; font-size: 10.5px; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,.5); }
  .photo .tag { position: absolute; top: 6px; right: 6px; z-index:1; font-family:"SF Mono",monospace; font-size: 8.5px; background: rgba(0,0,0,.42); padding: 2px 6px; border-radius: 20px; }
  .dc-day { font-family:"SF Mono",monospace; font-size: 10px; letter-spacing: .12em; color: #C98A00; }
  .dc-top h3 { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-size: 18px; margin: 2px 0 0; display: inline; margin-left: 8px; }
  .dc-date { font-family:"SF Mono",monospace; font-size: 10px; color: #6C675A; margin: 4px 0 10px; }
  .mini { display: grid; grid-template-columns: auto 1fr; gap: 8px; margin-bottom: 6px; }
  .mini .lab { font-family:"SF Mono",monospace; font-size: 8.5px; letter-spacing: .1em; color: #6C675A; border: 1px solid #E4DCC9; border-radius: 20px; padding: 2px 8px; height: fit-content; }
  .mini ul { margin: 0; padding: 0; list-style: none; font-size: 12.5px; }
  .mini li { display: flex; justify-content: space-between; gap: 8px; }
  .mini .c { font-family:"SF Mono",monospace; color: #6C675A; font-size: 11px; }

  .wallet { border: 1px solid #E4DCC9; border-radius: 9px; padding: 16px; break-inside: avoid; }
  .w-total { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-size: 34px; font-weight: 600; }
  .w-sub { font-family:"SF Mono",monospace; font-size: 11px; color: #6C675A; margin: 4px 0 14px; }
  .row { display: flex; align-items: center; gap: 12px; margin-bottom: 9px; }
  .row .lab { font-family:"SF Mono",monospace; font-size: 10.5px; text-transform: uppercase; color: #6C675A; width: 80px; }
  .row .bar { flex: 1; height: 8px; border-radius: 20px; background: #E4DCC9; overflow: hidden; }
  .row .bar span { display: block; height: 100%; background: linear-gradient(90deg, #0F5D63, #C98A00); }
  .row .amt { font-family:"SF Mono",monospace; font-size: 12px; width: 48px; text-align: right; }

  .foot { margin-top: 18px; text-align: center; font-family:"SF Mono",monospace; font-size: 10px; color: #6C675A; }
</style></head>
<body>
  <div class="cover">
    <p class="kicker">✦ TravelPal · Trip Recap</p>
    <h1>${esc(trip.title)}</h1>
    <p class="sub">${esc(trip.subtitle)}</p>
    <div class="route">${esc(trip.route)}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="n">${trip.days.length}</div><div class="l">Days</div></div>
    <div class="stat"><div class="n">${placesCount}</div><div class="l">Places</div></div>
    <div class="stat"><div class="n">${esc(usd(total))}</div><div class="l">Spend</div></div>
    <div class="stat"><div class="n">${trip.photosKept}</div><div class="l">Photos</div></div>
  </div>

  <h2 class="sec"><span class="idx">01</span>The trip, day by day</h2>
  ${days}

  <h2 class="sec" style="margin-top:22px"><span class="idx">02</span>Trip wallet</h2>
  <div class="wallet">
    <div class="w-total">${esc(usd(total))}</div>
    <div class="w-sub">${scanned} receipts scanned · ${emailed} from email</div>
    ${catRows}
  </div>

  <div class="foot">✦ Made with TravelPal — everywhere I went, ate &amp; spent, on one page.</div>
</body></html>`;
}
