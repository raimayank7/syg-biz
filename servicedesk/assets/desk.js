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

  function addMonths(s, n) { var d = new Date(s + 'T00:00:00'), day = d.getDate(); d.setMonth(d.getMonth() + (+n || 0)); if (d.getDate() !== day) d.setDate(0); return ds(d); }
  function diff(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
  var APPS = {
    amc: { name: 'Service contract tracker', sort: 'renew', dates: ['renew'], money: ['bal'], moneyF: ['fee', 'paid'], who: function (r) { return r.name; },
      fields: [T('name', 'Customer', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('cover', 'What the contract covers', 'text'), T('start', 'Contract starts on', 'date', 0, 1), T('months', 'Length in months', 'number', 0, 1), T('visits', 'Visits a year', 'number'), T('fee', 'Fee', 'number'), T('paid', 'Received', 'number'), T('note', 'Note', 'text')],
      cols: ['name', 'cover', 'renew', 'bal'], defaults: { start: NOW, months: 12, paid: 0 }, labels: { renew: 'Renews on', bal: 'Balance' },
      calc: function (r) { return { renew: r.start && r.months ? addMonths(r.start, r.months) : '', bal: (+r.fee || 0) - (+r.paid || 0) }; },
      due: function (r) { var c = APPS.amc.calc(r); return c.renew && c.renew <= addDays(NOW, 30) ? (c.renew < NOW ? 'Contract ended ' + dl(c.renew) : 'Renews ' + dl(c.renew)) : (c.bal > 0 ? money(c.bal) + ' unpaid' : ''); },
      msgs: [['Renewal', function (r) { var c = APPS.amc.calc(r); return 'Hello ' + r.name + ', your service contract' + (r.cover ? ' for ' + r.cover : '') + ' ends on ' + dl(c.renew) + '. Shall we renew it for the next period? Please let me know and I will send the details.'; }], ['Visit due', function (r) { return 'Hello ' + r.name + ', your routine service visit is due. When would be a convenient day for us to come?'; }], ['Payment', function (r) { var c = APPS.amc.calc(r); return 'Hello ' + r.name + ', ' + money(c.bal) + ' is pending for your service contract. Please pay by UPI when convenient. Thank you.'; }]],
      summary: function (rows) { var act = rows.filter(function (r) { return APPS.amc.calc(r).renew >= NOW; }), soon = rows.filter(function (r) { var e = APPS.amc.calc(r).renew; return e >= NOW && e <= addDays(NOW, 30); }), lapsed = rows.filter(function (r) { return APPS.amc.calc(r).renew < NOW; }); return '<div class="result"><h2>' + act.length + ' contracts running</h2><p>Renewing within 30 days: ' + soon.length + '. Ended: ' + lapsed.length + '. Money pending: ' + money(rows.reduce(function (a, r) { return a + Math.max(0, APPS.amc.calc(r).bal); }, 0)) + '. Yearly value of running contracts: ' + money(act.reduce(function (a, r) { return a + (+r.fee || 0) / Math.max(1, (+r.months || 12) / 12); }, 0)) + '.</p></div>'; } },
    warranty: { name: 'Warranty and service reminders', sort: 'exp', dates: ['exp', 'nxt'], money: [], moneyF: [], who: function (r) { return r.name + ' (' + (r.product || '') + ')'; },
      fields: [T('name', 'Customer', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('product', 'Product', 'text', 0, 1), T('bill', 'Bill number', 'text'), T('bought', 'Bought on', 'date', 0, 1), T('months', 'Warranty in months', 'number', 0, 1), T('every', 'Service every (months, 0 for none)', 'number'), T('last', 'Last service on', 'date'), T('note', 'Note', 'text')],
      cols: ['name', 'product', 'exp', 'nxt'], defaults: { bought: NOW, months: 12, every: 0 }, labels: { exp: 'Warranty ends', nxt: 'Next service' },
      calc: function (r) { var base = r.last || r.bought; return { exp: r.bought && r.months ? addMonths(r.bought, r.months) : '', nxt: +r.every > 0 && base ? addMonths(base, r.every) : '' }; },
      due: function (r) { var c = APPS.warranty.calc(r); if (c.nxt && c.nxt <= addDays(NOW, 7)) return 'Service due ' + dl(c.nxt); if (c.exp && c.exp >= NOW && c.exp <= addDays(NOW, 30)) return 'Warranty ends ' + dl(c.exp); return ''; },
      msgs: [['Service reminder', function (r) { return 'Hello ' + r.name + ', it is time for the routine service of your ' + (r.product || 'product') + '. Please tell us a convenient day and we will arrange it.'; }], ['Warranty ending', function (r) { var c = APPS.warranty.calc(r); return 'Hello ' + r.name + ', the warranty of your ' + (r.product || 'product') + ' ends on ' + dl(c.exp) + '. If you have any problem, please tell us before that date.'; }]],
      summary: function (rows) { var inw = rows.filter(function (r) { return APPS.warranty.calc(r).exp >= NOW; }).length; var sv = rows.filter(function (r) { var n = APPS.warranty.calc(r).nxt; return n && n <= addDays(NOW, 7); }).length; return '<div class="result"><h2>' + inw + ' products in warranty</h2><p>Warranty ending within 30 days: ' + rows.filter(function (r) { var e = APPS.warranty.calc(r).exp; return e >= NOW && e <= addDays(NOW, 30); }).length + '. Services due within 7 days: ' + sv + '.</p></div>'; } },
    rental: { name: 'Rental register', sort: 'due', dates: [], money: ['tot', 'late'], moneyF: ['rate', 'deposit'], who: function (r) { return r.item + ' (' + r.name + ')'; },
      fields: [T('item', 'Item', 'text', 0, 1), T('name', 'Customer', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('out', 'Taken on', 'date', 0, 1), T('due', 'Due back on', 'date', 0, 1), T('rate', 'Rate per day', 'number'), T('deposit', 'Deposit held', 'number'), T('back', 'Returned on (leave empty while out)', 'date'), T('note', 'Note', 'text')],
      cols: ['item', 'name', 'due', 'days', 'tot'], defaults: { out: NOW, due: addDays(NOW, 1) }, labels: { days: 'Days', tot: 'Rent so far' },
      calc: function (r) { var end = r.back || NOW, d = r.out ? Math.max(1, diff(r.out, end) + 1) : 0; return { days: d, tot: d * (+r.rate || 0), late: r.due && end > r.due ? (diff(r.due, end)) : 0 }; },
      due: function (r) { if (r.back) return ''; var c = APPS.rental.calc(r); return r.due && r.due < NOW ? 'Overdue by ' + diff(r.due, NOW) + ' day(s)' : (r.due && r.due <= addDays(NOW, 1) ? 'Due back ' + dl(r.due) : ''); },
      msgs: [['Return reminder', function (r) { return 'Hello ' + r.name + ', a reminder that the ' + r.item + ' is due back on ' + dl(r.due) + '. Please let us know when you can return it.'; }], ['Overdue', function (r) { var c = APPS.rental.calc(r); return 'Hello ' + r.name + ', the ' + r.item + ' was due back on ' + dl(r.due) + '. The rent so far is ' + money(c.tot) + '. Please return it or tell us if you need more time.'; }]],
      summary: function (rows) { var out = rows.filter(function (r) { return !r.back; }), od = out.filter(function (r) { return r.due && r.due < NOW; }); return '<div class="result"><h2>' + out.length + ' items out now</h2><p>Overdue: ' + od.length + '. Deposits held: ' + money(out.reduce(function (a, r) { return a + (+r.deposit || 0); }, 0)) + '. Rent so far on items out: ' + money(out.reduce(function (a, r) { return a + APPS.rental.calc(r).tot; }, 0)) + '.</p></div>'; } },
    practice: { name: 'Client work tracker', sort: 'due', dates: [], money: ['bal'], moneyF: ['fee', 'paid'], who: function (r) { return r.name + ' (' + (r.work || '') + ')'; },
      fields: [T('name', 'Client', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('work', 'Work', 'text', 0, 1), T('due', 'Due date (from the official calendar or your agreement)', 'date', 0, 1), T('status', 'Stage', 'select', ['Not started', 'Documents asked', 'In progress', 'Ready for client', 'Done']), T('fee', 'Fee', 'number'), T('paid', 'Received', 'number'), T('note', 'Note', 'text')],
      cols: ['name', 'work', 'due', 'status', 'bal'], defaults: { due: addDays(NOW, 7), status: 'Not started', paid: 0 }, labels: { bal: 'Balance' },
      calc: function (r) { return { bal: (+r.fee || 0) - (+r.paid || 0) }; },
      due: function (r) { if (r.status === 'Done') return (+r.fee || 0) - (+r.paid || 0) > 0 ? money(r.fee - (r.paid || 0)) + ' fee unpaid' : ''; if (r.due && r.due < NOW) return 'Overdue since ' + dl(r.due); if (r.due && r.due <= addDays(NOW, 7)) return 'Due ' + dl(r.due) + ' (' + r.status + ')'; return ''; },
      msgs: [['Ask for documents', function (r) { return 'Hello ' + r.name + ', for your ' + r.work + ' please send the documents we discussed by ' + dl(addDays(r.due || NOW, -5)) + ', so that we can finish before the due date of ' + dl(r.due) + '. Please tell me if anything is missing.'; }], ['Reminder', function (r) { return 'Hello ' + r.name + ', a reminder that your ' + r.work + ' is due on ' + dl(r.due) + '. We are waiting for your reply on the points I sent earlier.'; }], ['Work done', function (r) { return 'Hello ' + r.name + ', your ' + r.work + ' is done. I will send the copy. Kindly clear the fee of ' + money((+r.fee || 0) - (+r.paid || 0)) + ' when convenient. Thank you.'; }]],
      summary: function (rows) { var st = ['Not started', 'Documents asked', 'In progress', 'Ready for client', 'Done'], h = '<div class="tbl"><table><thead><tr><th>Stage</th><th>Jobs</th></tr></thead><tbody>'; st.forEach(function (x) { h += '<tr><td>' + x + '</td><td class="bz-n">' + rows.filter(function (r) { return r.status === x; }).length + '</td></tr>'; }); var od = rows.filter(function (r) { return r.status !== 'Done' && r.due && r.due < NOW; }).length, wk = rows.filter(function (r) { return r.status !== 'Done' && r.due >= NOW && r.due <= addDays(NOW, 7); }).length; return h + '</tbody></table></div><div class="result"><h2>' + od + ' overdue, ' + wk + ' due this week</h2><p>Fees still to collect: ' + money(rows.reduce(function (a, r) { return a + Math.max(0, (+r.fee || 0) - (+r.paid || 0)); }, 0)) + '.</p></div>'; } },
    hospitality: { name: 'Guest register', sort: 'in', dates: ['outd'], money: ['tot', 'bal'], moneyF: ['rate', 'paid'], who: function (r) { return r.name + ' (room ' + (r.room || '?') + ')'; },
      fields: [T('name', 'Guest', 'text', 0, 1), T('phone', 'WhatsApp number', 'tel'), T('room', 'Room', 'text'), T('in', 'Check-in', 'date', 0, 1), T('nights', 'Nights', 'number', 0, 1), T('rate', 'Rate per night', 'number'), T('paid', 'Received', 'number'), T('note', 'Note (number of guests, ID checked)', 'text')],
      cols: ['name', 'room', 'in', 'outd', 'bal'], defaults: { in: NOW, nights: 1, paid: 0 }, labels: { outd: 'Check-out', tot: 'Total', bal: 'Balance' },
      calc: function (r) { var tot = (+r.nights || 0) * (+r.rate || 0); return { outd: r.in && r.nights ? addDays(r.in, +r.nights) : '', tot: tot, bal: tot - (+r.paid || 0) }; },
      due: function (r) { var c = APPS.hospitality.calc(r); if (c.outd === NOW) return 'Checks out today' + (c.bal > 0 ? '; ' + money(c.bal) + ' to collect' : ''); if (r.in === NOW) return 'Arrives today'; if (c.outd < NOW && c.bal > 0) return money(c.bal) + ' unpaid after check-out'; return ''; },
      msgs: [['Booking confirmation', function (r) { return 'Hello ' + r.name + ', your stay is confirmed from ' + dl(r.in) + ' for ' + r.nights + ' night(s). Check-in time is [time]. We look forward to welcoming you.'; }], ['Thank you', function (r) { return 'Thank you ' + r.name + ' for staying with us. We hope you enjoyed it. Please come again.'; }]],
      summary: function (rows) { var inh = rows.filter(function (r) { var c = APPS.hospitality.calc(r); return r.in <= NOW && c.outd > NOW; }), arr = rows.filter(function (r) { return r.in === NOW; }), dep = rows.filter(function (r) { return APPS.hospitality.calc(r).outd === NOW; }); return '<div class="result"><h2>' + inh.length + ' guests staying tonight</h2><p>Arriving today: ' + arr.length + '. Checking out today: ' + dep.length + '. Balance still to collect: ' + money(rows.reduce(function (a, r) { return a + Math.max(0, APPS.hospitality.calc(r).bal); }, 0)) + '.</p></div>'; } }
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
