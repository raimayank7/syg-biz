(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, v = B.v;
  function unit(o) {
    var net = o.inc ? o.price / (1 + o.gst / 100) : o.price;
    var fbase = o.base === 'inc' ? (o.inc ? o.price : o.price * (1 + o.gst / 100)) : net;
    var fees = fbase * (o.comm + o.other) / 100 + o.fixed + o.ship;
    var fg = o.fitc ? 0 : fees * o.fgst / 100;
    var profit = net - o.cost - fees - fg - o.pack - o.ads;
    var exp = (1 - o.ret / 100) * profit - o.ret / 100 * o.retloss;
    return { net: net, fees: fees, fgst: fg, profit: profit, margin: net ? profit / net * 100 : 0, roi: o.cost ? profit / o.cost * 100 : 0, expected: exp };
  }
  function solve(m, o) {
    var p0 = {}, p1 = {}, k;
    for (k in o) { p0[k] = o[k]; p1[k] = o[k]; }
    p0.price = 0; p1.price = 1;
    var b = unit(p0).profit, a = unit(p1).profit - b, g = unit(p1).net, den = m / 100 * g - a;
    return den >= 0 ? null : b / den;
  }
  window.PROFITX = { unit: unit, solve: solve };
  function read(p) {
    return { cost: v(p + 'cost'), price: v(p + 'price'), inc: B.s(p + 'inc') === '1' ? 1 : 0, gst: v(p + 'gst'), comm: v(p + 'comm'), fixed: v(p + 'fixed'), ship: v(p + 'ship'), other: v(p + 'other'),
      base: B.s(p + 'base') || 'ex', pack: v(p + 'pack'), ads: v(p + 'ads'), fgst: v(p + 'fgst'), fitc: B.s(p + 'fitc') === '1' ? 1 : 0, ret: v(p + 'ret'), retloss: v(p + 'retloss') };
  }
  function out(el, html, copy) {
    el.hidden = false; el.className = 'result';
    el.innerHTML = html + (copy ? '<div class="acts"><button class="btn sm" type="button" data-copy="' + B.esc(copy) + '">Copy result</button><button class="btn sm ghost" type="button" data-wa="' + B.esc(copy) + '">WhatsApp</button></div>' : '');
  }
  function row(a, b, strong) { return '<tr' + (strong ? ' class="bz-total"' : '') + '><td>' + a + '</td><td class="bz-n">' + b + '</td></tr>'; }
  function wire(id, fn) {
    var f = document.getElementById(id); if (!f) return;
    var go = function () { fn(f); };
    f.addEventListener('submit', function (e) { e.preventDefault(); go(); });
    f.addEventListener('input', go); f.addEventListener('change', go); go();
  }
  function pc(n) { return (Math.round(n * 10) / 10) + '%'; }
  wire('pf-form', function () {
    var c = B.s('pf-cur'), o = read('pf-'), r = unit(o), res = $('#pf-res');
    if (o.price <= 0) { out(res, '<h2>Enter the selling price</h2>'); return; }
    var good = r.profit > 0, per100 = r.expected * 100;
    var txt = 'Selling at ' + B.fmt2(o.price, c) + ': profit ' + B.fmt2(r.profit, c) + ' per delivered unit (' + pc(r.margin) + ' margin, ' + pc(r.roi) + ' return on cost); about ' + B.fmt(per100, c) + ' per 100 orders after returns.';
    out(res, '<h2>' + (good ? 'Profit per unit' : 'Loss per unit') + ' <span class="big">' + B.fmt2(r.profit, c) + '</span></h2><div class="tbl"><table><tbody>' +
      row('Selling price you set', B.fmt2(o.price, c)) + row('Sale value without GST', B.fmt2(r.net, c)) + row('What the unit costs you', '-' + B.fmt2(o.cost, c)) + row('Platform fees and shipping', '-' + B.fmt2(r.fees, c)) +
      row('GST on fees you cannot claim', '-' + B.fmt2(r.fgst, c)) + row('Packaging', '-' + B.fmt2(o.pack, c)) + row('Advertising per order', '-' + B.fmt2(o.ads, c)) +
      row('Profit per delivered unit', B.fmt2(r.profit, c), true) + row('Profit margin on sale value', pc(r.margin)) + row('Return on what you spend on the unit', pc(r.roi)) +
      row('After ' + o.ret + '% returns: profit per order placed', B.fmt2(r.expected, c), true) + row('Per 100 orders placed', B.fmt(per100, c)) + '</tbody></table></div>' +
      (good ? '' : '<p class="bz-warn">At this price every unit loses money. Raise the price, cut a cost, or look at the break-even price on the <a href="/profit/target-price/">target price</a> page.</p>'), txt);
  });
  wire('tp-form', function () {
    var c = B.s('tp-cur'), o = read('tp-'), m = v('tp-margin'), res = $('#tp-res');
    var be = solve(0, o), tg = solve(m, o);
    if (be === null) { out(res, '<h2>No break-even price</h2><p>With these costs and fees, a higher price does not produce a profit. Check that fees as a percentage are below 100.</p>'); return; }
    if (tg === null) { out(res, '<h2>That margin cannot be reached</h2><p>Fees take too large a share of the price for a ' + m + '% margin. Lower the margin or the percentage fees.</p>'); return; }
    var rr = unit(Object.assign({}, o, { price: tg }));
    var sp = o.inc ? tg : tg;
    out(res, '<h2>Sell at <span class="big">' + B.fmt2(tg, c) + '</span> for a ' + m + '% margin</h2><div class="tbl"><table><tbody>' + row('Break-even price (profit zero)', B.fmt2(be, c)) + row('Price for ' + m + '% margin', B.fmt2(tg, c), true) +
      row('Profit per unit at that price', B.fmt2(rr.profit, c)) + row('Margin check', pc(rr.margin)) + row('Sale value without GST', B.fmt2(rr.net, c)) + '</tbody></table></div><p>The price is ' + (o.inc ? 'the price the customer pays, GST included.' : 'the price before GST.') + ' Round it to a price customers like, for example ' + B.fmt(Math.ceil(tg / 10) * 10 - 1, c) + ', and check the margin again.</p>',
      'To make a ' + m + '% margin I should price at ' + B.fmt2(tg, c) + ' (break-even ' + B.fmt2(be, c) + ').');
  });
  wire('be-form', function () {
    var c = B.s('be-cur'), res = $('#be-res'), fixed = v('be-fixed'), pr = v('be-profit'), tgt = v('be-target');
    if (pr <= 0) { out(res, '<h2>Profit per unit must be above zero</h2><p>Find the profit per unit on the <a href="/profit/">main calculator</a> first.</p>'); return; }
    var n = Math.ceil(fixed / pr), t = Math.ceil((fixed + tgt) / pr);
    out(res, '<h2>You must sell <span class="big">' + n.toLocaleString('en-IN') + '</span> units a month to break even</h2><div class="tbl"><table><tbody>' + row('Fixed costs a month', B.fmt(fixed, c)) + row('Profit per unit', B.fmt2(pr, c)) + row('Units to cover fixed costs', n.toLocaleString('en-IN'), true) +
      row('Units to also earn ' + B.fmt(tgt, c) + ' a month', t.toLocaleString('en-IN')) + row('Orders a day for that (30 days)', (t / 30).toFixed(1)) + '</tbody></table></div>',
      'To cover ' + B.fmt(fixed, c) + ' of fixed costs I must sell ' + n + ' units a month (' + t + ' to also earn ' + B.fmt(tgt, c) + ').');
  });
  wire('mm-form', function () {
    var res = $('#mm-res'), cost = v('mm-cost'), k = v('mm-markup'), m = v('mm-margin'), mode = B.s('mm-mode'), c = B.s('mm-cur');
    var markup = mode === 'markup' ? k : (m < 100 ? m / (100 - m) * 100 : NaN), margin = mode === 'markup' ? k / (100 + k) * 100 : m;
    var price = cost * (1 + markup / 100);
    out(res, '<h2>Markup ' + pc(markup) + ' means margin ' + pc(margin) + '</h2><div class="tbl"><table><tbody>' + row('Cost', B.fmt2(cost, c)) + row('Selling price', B.fmt2(price, c), true) + row('Profit per unit', B.fmt2(price - cost, c)) + row('Markup (profit / cost)', pc(markup)) + row('Margin (profit / price)', pc(margin)) + '</tbody></table></div>',
      'Cost ' + B.fmt2(cost, c) + ', price ' + B.fmt2(price, c) + ': markup ' + pc(markup) + ', margin ' + pc(margin) + '.');
  });
  wire('gi-form', function () {
    var res = $('#gi-res'), c = B.s('gi-cur'), a = v('gi-amount'), g = v('gi-gst'), mode = B.s('gi-mode'), ex, inc;
    if (mode === 'inc') { inc = a; ex = a / (1 + g / 100); } else { ex = a; inc = a * (1 + g / 100); }
    out(res, '<h2>' + (mode === 'inc' ? 'Price without GST' : 'Price with GST') + ' <span class="big">' + B.fmt2(mode === 'inc' ? ex : inc, c) + '</span></h2><div class="tbl"><table><tbody>' + row('Price without GST', B.fmt2(ex, c)) + row('GST at ' + g + '%', B.fmt2(inc - ex, c)) + row('Price with GST', B.fmt2(inc, c), true) + '</tbody></table></div>' +
      '<p>Wrong way: taking ' + g + '% off a GST-inclusive price gives ' + B.fmt2(inc - inc * g / 100, c) + ', which is not the true price without GST.</p>', 'Price without GST ' + B.fmt2(ex, c) + ', GST ' + B.fmt2(inc - ex, c) + ', price with GST ' + B.fmt2(inc, c) + '.');
  });
  wire('rr-form', function () {
    var res = $('#rr-res'), c = B.s('rr-cur'), profit = v('rr-profit'), loss = v('rr-loss'), n = v('rr-orders'), r = v('rr-rate');
    var back = n * r / 100, kept = n - back, total = kept * profit - back * loss, per = n ? total / n : 0, be = loss + profit ? (profit / (profit + loss) * 100) : 0;
    out(res, '<h2>After returns you earn <span class="big">' + B.fmt(total, c) + '</span> on ' + n + ' orders</h2><div class="tbl"><table><tbody>' + row('Orders kept', Math.round(kept)) + row('Orders returned (' + r + '%)', Math.round(back)) + row('Profit from kept orders', B.fmt(kept * profit, c)) + row('Loss on returned orders', '-' + B.fmt(back * loss, c)) +
      row('Total profit', B.fmt(total, c), true) + row('Profit per order placed', B.fmt2(per, c)) + row('Return rate at which profit is zero', pc(be)) + '</tbody></table></div>',
      n + ' orders with ' + r + '% returns give ' + B.fmt(total, c) + ' profit (' + B.fmt2(per, c) + ' per order).');
  });
  wire('ad-form', function () {
    var res = $('#ad-res'), c = B.s('ad-cur'), price = v('ad-price'), profit = v('ad-profit'), spend = v('ad-spend'), sales = v('ad-sales');
    var roas = spend ? sales * price / spend : 0, acos = sales * price ? spend / (sales * price) * 100 : 0, cpo = sales ? spend / sales : 0;
    var beacos = price ? (profit + 0) / price * 100 : 0;
    var net = sales * profit - spend;
    out(res, '<h2>Ads ' + (net >= 0 ? 'add' : 'cost') + ' <span class="big">' + B.fmt(Math.abs(net), c) + '</span> this month</h2><div class="tbl"><table><tbody>' + row('Ad spend', B.fmt(spend, c)) + row('Orders from ads', sales) + row('Ad cost per order', B.fmt2(cpo, c)) + row('Sales from ads', B.fmt(sales * price, c)) + row('ROAS (sales / spend)', roas.toFixed(2)) +
      row('ACOS (spend / sales)', pc(acos)) + row('Break-even ACOS (profit before ads / price)', pc(beacos)) + row('Profit before ads on those orders', B.fmt(sales * profit, c)) + row('Profit after ads', B.fmt(net, c), true) + '</tbody></table></div>' +
      '<p>Enter the profit per unit <b>before</b> advertising. If your ACOS is above the break-even ACOS, each ad sale loses money; ads may still be worth it if they bring repeat customers, but plan for that.</p>', 'Ad spend ' + B.fmt(spend, c) + ' brought ' + sales + ' orders: ROAS ' + roas.toFixed(2) + ', ACOS ' + pc(acos) + ', profit after ads ' + B.fmt(net, c) + '.');
  });
  wire('ds-form', function () {
    var res = $('#ds-res'), margin = v('ds-margin'), d = v('ds-disc');
    if (d >= margin) { out(res, '<h2>The discount is as large as your margin</h2><p>At a discount of ' + d + '% against a margin of ' + margin + '% you make no profit per unit, so no amount of extra sales recovers it.</p>'); return; }
    var lift = d / (margin - d) * 100;
    out(res, '<h2>You must sell <span class="big">' + pc(lift) + '</span> more units</h2><p>To earn the same total profit after a ' + d + '% price cut, when the margin per unit is ' + margin + '% of the old price, sales must rise by ' + pc(lift) + '. If you sell 100 units now, you need ' + Math.ceil(100 * (1 + lift / 100)) + ' after the cut.</p>',
      'A ' + d + '% discount on a ' + margin + '% margin needs ' + pc(lift) + ' more sales to earn the same profit.');
  });
  wire('bn-form', function () {
    var res = $('#bn-res'), c = B.s('bn-cur'), p1 = v('bn-p1'), c1 = v('bn-c1'), p2 = v('bn-p2'), c2 = v('bn-c2'), disc = v('bn-disc'), pack = v('bn-pack');
    var sep = p1 + p2, price = sep * (1 - disc / 100), cost = c1 + c2 + pack, profit = price - cost, profitSep = (p1 - c1) + (p2 - c2);
    out(res, '<h2>Bundle price <span class="big">' + B.fmt2(price, c) + '</span></h2><div class="tbl"><table><tbody>' + row('Bought separately', B.fmt2(sep, c)) + row('Bundle discount', pc(disc)) + row('Bundle price', B.fmt2(price, c), true) + row('Cost of both and the shared pack', B.fmt2(cost, c)) +
      row('Profit on the bundle', B.fmt2(profit, c)) + row('Profit if sold separately', B.fmt2(profitSep, c)) + row('Margin on the bundle price', pc(price ? profit / price * 100 : 0)) + '</tbody></table></div>', 'Bundle at ' + B.fmt2(price, c) + ' gives ' + B.fmt2(profit, c) + ' profit.');
  });
  wire('cf-form', function () {
    var res = $('#cf-res'), c = B.s('cf-cur'), cost = v('cf-cost'), stock = v('cf-days'), pay = v('cf-pay'), units = v('cf-units');
    var cycle = stock + pay, tied = cost * units * cycle / 30, turns = cycle ? 365 / cycle : 0;
    out(res, '<h2>About <span class="big">' + B.fmt(tied, c) + '</span> of your money is tied up</h2><div class="tbl"><table><tbody>' + row('Days stock waits to sell', stock) + row('Days from delivery to payout', pay) + row('Days from buying to cash back', cycle, true) + row('Units sold a month', units) + row('Money tied up on average', B.fmt(tied, c)) + row('Times a year your money turns over', turns.toFixed(1)) + '</tbody></table></div>' +
      '<p>A slow payout or slow stock makes the same profit per unit worth less, because the money is stuck longer. Faster turnover, even at a smaller margin, can earn more per year.</p>', 'Money tied up: ' + B.fmt(tied, c) + ' (cycle ' + cycle + ' days).');
  });
})();
