(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, v = B.v;
  function rate(goal, costs, tax, save, off, hpw, share, dpw) {
    var k = 1 - (tax + save) / 100, profit = goal / k, rev = profit + costs, weeks = 52 - off;
    var bh = weeks * hpw * share / 100, bd = weeks * dpw * share / 100;
    return { rev: rev, profit: profit, tax: profit * tax / 100, save: profit * save / 100, hourly: rev / bh, daily: rev / bd, monthly: rev / 12, bh: bh, bd: bd };
  }
  function project(hours, hourly, buffer, direct, rush, dep) {
    var base = hours * hourly, buf = base * buffer / 100, sub = base + buf + direct, rsh = sub * rush / 100, total = sub + rsh;
    return { base: base, buf: buf, direct: direct, rush: rsh, total: total, deposit: total * dep / 100, eff: hours ? total / hours : 0 };
  }
  window.RATEX = { rate: rate, project: project };
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
  wire('rt-form', function () {
    var c = B.s('rt-cur'), res = $('#rt-res'), tax = v('rt-tax'), save = v('rt-save'), off = v('rt-off'), hpw = v('rt-hpw'), share = v('rt-share'), dpw = v('rt-dpw');
    if (tax + save >= 95) { out(res, '<h2>Check the percentages</h2><p>Tax and savings together must be below 95 percent of profit.</p>'); return; }
    if (off >= 52 || hpw <= 0 || share <= 0 || dpw <= 0) { out(res, '<h2>Check the time</h2><p>Weeks off must be below 52, and hours, billable share and days must be above zero.</p>'); return; }
    var r = rate(v('rt-goal'), v('rt-costs'), tax, save, off, hpw, share, dpw);
    var txt = 'To take home ' + B.fmt(v('rt-goal'), c) + ' a year I need to earn ' + B.fmt(r.rev, c) + ': about ' + B.fmt(r.hourly, c) + ' an hour, ' + B.fmt(r.daily, c) + ' a day or ' + B.fmt(r.monthly, c) + ' a month (' + Math.round(r.bh) + ' billable hours a year).';
    out(res, '<h2>You need about <span class="big">' + B.fmt(r.hourly, c) + '</span> an hour</h2><div class="tbl"><table><tbody>' +
      row('Hourly rate (floor)', B.fmt(r.hourly, c), true) + row('Day rate', B.fmt(r.daily, c)) + row('Monthly income to bill', B.fmt(r.monthly, c)) +
      row('Yearly income to bill', B.fmt(r.rev, c)) + row('of which business costs', B.fmt(v('rt-costs'), c)) + row('of which tax', B.fmt(r.tax, c)) + row('of which savings', B.fmt(r.save, c)) +
      row('Take-home you wanted', B.fmt(v('rt-goal'), c)) + row('Billable hours a year', Math.round(r.bh).toLocaleString('en-IN')) + row('Billable days a year', Math.round(r.bd).toLocaleString('en-IN')) +
      '</tbody></table></div><p>This is your floor, the lowest rate that meets your goal. Price above it when the work is worth more to the client.</p>', txt);
  });
  wire('pj-form', function () {
    var c = B.s('pj-cur'), res = $('#pj-res'), h = v('pj-hours');
    if (h <= 0) { out(res, '<h2>Enter the hours</h2><p>Enter the hours you expect the job to take.</p>'); return; }
    var p = project(h, v('pj-rate'), v('pj-buf'), v('pj-direct'), v('pj-rush'), v('pj-dep'));
    var over25 = p.total / (h * 1.25), over50 = p.total / (h * 1.5);
    var txt = 'Quote: ' + B.fmt(p.total, c) + ' for about ' + h + ' hours (deposit ' + B.fmt(p.deposit, c) + ').';
    out(res, '<h2>Quote <span class="big">' + B.fmt(p.total, c) + '</span></h2><div class="tbl"><table><tbody>' +
      row('Work (' + h + ' hours at ' + B.fmt(v('pj-rate'), c) + ')', B.fmt(p.base, c)) + row('Buffer for surprises', B.fmt(p.buf, c)) + row('Direct costs (licences, stock, travel)', B.fmt(p.direct, c)) +
      row('Rush fee', B.fmt(p.rush, c)) + row('Total quote', B.fmt(p.total, c), true) + row('Deposit to ask first', B.fmt(p.deposit, c)) + row('Balance later', B.fmt(p.total - p.deposit, c)) +
      '</tbody></table></div><p>If the job takes 25 percent longer than you planned, you still earn about ' + B.fmt(over25, c) + ' an hour. If it takes 50 percent longer, about ' + B.fmt(over50, c) + ' an hour (direct costs are included in these figures, so they are slightly low).</p>', txt);
  });
  wire('cv-form', function () {
    var c = B.s('cv-cur'), res = $('#cv-res'), r = v('cv-rate'), hpd = v('cv-hpd'), dpw = v('cv-dpw'), wk = v('cv-weeks');
    var day = r * hpd, week = day * dpw, month = week * 52 / 12, year = week * wk;
    out(res, '<h2>If every day is fully billed</h2><div class="tbl"><table><tbody>' + row('Hourly rate', B.fmt(r, c)) + row('Day (' + hpd + ' billed hours)', B.fmt(day, c)) + row('Week (' + dpw + ' days)', B.fmt(week, c)) +
      row('Month (average)', B.fmt(month, c), true) + row('Year (' + wk + ' working weeks)', B.fmt(year, c)) + '</tbody></table></div><p>Real income is lower because not every hour is billed. Multiply by your billable share to see the realistic figure: at 50 percent the year is about ' + B.fmt(year / 2, c) + '.</p>',
      B.fmt(r, c) + ' an hour is ' + B.fmt(day, c) + ' a day, ' + B.fmt(week, c) + ' a week and ' + B.fmt(month, c) + ' a month at full billing.');
  });
  wire('rs-form', function () {
    var c = B.s('rs-cur'), res = $('#rs-res'), o = v('rs-old'), n = v('rs-new'), h = v('rs-hours');
    if (o <= 0 || n <= 0) { out(res, '<h2>Enter both rates</h2>'); return; }
    if (n <= o) { out(res, '<h2>The new rate is not higher</h2><p>Enter a new rate above the old one to see how many clients you can afford to lose.</p>'); return; }
    var keep = o / n, now = o * h, lose = 1 - keep;
    out(res, '<h2>You can lose up to <span class="big">' + Math.round(lose * 100) + '%</span> of your billed hours</h2><p>At ' + B.fmt(n, c) + ' an hour you earn the same as now with ' + Math.round(keep * 100) + ' percent of the hours.</p><div class="tbl"><table><tbody>' +
      row('Hours billed a month now', h) + row('Income a month now', B.fmt(now, c)) + row('Hours needed at the new rate for the same income', (h * keep).toFixed(1), true) + row('Hours freed for new work or rest', (h - h * keep).toFixed(1)) +
      row('Income if you keep every hour', B.fmt(n * h, c)) + '</tbody></table></div>',
      'Raising my rate from ' + B.fmt(o, c) + ' to ' + B.fmt(n, c) + ' means I can lose up to ' + Math.round(lose * 100) + '% of my billed hours and still earn the same.');
  });
  wire('rn-form', function () {
    var c = B.s('rn-cur'), res = $('#rn-res'), h = v('rn-hours'), r = v('rn-rate'), d = v('rn-disc'), x = v('rn-extra');
    var list = h * r, price = list * (1 - d / 100), eff = h ? price / h : 0;
    out(res, '<h2>Monthly retainer <span class="big">' + B.fmt(price, c) + '</span></h2><div class="tbl"><table><tbody>' + row('Hours included', h) + row('At your normal rate', B.fmt(list, c)) + row('Discount for steady work', '-' + B.fmt(list - price, c)) +
      row('Monthly retainer', B.fmt(price, c), true) + row('Effective hourly rate', B.fmt(eff, c)) + row('Extra hours beyond the retainer', B.fmt(x, c) + ' an hour') + '</tbody></table></div>' +
      '<p>If the client uses 20 percent more hours than the retainer covers and you do not charge for them, your effective rate falls to about ' + B.fmt(price / (h * 1.2), c) + ' an hour.</p>',
      'Retainer: ' + B.fmt(price, c) + ' a month for ' + h + ' hours (' + B.fmt(eff, c) + ' an hour). Extra hours ' + B.fmt(x, c) + ' an hour.');
  });
  wire('pr-form', function () {
    var esc = B.esc, c = B.s('pr-cur'), v = function (id) { return B.s(id).trim(); }, lines = function (id) { return B.s(id).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
    var items = lines('pr-items').map(function (l) { var i = l.lastIndexOf(','); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), parseFloat(l.slice(i + 1))]; }), total = items.reduce(function (a, x) { return a + (isFinite(x[1]) ? x[1] : 0); }, 0), dep = v('pr-dep') ? parseFloat(v('pr-dep')) || 0 : 0;
    var h = '<div style="max-width:720px;margin:0 auto;padding:18px;font:15px/1.5 system-ui,sans-serif;color:#000;background:#fff"><div style="font-size:24px;font-weight:800">Proposal: ' + esc(v('pr-title')) + '</div><p>Prepared for <b>' + esc(v('pr-client')) + '</b> by <b>' + esc(v('pr-me')) + '</b>' + (v('pr-contact') ? ', ' + esc(v('pr-contact')) : '') + '. Date: ' + new Date().toLocaleDateString('en-IN') + '.</p>' +
      '<h3>The problem and the aim</h3><p>' + esc(v('pr-aim')) + '</p><h3>What I will do</h3><ul>' + lines('pr-scope').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><h3>Not included</h3><ul>' + lines('pr-no').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h3>Time</h3><p>' + esc(v('pr-time')) + '</p><h3>Price</h3><table style="width:100%;border-collapse:collapse">' + items.map(function (x) { return '<tr><td style="border-bottom:1px solid #aaa;padding:4px">' + esc(x[0]) + '</td><td style="border-bottom:1px solid #aaa;padding:4px;text-align:right">' + (isFinite(x[1]) ? esc(B.fmt(x[1], c)) : '') + '</td></tr>'; }).join('') + '<tr><td style="padding:4px"><b>Total</b></td><td style="padding:4px;text-align:right"><b>' + esc(B.fmt(total, c)) + '</b></td></tr></table>' +
      '<h3>Payment</h3><p>' + (dep ? 'A deposit of ' + esc(dep) + '% (' + esc(B.fmt(total * dep / 100, c)) + ') is due before work starts. ' : '') + esc(v('pr-terms')) + '</p><h3>Revisions</h3><p>' + esc(v('pr-rev')) + '</p><p>This proposal is valid for ' + esc(v('pr-valid') || '14') + ' days.</p><p style="margin-top:28px">Accepted by: ______________________ &nbsp; Date: ____________</p></div>';
    $('#pr-out').innerHTML = '<div class="bz-sheet" style="max-height:520px;overflow:auto;background:#fff;color:#000">' + h + '</div><div class="acts"><button class="btn" type="button" id="pr-print">Print or save as PDF</button></div>';
    $('#pr-print').onclick = function () { B.printHtml(h); };
  });
  wire('bh-form', function () {
    var res = $('#bh-res'), b = v('bh-b'), f = v('bh-f'), a = v('bh-a'), u = v('bh-u'), t = b + f + a + u;
    if (t <= 0) { out(res, '<h2>Enter your hours</h2>'); return; }
    var pct = function (x) { return Math.round(x / t * 100) + '%'; };
    out(res, '<h2>Your billable share is <span class="big">' + pct(b) + '</span></h2><div class="tbl"><table><tbody>' + row('Total hours worked', t) + row('Billed to clients', b + ' (' + pct(b) + ')') + row('Finding work', f + ' (' + pct(f) + ')') + row('Admin and learning', a + ' (' + pct(a) + ')') +
      row('Unpaid client work', u + ' (' + pct(u) + ')') + '</tbody></table></div><p>Use ' + Math.round(b / t * 100) + ' in the billable share box of the <a href="/pricing/">rate calculator</a>.</p>', 'My billable share is ' + pct(b) + ' of ' + t + ' hours.');
  });
})();
