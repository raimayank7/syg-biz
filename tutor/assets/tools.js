(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, esc = B.esc;
  function today() { return new Date().toISOString().slice(0, 10); }
  function mlabel(s) { return new Date(s + '-01T00:00:00').toLocaleString('en-IN', { month: 'long', year: 'numeric' }); }
  var att = document.getElementById('as-form');
  if (att) {
    var runAtt = function () {
      var ym = B.s('as-m') || today().slice(0, 7), y = +ym.slice(0, 4), m = +ym.slice(5, 7), n = new Date(y, m, 0).getDate(), skip = B.s('as-sun') === '1';
      var names = B.s('as-names').split('\n').map(function (x) { return x.trim(); }).filter(Boolean), days = [], i;
      for (i = 1; i <= n; i++) { var wd = new Date(y, m - 1, i).getDay(); if (skip && wd === 0) continue; days.push([i, 'SMTWTFS'.charAt(wd)]); }
      var h = '<h2 style="margin:0 0 6px">' + esc(B.s('as-title') || 'Attendance') + ' - ' + mlabel(ym) + '</h2><p style="margin:0 0 8px">P = present, A = absent</p><table><thead><tr><th>No.</th><th style="text-align:left">Student</th>' + days.map(function (d) { return '<th>' + d[0] + '<br><small>' + d[1] + '</small></th>'; }).join('') + '<th>Total</th></tr></thead><tbody>' +
        names.map(function (nm, k) { return '<tr><td>' + (k + 1) + '</td><td style="text-align:left">' + esc(nm) + '</td>' + days.map(function () { return '<td>&nbsp;</td>'; }).join('') + '<td></td></tr>'; }).join('') + '</tbody></table><p style="margin-top:10px">Teacher signature: ____________________</p>';
      $('#as-out').innerHTML = '<div class="bz-sheet">' + h + '</div>'; $('#as-out').setAttribute('data-html', h);
    };
    att.addEventListener('input', runAtt); att.addEventListener('change', runAtt); runAtt();
    $('#as-print').addEventListener('click', function () { B.printHtml('<div style="font:13px/1.4 system-ui,sans-serif;color:#000;background:#fff;padding:8px">' + $('#as-out').getAttribute('data-html') + '</div>'); });
  }
  var rc = document.getElementById('fr-form');
  if (rc) {
    var runRc = function () {
      var amt = B.v('fr-amt'), h = '<div style="max-width:560px;margin:0 auto;padding:18px;border:2px solid #000;font:16px/1.5 system-ui,sans-serif;color:#000;background:#fff"><div style="font-size:22px;font-weight:700;margin:0">Fee receipt</div><p style="margin:0 0 10px">' + esc(B.s('fr-t') || 'Tuition class') + '</p>' +
        '<p>Receipt no. <b>' + esc(B.s('fr-no') || '1') + '</b> &nbsp; Date <b>' + esc(B.s('fr-date') || today()) + '</b></p><p>Received with thanks from <b>' + esc(B.s('fr-p') || 'parent') + '</b> for <b>' + esc(B.s('fr-s') || 'student') + '</b> (' + esc(B.s('fr-c') || 'class') + ') the sum of <b>₹' + amt.toLocaleString('en-IN') + '</b> as tuition fee for <b>' + esc(B.s('fr-per') || '') + '</b>, paid by ' + esc(B.s('fr-mode')) + '.</p><p style="margin-top:30px">Signature: ____________________</p></div>';
      $('#fr-out').innerHTML = h; $('#fr-out').setAttribute('data-html', h);
    };
    rc.addEventListener('input', runRc); rc.addEventListener('change', runRc); runRc();
    $('#fr-print').addEventListener('click', function () { B.printHtml($('#fr-out').getAttribute('data-html')); });
  }
  var tt = document.getElementById('tt-form');
  if (tt) {
    var build = function () {
      var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(function (d) { return $('#tt-' + d).checked; }), st = B.s('tt-start') || '16:00', len = Math.max(15, B.v('tt-len') || 60), n = Math.min(10, Math.max(1, B.v('tt-n') || 4));
      var t0 = (+st.slice(0, 2)) * 60 + (+st.slice(3, 5)), cols = [], i;
      for (i = 0; i < n; i++) { var a = t0 + i * len, b = a + len, f = function (x) { x = x % 1440; return ('0' + Math.floor(x / 60)).slice(-2) + ':' + ('0' + (x % 60)).slice(-2); }; cols.push(f(a) + ' - ' + f(b)); }
      var h = '<table><thead><tr><th>Day</th>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + days.map(function (d) { return '<tr><th>' + d + '</th>' + cols.map(function () { return '<td><input type="text" class="tt-cell" style="width:100%;min-width:80px;min-height:40px" aria-label="Batch for ' + d + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      $('#tt-out').innerHTML = '<div class="bz-sheet">' + h + '</div>';
    };
    tt.addEventListener('change', build); tt.addEventListener('input', function (e) { if (e.target.type !== 'text') build(); }); build();
    $('#tt-print').addEventListener('click', function () {
      var t = $('#tt-out table').cloneNode(true), src = $('#tt-out').querySelectorAll('.tt-cell');
      t.querySelectorAll('.tt-cell').forEach(function (c, k) { c.parentNode.textContent = src[k].value; });
      B.printHtml('<div style="font:14px/1.4 system-ui,sans-serif;color:#000;background:#fff;padding:8px"><h2>' + esc(B.s('tt-title') || 'Weekly timetable') + '</h2><div class="bz-sheet">' + t.outerHTML + '</div></div>');
    });
  }
})();
