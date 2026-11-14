(function () {
  'use strict';
  var B = window.BIZ, M = window.TUTOR_MSG || {}, KEY = 'bz-tutor-v1';
  var root = document.getElementById('tm-app'); if (!root) return;
  var D = B.store.get(KEY, null) || { students: [], pay: {}, att: {}, set: { teacher: '', upi: '', cc: '91', lang: 'en' } };
  var tab = 'students', ym = new Date().toISOString().slice(0, 7), day = new Date().toISOString().slice(0, 10), edit = null, note = '';
  function save() { if (!B.store.set(KEY, D)) note = 'Your browser did not allow saving. Download a backup now.'; }
  function id() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function mlabel(s) { var d = new Date(s + '-01T00:00:00'); return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }); }
  function dlabel(s) { var d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function money(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function phone(p) { var d = String(p || '').replace(/\D/g, ''); if (!d) return ''; if (d.length <= 10) d = (D.set.cc || '91') + d.replace(/^0+/, ''); return d; }
  function fill(t, v) { return t.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null && v[k] !== '' ? v[k] : m; }); }
  function msg(kind, s, extra) {
    var t = (M[kind] || {})[D.set.lang] || (M[kind] || {}).en || '';
    var v = { parent: s.parent || 'Sir/Madam', student: s.name, month: mlabel(ym), amount: extra && extra.amount != null ? money(extra.amount) : money(s.fee), teacher: D.set.teacher || 'Your tutor', upi: D.set.upi || 'the UPI id I shared with you', date: dlabel(day) };
    return fill(t, v);
  }
  function wa(s, text) { var p = phone(s.phone); return 'https://wa.me/' + p + '?text=' + encodeURIComponent(text); }
  function active() { return D.students.filter(function (s) { return s.active !== false; }); }
  function paid(s, m) { return ((D.pay[s.id] || {})[m]) || 0; }
  function started(s, m) { return !s.start || s.start <= m; }
  function render() {
    var h = '<div class="bz-tabs" role="tablist">' + [['students', 'Students'], ['fees', 'Fees'], ['att', 'Attendance'], ['data', 'Backup and settings']].map(function (t) {
      return '<button type="button" role="tab" data-act="tab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (note) h += '<p class="bz-warn">' + B.esc(note) + '</p>';
    h += { students: vStudents, fees: vFees, att: vAtt, data: vData }[tab]();
    root.innerHTML = h;
  }
  function vStudents() {
    var e = edit ? D.students.filter(function (s) { return s.id === edit; })[0] || {} : {};
    var f = '<form class="finder" id="tm-sf" data-id="' + B.esc(e.id || '') + '"><h2>' + (e.id ? 'Edit student' : 'Add a student') + '</h2><div class="fields">' +
      '<div><label for="tm-n">Student name</label><input type="text" id="tm-n" required maxlength="60" value="' + B.esc(e.name || '') + '"></div>' +
      '<div><label for="tm-c">Class or batch</label><input type="text" id="tm-c" maxlength="40" value="' + B.esc(e.cls || '') + '" placeholder="Class 8 maths"></div>' +
      '<div><label for="tm-f">Monthly fee</label><input type="number" id="tm-f" min="0" step="any" inputmode="decimal" value="' + (e.fee != null ? e.fee : '') + '"></div>' +
      '<div><label for="tm-p">Parent name</label><input type="text" id="tm-p" maxlength="60" value="' + B.esc(e.parent || '') + '"></div>' +
      '<div><label for="tm-t">Parent WhatsApp number</label><input type="tel" id="tm-t" inputmode="tel" maxlength="20" value="' + B.esc(e.phone || '') + '"></div>' +
      '<div><label for="tm-s">First month of fees</label><input type="month" id="tm-s" value="' + B.esc(e.start || ym) + '"></div>' +
      '</div><div class="acts"><button class="btn" type="submit">' + (e.id ? 'Save changes' : 'Add student') + '</button>' + (e.id ? '<button class="btn ghost" type="button" data-act="cancel">Cancel</button>' : '') + '</div></form>';
    var a = active();
    var l = a.length ? '<div class="tbl"><table class="stack"><thead><tr><th>Student</th><th>Class</th><th>Monthly fee</th><th>Parent</th><th></th></tr></thead><tbody>' + a.map(function (s) {
      return '<tr><td data-l="Student"><b>' + B.esc(s.name) + '</b></td><td data-l="Class">' + B.esc(s.cls || '') + '</td><td class="bz-n" data-l="Fee">' + money(s.fee || 0) + '</td><td data-l="Parent">' + B.esc(s.parent || '') + '</td><td><button class="btn sm ghost" type="button" data-act="edit" data-id="' + s.id + '">Edit</button> <button class="btn sm ghost" type="button" data-act="del" data-id="' + s.id + '">Remove</button></td></tr>'; }).join('') + '</tbody></table></div>'
      : '<p class="note">No students yet. Add the first one above. Everything stays on this device.</p>';
    return f + '<h2>' + a.length + ' student' + (a.length === 1 ? '' : 's') + '</h2>' + l;
  }
  function vFees() {
    var a = active().filter(function (s) { return started(s, ym); }), due = 0, got = 0;
    var rows = a.map(function (s) {
      var p = paid(s, ym), d = Math.max(0, (s.fee || 0) - p); due += d; got += p;
      return '<tr><td data-l="Student"><b>' + B.esc(s.name) + '</b></td><td class="bz-n" data-l="Fee">' + money(s.fee || 0) + '</td><td class="bz-n" data-l="Paid">' + money(p) + '</td><td class="bz-n" data-l="Due">' + (d ? '<b>' + money(d) + '</b>' : 'Paid') + '</td><td>' +
        (d ? '<button class="btn sm" type="button" data-act="full" data-id="' + s.id + '">Paid in full</button> <button class="btn sm ghost" type="button" data-act="part" data-id="' + s.id + '">Part payment</button> <a class="btn sm ghost" target="_blank" rel="noopener" href="' + wa(s, msg('due', s, { amount: d })) + '">Remind</a> ' : '') +
        (p ? '<button class="btn sm ghost" type="button" data-act="receipt" data-id="' + s.id + '">Receipt</button> <button class="btn sm ghost" type="button" data-act="undo" data-id="' + s.id + '">Clear</button>' : '') + '</td></tr>'; }).join('');
    return '<div class="finder"><label for="tm-m">Month</label><input type="month" id="tm-m" value="' + ym + '"></div>' +
      (a.length ? '<div class="result"><h2>' + mlabel(ym) + ': ' + money(due) + ' due, ' + money(got) + ' received</h2><p>' + a.length + ' students. Tap Remind to open WhatsApp with a ready message to the parent.</p></div><div class="tbl"><table class="stack"><thead><tr><th>Student</th><th>Fee</th><th>Paid</th><th>Due</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="note">No students for this month. Add students first.</p>');
  }
  function vAtt() {
    var a = active(), day0 = D.att[day] || {}, p = 0, ab = 0;
    a.forEach(function (s) { if (day0[s.id] === 'P') p++; if (day0[s.id] === 'A') ab++; });
    var rows = a.map(function (s) {
      var v = day0[s.id];
      return '<tr><td data-l="Student"><b>' + B.esc(s.name) + '</b></td><td><button class="btn sm' + (v === 'P' ? '' : ' ghost') + '" type="button" data-act="att" data-v="P" data-id="' + s.id + '" aria-pressed="' + (v === 'P') + '">Present</button> <button class="btn sm' + (v === 'A' ? '' : ' ghost') + '" type="button" data-act="att" data-v="A" data-id="' + s.id + '" aria-pressed="' + (v === 'A') + '">Absent</button>' +
        (v === 'A' ? ' <a class="btn sm ghost" target="_blank" rel="noopener" href="' + wa(s, msg('absent', s)) + '">Tell parent</a>' : '') + '</td><td class="bz-n" data-l="This month">' + mcount(s) + '</td></tr>'; }).join('');
    return '<div class="finder"><label for="tm-d">Class date</label><input type="date" id="tm-d" value="' + day + '"></div>' +
      (a.length ? '<div class="result"><h2>' + dlabel(day) + ': ' + p + ' present, ' + ab + ' absent</h2></div><div class="acts"><button class="btn sm ghost" type="button" data-act="allp">Mark everyone present</button></div><div class="tbl"><table class="stack"><thead><tr><th>Student</th><th>Today</th><th>Present this month</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="note">Add students first.</p>');
  }
  function mcount(s) { var m = day.slice(0, 7), n = 0, t = 0; Object.keys(D.att).forEach(function (k) { if (k.slice(0, 7) === m && D.att[k][s.id]) { t++; if (D.att[k][s.id] === 'P') n++; } }); return n + ' of ' + t; }
  function vData() {
    var st = D.set;
    return '<form class="finder" id="tm-set"><h2>Settings</h2><div class="fields"><div><label for="tm-tn">Your name (shown in messages)</label><input type="text" id="tm-tn" maxlength="50" value="' + B.esc(st.teacher) + '"></div>' +
      '<div><label for="tm-u">Your UPI id or number (shown in fee reminders)</label><input type="text" id="tm-u" maxlength="60" value="' + B.esc(st.upi) + '"></div>' +
      '<div><label for="tm-cc">Country code for phone numbers</label><input type="text" id="tm-cc" maxlength="4" inputmode="numeric" value="' + B.esc(st.cc) + '"></div>' +
      '<div><label for="tm-l">Message language</label><select id="tm-l"><option value="en"' + (st.lang === 'en' ? ' selected' : '') + '>English</option><option value="hi"' + (st.lang === 'hi' ? ' selected' : '') + '>Hindi</option><option value="pa"' + (st.lang === 'pa' ? ' selected' : '') + '>Punjabi</option></select></div></div><div class="acts"><button class="btn" type="submit">Save settings</button></div></form>' +
      '<div class="finder"><h2>Backup</h2><p>Your data lives only in this browser. Download a backup file now and then, and before you clear browser data or change phone.</p><div class="acts"><button class="btn" type="button" data-act="export">Download backup (.json)</button> <button class="btn ghost" type="button" data-act="csv">Fees of ' + mlabel(ym) + ' (.csv)</button></div>' +
      '<label for="tm-i" style="margin-top:12px">Restore from a backup file</label><input type="file" id="tm-i" accept="application/json,.json"></div>' +
      '<div class="finder"><h2>Clear everything</h2><p>Removes all students, fees and attendance from this browser. Download a backup first.</p><div class="acts"><button class="btn ghost" type="button" data-act="wipe">Clear all data</button></div></div>';
  }
  function receipt(s) {
    var p = paid(s, ym), el = document.createElement('div'); el.id = 'bz-receipt';
    el.innerHTML = '<div style="max-width:560px;margin:20px auto;padding:20px;border:2px solid #000;font:16px/1.5 system-ui,sans-serif;color:#000;background:#fff"><div style="font-size:22px;font-weight:700;margin:0 0 4px">Fee receipt</div><p style="margin:0 0 14px">' + B.esc(D.set.teacher || 'Tuition class') + '</p>' +
      '<p>Received with thanks from <b>' + B.esc(s.parent || 'parent') + '</b> for <b>' + B.esc(s.name) + '</b> (' + B.esc(s.cls || 'class') + ') the sum of <b>' + money(p) + '</b> as tuition fee for <b>' + mlabel(ym) + '</b>.</p><p>Monthly fee: ' + money(s.fee || 0) + '. Balance for the month: ' + money(Math.max(0, (s.fee || 0) - p)) + '.</p><p>Date: ' + dlabel(new Date().toISOString().slice(0, 10)) + '</p><p style="margin-top:34px">Signature: ______________________</p></div>';
    document.body.appendChild(el); document.body.classList.add('print-receipt');
    var done = function () { document.body.classList.remove('print-receipt'); el.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); setTimeout(function () { window.print(); setTimeout(done, 1500); }, 50);
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var a = b.getAttribute('data-act'), sid = b.getAttribute('data-id'), s = D.students.filter(function (x) { return x.id === sid; })[0];
    if (a === 'tab') { tab = b.getAttribute('data-v'); edit = null; note = ''; }
    else if (a === 'edit') { edit = sid; }
    else if (a === 'cancel') { edit = null; }
    else if (a === 'del') { if (confirm('Remove ' + s.name + '? Their fee and attendance records stay in a backup file but disappear from the lists.')) { s.active = false; save(); } else return; }
    else if (a === 'full') { (D.pay[sid] = D.pay[sid] || {})[ym] = s.fee || 0; save(); }
    else if (a === 'part') { var x = parseFloat(prompt('Amount received from ' + s.name + ' for ' + mlabel(ym) + ' (in rupees)?')); if (!(x > 0)) return; (D.pay[sid] = D.pay[sid] || {})[ym] = paid(s, ym) + x; save(); }
    else if (a === 'undo') { if (!confirm('Clear the payment recorded for ' + s.name + ' in ' + mlabel(ym) + '?')) return; delete (D.pay[sid] || {})[ym]; save(); }
    else if (a === 'receipt') { receipt(s); return; }
    else if (a === 'att') { var d0 = (D.att[day] = D.att[day] || {}); d0[sid] = d0[sid] === b.getAttribute('data-v') ? undefined : b.getAttribute('data-v'); if (!d0[sid]) delete d0[sid]; save(); }
    else if (a === 'allp') { var d1 = (D.att[day] = D.att[day] || {}); active().forEach(function (x) { d1[x.id] = 'P'; }); save(); }
    else if (a === 'export') { B.download('tuition-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(D)); return; }
    else if (a === 'csv') { var rows = [['Student', 'Class', 'Fee', 'Paid', 'Due']].concat(active().filter(function (x) { return started(x, ym); }).map(function (x) { return [x.name, x.cls || '', x.fee || 0, paid(x, ym), Math.max(0, (x.fee || 0) - paid(x, ym))]; }));
      B.download('fees-' + ym + '.csv', rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'), 'text/csv'); return; }
    else if (a === 'wipe') { if (!confirm('Clear all data from this browser? This cannot be undone.')) return; D = { students: [], pay: {}, att: {}, set: { teacher: '', upi: '', cc: '91', lang: 'en' } }; save(); }
    render();
  });
  root.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'tm-sf') {
      var o = { name: B.s('tm-n').trim(), cls: B.s('tm-c').trim(), fee: B.v('tm-f'), parent: B.s('tm-p').trim(), phone: B.s('tm-t').trim(), start: B.s('tm-s') || ym };
      if (!o.name) return;
      var sid = e.target.getAttribute('data-id');
      if (sid) { var s = D.students.filter(function (x) { return x.id === sid; })[0]; Object.assign(s, o); edit = null; } else { o.id = id(); o.active = true; D.students.push(o); }
      save(); render();
    } else if (e.target.id === 'tm-set') {
      D.set = { teacher: B.s('tm-tn').trim(), upi: B.s('tm-u').trim(), cc: B.s('tm-cc').replace(/\D/g, '') || '91', lang: B.s('tm-l') }; save(); note = 'Settings saved.'; render();
    }
  });
  root.addEventListener('change', function (e) {
    if (e.target.id === 'tm-m') { ym = e.target.value || ym; render(); }
    else if (e.target.id === 'tm-d') { day = e.target.value || day; render(); }
    else if (e.target.id === 'tm-i') {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var x = JSON.parse(r.result); if (!x || !Array.isArray(x.students)) throw 0; if (!confirm('Replace the data in this browser with the backup (' + x.students.length + ' students)?')) return; D = x; D.set = D.set || { teacher: '', upi: '', cc: '91', lang: 'en' }; save(); note = 'Backup restored.'; } catch (err) { note = 'That file is not a backup from this tool.'; } render(); };
      r.readAsText(f);
    }
  });
  render();
})();
