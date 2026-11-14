(function () {
  'use strict';
  var B = window.BIZ, esc = B.esc, root = document.getElementById('rg-app');
  if (!root) return;
  var key = root.getAttribute('data-app');
  function pad(n) { return ('0' + n).slice(-2); }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return ds(new Date()); }
  function addDays(s, n) { var d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ds(d); }
  function money(n) { return '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN'); }
  function f1(n) { return (Math.round(n * 10) / 10).toLocaleString('en-IN'); }
  function dl(s) { return s ? new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
  function ml(s) { return s ? new Date(s + '-01T00:00:00').toLocaleString('en-IN', { month: 'long', year: 'numeric' }) : ''; }
  function T(k, l, t, o, req) { return { k: k, l: l, t: t || 'text', o: o, req: req }; }
  var NOW = today(), MONTH = NOW.slice(0, 7);

  var APPS = {
    lead: { name: 'Lead tracker', sort: 'next',
      fields: [T('name', 'Name', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('src', 'Where they came from', 'text'), T('status', 'Stage', 'select', ['New', 'Contacted', 'Quote sent', 'Won', 'Lost']), T('val', 'Possible value', 'number'), T('next', 'Follow up on', 'date'), T('note', 'Note', 'text')],
      cols: ['name', 'status', 'val', 'next'], defaults: { status: 'New', next: NOW },
      due: function (r) { return r.next && r.status !== 'Won' && r.status !== 'Lost' && r.next <= NOW ? 'Follow up was due ' + dl(r.next) : ''; },
      msgs: [['Follow up', function (r) { return 'Hello ' + r.name + ', this is a quick follow-up on our last chat. Is there anything I can help you decide? Happy to answer any questions.'; }], ['After a quote', function (r) { return 'Hello ' + r.name + ', I sent you the quote earlier. Please let me know if you would like any change, and I will update it the same day.'; }], ['Thank you', function (r) { return 'Thank you ' + r.name + ' for choosing us. Please message me if you need anything.'; }]],
      summary: function (rows) { var st = ['New', 'Contacted', 'Quote sent', 'Won', 'Lost'], h = '<div class="tbl"><table><thead><tr><th>Stage</th><th>Leads</th><th>Value</th></tr></thead><tbody>'; st.forEach(function (s) { var x = rows.filter(function (r) { return r.status === s; }); h += '<tr><td>' + s + '</td><td class="bz-n">' + x.length + '</td><td class="bz-n">' + money(x.reduce(function (a, r) { return a + (+r.val || 0); }, 0)) + '</td></tr>'; }); var won = rows.filter(function (r) { return r.status === 'Won'; }).length, closed = won + rows.filter(function (r) { return r.status === 'Lost'; }).length; return h + '</tbody></table></div>' + (closed ? '<p>Of ' + closed + ' closed leads, ' + won + ' were won (' + Math.round(won / closed * 100) + '%).</p>' : ''); } },
    rent: { name: 'Rent book', sort: 'month',
      fields: [T('name', 'Tenant', 'text', 0, 1), T('flat', 'Flat or shop', 'text'), T('phone', 'WhatsApp number', 'tel'), T('month', 'Month', 'month', 0, 1), T('rent', 'Rent for the month', 'number', 0, 1), T('paid', 'Received so far', 'number'), T('paidOn', 'Received on', 'date'), T('note', 'Note', 'text')],
      cols: ['name', 'flat', 'month', 'rent', 'paid'], defaults: { month: MONTH, paid: 0 },
      due: function (r) { return (+r.rent || 0) - (+r.paid || 0) > 0 && r.month <= MONTH ? money(r.rent - (r.paid || 0)) + ' due for ' + ml(r.month) : ''; },
      msgs: [['Rent reminder', function (r) { return 'Hello ' + r.name + ', a gentle reminder that the rent of ' + money(r.rent - (r.paid || 0)) + ' for ' + ml(r.month) + (r.flat ? ' (' + r.flat + ')' : '') + ' is due. Please pay at your convenience. Thank you.'; }], ['Rent received', function (r) { return 'Thank you ' + r.name + '. We have received ' + money(r.paid || 0) + ' towards the rent for ' + ml(r.month) + '.'; }]],
      extra: function (rows) { var m = B.s('rg-mon') || MONTH, x = rows.filter(function (r) { return r.month === m; }); return '<div class="finder"><label for="rg-mon">Show month</label><input type="month" id="rg-mon" value="' + m + '"><div class="acts"><button class="btn sm" type="button" data-act="roll">Copy last month\'s tenants into this month</button></div></div>'; },
      summary: function (rows) { var m = B.s('rg-mon') || MONTH, x = rows.filter(function (r) { return r.month === m; }), e = x.reduce(function (a, r) { return a + (+r.rent || 0); }, 0), g = x.reduce(function (a, r) { return a + (+r.paid || 0); }, 0); return '<div class="result"><h2>' + ml(m) + ': ' + money(g) + ' received of ' + money(e) + '</h2><p>' + x.length + ' rows, ' + money(Math.max(0, e - g)) + ' still due.</p></div>'; } },
    tiffin: { name: 'Tiffin and subscription book', sort: 'exp',
      fields: [T('name', 'Customer', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('plan', 'Plan', 'text'), T('start', 'Starts on', 'date', 0, 1), T('days', 'Days in the plan', 'number', 0, 1), T('fee', 'Plan price', 'number'), T('paid', 'Received', 'number'), T('note', 'Address or note', 'text')],
      cols: ['name', 'plan', 'exp', 'bal'], defaults: { start: NOW, days: 30, paid: 0 },
      calc: function (r) { return { exp: r.start && r.days ? addDays(r.start, (+r.days || 0) - 1) : '', bal: (+r.fee || 0) - (+r.paid || 0) }; },
      due: function (r) { var c = APPS.tiffin.calc(r); return c.exp && c.exp <= addDays(NOW, 3) ? (c.exp < NOW ? 'Plan ended ' + dl(c.exp) : 'Plan ends ' + dl(c.exp)) : (c.bal > 0 ? money(c.bal) + ' unpaid' : ''); },
      msgs: [['Plan ending', function (r) { var c = APPS.tiffin.calc(r); return 'Hello ' + r.name + ', your ' + (r.plan || 'meal') + ' plan ends on ' + dl(c.exp) + '. Shall I continue it for the next period? Please let me know.'; }], ['Payment reminder', function (r) { var c = APPS.tiffin.calc(r); return 'Hello ' + r.name + ', ' + money(c.bal) + ' is pending for your ' + (r.plan || 'meal') + ' plan. Please pay by UPI when convenient. Thank you.'; }]],
      summary: function (rows) { var act = rows.filter(function (r) { var c = APPS.tiffin.calc(r); return c.exp >= NOW && r.start <= NOW; }), un = rows.reduce(function (a, r) { return a + Math.max(0, APPS.tiffin.calc(r).bal); }, 0); return '<div class="result"><h2>' + act.length + ' plans running today</h2><p>Money pending: ' + money(un) + '. Plans ending in 7 days: ' + rows.filter(function (r) { var e = APPS.tiffin.calc(r).exp; return e >= NOW && e <= addDays(NOW, 7); }).length + '.</p></div>'; } },
    gym: { name: 'Member tracker', sort: 'exp',
      fields: [T('name', 'Member', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('plan', 'Plan', 'text'), T('start', 'Joined or renewed on', 'date', 0, 1), T('days', 'Days of membership', 'number', 0, 1), T('fee', 'Fee', 'number'), T('paid', 'Received', 'number'), T('note', 'Note', 'text')],
      cols: ['name', 'plan', 'exp', 'bal'], defaults: { start: NOW, days: 30, paid: 0 },
      calc: function (r) { return { exp: r.start && r.days ? addDays(r.start, +r.days || 0) : '', bal: (+r.fee || 0) - (+r.paid || 0) }; },
      due: function (r) { var c = APPS.gym.calc(r); return c.exp && c.exp <= addDays(NOW, 5) ? (c.exp < NOW ? 'Membership ended ' + dl(c.exp) : 'Membership ends ' + dl(c.exp)) : (c.bal > 0 ? money(c.bal) + ' unpaid' : ''); },
      msgs: [['Renewal reminder', function (r) { var c = APPS.gym.calc(r); return 'Hello ' + r.name + ', your membership ends on ' + dl(c.exp) + '. We would love to see you continue. Please let us know when you would like to renew.'; }], ['Missed you', function (r) { return 'Hello ' + r.name + ', we have not seen you for a while. Is everything fine? Come in whenever you are ready; we are here to help you restart.'; }]],
      summary: function (rows) { var act = rows.filter(function (r) { return APPS.gym.calc(r).exp >= NOW; }), ex = rows.filter(function (r) { var e = APPS.gym.calc(r).exp; return e >= NOW && e <= addDays(NOW, 7); }), lapsed = rows.filter(function (r) { return APPS.gym.calc(r).exp < NOW; }); return '<div class="result"><h2>' + act.length + ' active members</h2><p>Ending in 7 days: ' + ex.length + '. Lapsed: ' + lapsed.length + '. Money pending: ' + money(rows.reduce(function (a, r) { return a + Math.max(0, APPS.gym.calc(r).bal); }, 0)) + '.</p></div>'; } },
    dairy: { name: 'Milk collection book', sort: 'date', settings: [['fp', 'Price for each 1% fat, per litre', 8], ['sp', 'Price for each 1% SNF, per litre (0 if you use fat only)', 0]],
      fields: [T('name', 'Farmer', 'text', 0, 1), T('date', 'Date', 'date', 0, 1), T('shift', 'Shift', 'select', ['Morning', 'Evening']), T('litres', 'Litres', 'number', 0, 1), T('fat', 'Fat %', 'number'), T('snf', 'SNF % (optional)', 'number'), T('note', 'Note', 'text')],
      cols: ['name', 'date', 'litres', 'fat', 'rate', 'amt'], defaults: { date: NOW, shift: 'Morning' },
      calc: function (r, S) { S = S || {}; var rate = (+r.fat || 0) * (+S.fp || 0) + (+r.snf || 0) * (+S.sp || 0); return { rate: rate, amt: rate * (+r.litres || 0) }; },
      summary: function (rows, S) { var m = B.s('rg-mon') || MONTH, x = rows.filter(function (r) { return (r.date || '').slice(0, 7) === m; }), by = {}; x.forEach(function (r) { var c = APPS.dairy.calc(r, S), o = by[r.name] || (by[r.name] = { l: 0, a: 0, f: 0, n: 0 }); o.l += +r.litres || 0; o.a += c.amt; o.f += (+r.fat || 0) * (+r.litres || 0); o.n++; }); var names = Object.keys(by).sort(), tl = 0, ta = 0;
        var h = '<div class="finder"><label for="rg-mon">Month for the bill</label><input type="month" id="rg-mon" value="' + m + '"></div><div class="tbl"><table class="stack"><thead><tr><th>Farmer</th><th>Litres</th><th>Average fat</th><th>Amount</th></tr></thead><tbody>' + names.map(function (n) { var o = by[n]; tl += o.l; ta += o.a; return '<tr><td data-l="Farmer">' + esc(n) + '</td><td class="bz-n" data-l="Litres">' + f1(o.l) + '</td><td class="bz-n" data-l="Average fat">' + (o.l ? f1(o.f / o.l) : 0) + '%</td><td class="bz-n" data-l="Amount">' + money(o.a) + '</td></tr>'; }).join('') + (names.length ? '<tr class="bz-total"><td>Total</td><td class="bz-n">' + f1(tl) + '</td><td></td><td class="bz-n">' + money(ta) + '</td></tr>' : '') + '</tbody></table></div>'; return '<div class="result"><h2>Bill for ' + ml(m) + '</h2>' + h + '</div>'; } },
    fleet: { name: 'Vehicle logbook', sort: 'date',
      fields: [T('veh', 'Vehicle', 'text', 0, 1), T('date', 'Date', 'date', 0, 1), T('odo', 'Odometer reading (km)', 'number', 0, 1), T('litres', 'Fuel filled (litres)', 'number'), T('cost', 'Fuel cost', 'number'), T('other', 'Other spend (service, toll, repair)', 'number'), T('note', 'Note', 'text')],
      cols: ['veh', 'date', 'odo', 'km', 'mil'], defaults: { date: NOW },
      calc: function (r, S, rows) { var prev = (rows || []).filter(function (x) { return x.veh === r.veh && +x.odo < +r.odo; }).sort(function (a, b) { return b.odo - a.odo; })[0]; var km = prev ? r.odo - prev.odo : 0; return { km: km || '', mil: km && +r.litres ? km / r.litres : '' }; },
      summary: function (rows) { var by = {}; rows.forEach(function (r) { var o = by[r.veh] || (by[r.veh] = { min: 1e12, max: 0, l: 0, c: 0, o: 0, fl: 0, fc: 0 }); if (+r.odo < o.min) { o.min = +r.odo; o.fl = +r.litres || 0; o.fc = +r.cost || 0; } o.max = Math.max(o.max, +r.odo); o.l += +r.litres || 0; o.c += +r.cost || 0; o.o += +r.other || 0; });
        var names = Object.keys(by).sort(); return '<div class="tbl"><table class="stack"><thead><tr><th>Vehicle</th><th>Km logged</th><th>Fuel (L)</th><th>Spend</th><th>Km per litre</th><th>Cost per km</th></tr></thead><tbody>' + names.map(function (n) { var o = by[n], km = o.max - o.min; o.l -= o.fl; o.c -= o.fc; return '<tr><td data-l="Vehicle">' + esc(n) + '</td><td class="bz-n" data-l="Km logged">' + f1(km) + '</td><td class="bz-n" data-l="Fuel">' + f1(o.l) + '</td><td class="bz-n" data-l="Spend">' + money(o.c + o.o) + '</td><td class="bz-n" data-l="Km per litre">' + (km && o.l ? f1(km / o.l) : '') + '</td><td class="bz-n" data-l="Cost per km">' + (km ? money((o.c + o.o) / km) : '') + '</td></tr>'; }).join('') + '</tbody></table></div><p>The first fill-up of each vehicle is only the starting point, so its fuel is not counted. For the most exact figure, fill the tank each time.</p>'; } }
  };
  var A = APPS[key]; if (!A) return;
  var KEY = 'bz-reg-' + key, D = B.store.get(KEY, null) || { rows: [], set: {} }, edit = null, filt = '', note = '';
  (A.settings || []).forEach(function (s) { if (D.set[s[0]] == null) D.set[s[0]] = s[2]; });
  function save() { if (!B.store.set(KEY, D)) note = 'Your browser could not save. Download a backup now.'; }
  function calc(r) { return A.calc ? A.calc(r, D.set, D.rows) : {}; }
  function val(r, k) { var c = calc(r); if (c[k] != null && c[k] !== '') { var x = c[k]; if ((A.dates || ['exp']).indexOf(k) >= 0) return dl(x); if ((A.money || ['bal', 'amt', 'rate']).indexOf(k) >= 0) return money(x); if (k === 'mil' || k === 'km') return f1(x); return x; } var v = r[k]; if (v == null || v === '') return ''; var fd = A.fields.filter(function (f) { return f.k === k; })[0]; if (fd && fd.t === 'date') return dl(v); if (k === 'month') return ml(v); if ((A.moneyF || ['val', 'rent', 'paid', 'fee']).indexOf(k) >= 0) return money(v); return v; }
  function label(k) { if (A.labels && A.labels[k]) return A.labels[k]; var m = { exp: 'Ends on', bal: 'Balance', rate: 'Rate per litre', amt: 'Amount', km: 'Km since last', mil: 'Km per litre' }; if (m[k]) return m[k]; var f = A.fields.filter(function (x) { return x.k === k; })[0]; return f ? f.l : k; }
  function field(f, v) {
    var id = 'rg-' + f.k, h = '<div><label for="' + id + '">' + esc(f.l) + '</label>';
    if (f.t === 'select') h += '<select id="' + id + '">' + f.o.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    else h += '<input type="' + f.t + '" id="' + id + '" value="' + esc(v == null ? '' : v) + '"' + (f.t === 'number' ? ' step="any" min="0" inputmode="decimal"' : '') + (f.k === 'phone' ? ' inputmode="tel"' : '') + (f.req ? ' required' : '') + ' maxlength="80">';
    return h + '</div>';
  }
  function render() {
    var e = edit ? D.rows.filter(function (r) { return r.id === edit; })[0] || {} : A.defaults || {};
    var h = (note ? '<p class="bz-warn">' + esc(note) + '</p>' : '');
    if (A.settings) h += '<form class="finder" id="rg-set"><h2>Your rates</h2><div class="fields">' + A.settings.map(function (s) { return '<div><label for="rg-s-' + s[0] + '">' + esc(s[1]) + '</label><input type="number" id="rg-s-' + s[0] + '" step="any" min="0" value="' + D.set[s[0]] + '"></div>'; }).join('') + '</div><div class="acts"><button class="btn sm" type="submit">Save rates</button></div></form>';
    if (A.extra) h += A.extra(D.rows);
    h += '<div id="rg-sum">' + (A.summary ? A.summary(D.rows, D.set) : '') + '</div>';
    var due = D.rows.map(function (r) { return [r, A.due ? A.due(r) : '']; }).filter(function (x) { return x[1]; });
    if (due.length) h += '<div class="result"><h2>Needs attention (' + due.length + ')</h2><ul>' + due.slice(0, 20).map(function (x) { var r = x[0]; return '<li><b>' + esc(A.who ? A.who(r) : (r.name || r.veh)) + '</b>: ' + esc(x[1]) + (r.phone && A.msgs ? ' ' + msgBtns(r) : '') + '</li>'; }).join('') + '</ul></div>';
    h += '<form class="finder" id="rg-f"><h2>' + (edit ? 'Edit' : 'Add') + '</h2><div class="fields">' + A.fields.map(function (f) { return field(f, e[f.k]); }).join('') + '</div><div class="acts"><button class="btn" type="submit">' + (edit ? 'Save changes' : 'Add') + '</button>' + (edit ? '<button class="btn ghost" type="button" data-act="cancel">Cancel</button>' : '') + '</div></form>';
    var rows = D.rows.filter(function (r) { return !filt || JSON.stringify(r).toLowerCase().indexOf(filt) >= 0; }).sort(function (a, b) { var x = (calc(a)[A.sort] || a[A.sort] || ''), y = (calc(b)[A.sort] || b[A.sort] || ''); return A.sort === 'date' || A.sort === 'month' ? (y > x ? 1 : -1) : (x > y ? 1 : -1); });
    h += '<div class="finder"><label for="rg-q">Search</label><input type="search" id="rg-q" value="' + esc(filt) + '"></div>' + (rows.length ? '<div class="tbl"><table class="stack"><thead><tr>' + A.cols.map(function (c) { return '<th>' + esc(label(c)) + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' + rows.slice(0, 300).map(function (r) {
      return '<tr>' + A.cols.map(function (c) { return '<td data-l="' + esc(label(c)) + '">' + esc(val(r, c)) + '</td>'; }).join('') + '<td><button class="btn sm ghost" type="button" data-act="edit" data-id="' + r.id + '">Edit</button> <button class="btn sm ghost" type="button" data-act="del" data-id="' + r.id + '">Delete</button>' + (r.phone && A.msgs ? ' ' + msgBtns(r) : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="note">Nothing here yet. Add the first row above. Everything stays on this device.</p>');
    h += '<div class="finder"><h2>Backup</h2><p>Your records are saved only in this browser. Download a backup now and then.</p><div class="acts"><button class="btn" type="button" data-act="export">Download backup</button><button class="btn ghost" type="button" data-act="csv">Download as a spreadsheet file (.csv)</button><label class="btn ghost" style="cursor:pointer;margin:0">Restore a backup<input type="file" id="rg-up" accept=".json,application/json" style="display:none"></label><button class="btn ghost" type="button" data-act="wipe">Clear all</button></div></div>';
    root.innerHTML = h;
    var q = document.getElementById('rg-q'); if (q && filt) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  var msgIdx = [];
  function msgBtns(r) { return (A.msgs || []).map(function (m, i) { return '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + esc(B.wa(r.phone.replace(/\D/g, '').length <= 10 ? '91' + r.phone.replace(/\D/g, '') : r.phone, m[1](r))) + '">' + esc(m[0]) + '</a>'; }).join(' '); }
  root.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (ev.target.id === 'rg-set') { A.settings.forEach(function (s) { D.set[s[0]] = parseFloat(B.s('rg-s-' + s[0])) || 0; }); save(); note = 'Rates saved.'; render(); return; }
    var o = {}; A.fields.forEach(function (f) { var v = B.s('rg-' + f.k); o[f.k] = f.t === 'number' ? (v === '' ? '' : parseFloat(v)) : v.trim(); });
    if (edit) { var r = D.rows.filter(function (x) { return x.id === edit; })[0]; Object.assign(r, o); edit = null; } else { o.id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); D.rows.push(o); }
    note = ''; save(); render();
  });
  root.addEventListener('input', function (ev) { if (ev.target.id === 'rg-q') { filt = ev.target.value.toLowerCase(); render(); } });
  root.addEventListener('change', function (ev) {
    if (ev.target.id === 'rg-mon') { render(); }
    else if (ev.target.id === 'rg-up') { var f = ev.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { try { var x = JSON.parse(rd.result); if (!x || !Array.isArray(x.rows)) throw 0; if (!confirm('Replace the records in this browser with ' + x.rows.length + ' rows from the file?')) return; D = x; D.set = D.set || {}; save(); note = 'Backup restored.'; } catch (e2) { note = 'That file is not a backup from this tool.'; } render(); }; rd.readAsText(f); }
  });
  root.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]'); if (!b) return; var a = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    if (a === 'edit') edit = id; else if (a === 'cancel') edit = null;
    else if (a === 'del') { if (!confirm('Delete this row?')) return; D.rows = D.rows.filter(function (r) { return r.id !== id; }); save(); }
    else if (a === 'export') { B.download(key + '-backup-' + NOW + '.json', JSON.stringify(D)); return; }
    else if (a === 'csv') { var cols = A.fields.map(function (f) { return f.k; }); var lines = [A.fields.map(function (f) { return f.l; })].concat(D.rows.map(function (r) { return cols.map(function (c) { return r[c] == null ? '' : r[c]; }); })); B.download(key + '-' + NOW + '.csv', lines.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'), 'text/csv'); return; }
    else if (a === 'wipe') { if (!confirm('Clear all rows from this browser? Download a backup first.')) return; D.rows = []; save(); }
    else if (a === 'roll') { var m = B.s('rg-mon') || MONTH, prevM = D.rows.map(function (r) { return r.month; }).filter(function (x) { return x && x < m; }).sort().pop(); if (!prevM) { note = 'There is no earlier month to copy.'; } else { var have = D.rows.filter(function (r) { return r.month === m; }).map(function (r) { return r.name + '|' + r.flat; }); var n = 0; D.rows.filter(function (r) { return r.month === prevM; }).forEach(function (r) { if (have.indexOf(r.name + '|' + r.flat) < 0) { D.rows.push({ id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: r.name, flat: r.flat, phone: r.phone, month: m, rent: r.rent, paid: 0, paidOn: '', note: '' }); n++; } }); note = 'Copied ' + n + ' rows from ' + ml(prevM) + '.'; save(); } }
    render();
  });
  render();
})();
