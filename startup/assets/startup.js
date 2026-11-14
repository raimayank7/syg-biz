(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, esc = B.esc;
  function m(n) { return (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN'); }
  function wire(id, fn) { var f = document.getElementById(id); if (!f) return; var go = function () { fn(f); }; f.addEventListener('input', go); f.addEventListener('change', go); f.addEventListener('submit', function (e) { e.preventDefault(); go(); }); go(); }
  function row(a, b, t) { return '<tr' + (t ? ' class="bz-total"' : '') + '><td>' + a + '</td><td class="bz-n">' + b + '</td></tr>'; }
  function emi(p, rate, years) { var r = rate / 1200, n = Math.round(years * 12); if (n <= 0) return 0; if (r === 0) return p / n; var g = Math.pow(1 + r, n); return p * r * g / (g - 1); }
  window.STARTX = { emi: emi };
  wire('sc-form', function () {
    var lines = B.s('sc-lines').split('\n').map(function (l) { var i = l.lastIndexOf(','); return i < 0 ? null : [l.slice(0, i).trim(), parseFloat(l.slice(i + 1))]; }).filter(function (x) { return x && x[0] && isFinite(x[1]); });
    var sum = lines.reduce(function (a, x) { return a + x[1]; }, 0), cont = sum * B.v('sc-c') / 100, wc = B.v('sc-fix') * B.v('sc-mo'), total = sum + cont + wc, own = B.v('sc-own'), loan = Math.max(0, total - own), e = emi(loan, B.v('sc-rate'), B.v('sc-yr'));
    $('#sc-out').innerHTML = '<div class="result"><h2>You need about <span class="big">' + m(total) + '</span> to start</h2><div class="tbl"><table><tbody>' + row('One-time items (' + lines.length + ' lines)', m(sum)) + row('Safety margin for surprises (' + B.v('sc-c') + '%)', m(cont)) + row('Working money: ' + B.v('sc-mo') + ' months of fixed costs', m(wc)) + row('Total needed', m(total), 1) + row('Your own money', m(own)) + row('Still to find', m(loan), 1) +
      (loan > 0 && B.v('sc-yr') > 0 ? row('Monthly instalment if borrowed at ' + B.v('sc-rate') + '% for ' + B.v('sc-yr') + ' years', m(e)) + row('Total interest over the loan', m(e * B.v('sc-yr') * 12 - loan)) : '') + '</tbody></table></div><p>The instalment must be paid from the profit of the business whether or not sales are good. Check it against your <a href="/startup/monthly-profit/">monthly profit estimate</a>.</p></div>';
  });
  wire('mp-form', function () {
    var price = B.v('mp-p'), per = B.v('mp-n'), days = B.v('mp-d'), vc = B.v('mp-v'), fix = B.v('mp-f'), pay = B.v('mp-o'), emiv = B.v('mp-e'), sales = per * days, rev = sales * price, contrib = price - vc, gross = sales * contrib, profit = gross - fix - emiv, after = profit - pay;
    var be = contrib > 0 ? Math.ceil((fix + emiv) / contrib) : 0, bed = days ? be / days : 0;
    $('#mp-out').innerHTML = '<div class="result"><h2>' + (profit >= 0 ? 'Profit before your own pay' : 'Loss') + ' <span class="big">' + m(profit) + '</span> a month</h2><div class="tbl"><table><tbody>' + row('Sales a month (' + per + ' a day x ' + days + ' days)', sales) + row('Money from sales', m(rev)) + row('Left after the cost of what you sell', m(gross)) + row('Fixed costs (rent, power, wages, other)', '-' + m(fix)) + row('Loan instalment', '-' + m(emiv)) + row('Profit before your own pay', m(profit), 1) + row('Your pay you want', '-' + m(pay)) + row('What is left', m(after), 1) + '</tbody></table></div>' +
      (contrib > 0 ? '<p>To cover fixed costs and the instalment you must make about <b>' + be + ' sales a month</b>, or about <b>' + (Math.round(bed * 10) / 10) + ' a day</b>. At ' + per + ' a day you have ' + (per >= bed && bed ? 'a cushion of ' + Math.round((per - bed) / per * 100) + '%' : 'no cushion: you are below the break-even') + '. Try 70% of your sales figure to see how the business behaves in a slow month.</p>' : '<p class="bz-warn">The cost of what you sell is as large as the price. Raise the price or lower the cost.</p>') + '</div>';
  });
  wire('em-form', function () {
    var p = B.v('em-p'), r = B.v('em-r'), y = B.v('em-y'), e = emi(p, r, y), n = Math.round(y * 12);
    $('#em-out').innerHTML = '<div class="result"><h2>Monthly instalment <span class="big">' + m(e) + '</span></h2><div class="tbl"><table><tbody>' + row('Loan', m(p)) + row('Yearly rate', r + '%') + row('Months', n) + row('Total paid back', m(e * n), 1) + row('Interest paid', m(e * n - p)) + '</tbody></table></div><p>An instalment of this size is the one the lender asks for each month. Banks may also charge fees, which are not included.</p></div>';
  });
  var QS = ['I know who my customers are and can name five of them.', 'I have talked to at least ten possible customers about this.', 'I know what they pay now, and to whom.', 'I know my main costs: stock, rent, wages, power.', 'I have worked out the price and what is left after costs.', 'I know which licence or registration my kind of work needs, and I have asked the authority.', 'I can run it for three months without any profit.', 'I have the skill, or someone who has it, to do the work well.', 'I have tested it small first, with a few customers.', 'My family knows and supports the plan.'];
  var ic = document.getElementById('ic-form');
  if (ic) {
    ic.innerHTML = QS.map(function (q, i) { return '<fieldset class="finder"><legend style="font-weight:600">' + (i + 1) + '. ' + esc(q) + '</legend>' + ['Yes', 'Not sure', 'No'].map(function (o) { return '<label style="display:inline-flex;gap:6px;align-items:center;min-height:40px;margin-right:12px;font-weight:400"><input type="radio" name="iq' + i + '" value="' + o + '"> ' + o + '</label>'; }).join('') + '</fieldset>'; }).join('');
    ic.addEventListener('change', function () {
      var yes = 0, un = [], no = [], ans = 0;
      QS.forEach(function (q, i) { var r = ic.querySelector('input[name="iq' + i + '"]:checked'); if (!r) return; ans++; if (r.value === 'Yes') yes++; else if (r.value === 'No') no.push(q); else un.push(q); });
      $('#ic-out').innerHTML = ans ? '<div class="result"><h2>' + yes + ' of ' + ans + ' answered are yes</h2><p>This is a prompt for thinking, not a score that predicts success.</p>' + (no.length ? '<h3>Not yet</h3><ul>' + no.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + (un.length ? '<h3>To find out</h3><ul>' + un.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + (ans === QS.length && !no.length && !un.length ? '<p>You have answered yes to every question. Start small and keep records from the first day.</p>' : '<p>Turn each of these into a task for this week. Come back and answer again.</p>') + '</div>' : '';
    });
  }
})();
