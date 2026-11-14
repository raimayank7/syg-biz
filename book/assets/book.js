(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, esc = B.esc;
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function pad(n) { return ('0' + n).slice(-2); }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function tm(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
  function t2m(t) { var m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : 0; }
  function money(n) { return n ? '₹' + Math.round(n).toLocaleString('en-IN') : ''; }
  window.BOOKX = { enc: enc, dec: dec, slots: slots };

  function slots(cfg, svc, dateStr, now) {
    var d = new Date(dateStr + 'T00:00:00'), wd = d.getDay();
    if ((cfg.days || []).indexOf(wd) < 0) return [];
    var open = t2m(cfg.open), close = t2m(cfg.close), step = Math.max(5, cfg.step || 30), len = Math.max(5, svc.min || step), gap = cfg.gap || 0, out = [];
    var taken = (cfg.taken || []).filter(function (x) { return x.slice(0, 10) === dateStr; }).map(function (x) { return t2m(x.slice(11)); });
    if ((cfg.off || []).indexOf(dateStr) >= 0) return [];
    for (var s = open; s + len <= close; s += step) {
      if (taken.some(function (t) { return s < t + step && s + len + gap > t; })) continue;
      if (now) { var nowStr = ds(now); if (dateStr < nowStr) continue; if (dateStr === nowStr && s < now.getHours() * 60 + now.getMinutes() + 30) continue; }
      out.push(s);
    }
    return out;
  }

  var mk = document.getElementById('bk-form');
  if (mk) {
    var read = function () {
      var svc = B.s('bk-svc').split('\n').map(function (l) { var p = l.split(','); return { n: (p[0] || '').trim().slice(0, 60), min: Math.max(5, parseInt(p[1], 10) || 30), p: parseFloat(p[2]) || 0 }; }).filter(function (s) { return s.n; }).slice(0, 15);
      var days = []; DAYS.forEach(function (d, i) { if ($('#bk-d' + i).checked) days.push(i); });
      return { v: 1, name: B.s('bk-name').trim().slice(0, 60), wa: B.s('bk-wa').replace(/\D/g, ''), note: B.s('bk-note').trim().slice(0, 240), svc: svc, days: days, open: B.s('bk-open'), close: B.s('bk-close'),
        step: Math.max(5, parseInt(B.s('bk-step'), 10) || 30), gap: Math.max(0, parseInt(B.s('bk-gap'), 10) || 0), ahead: Math.min(60, Math.max(1, parseInt(B.s('bk-ahead'), 10) || 14)),
        off: B.s('bk-off').split(/[\s,;]+/).filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x); }), taken: B.s('bk-taken').split('\n').map(function (x) { return x.trim(); }).filter(function (x) { return /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/.test(x); }).map(function (x) { return x.length === 15 ? x.slice(0, 11) + '0' + x.slice(11) : x; }), lang: B.s('bk-lang') };
    };
    var run = function () {
      var c = read(), out = $('#bk-out'), problems = [];
      if (!c.name) problems.push('Type your business name.');
      if (c.wa.length < 10) problems.push('Type your WhatsApp number with the country code, for example 919876543210.');
      if (!c.svc.length) problems.push('Add at least one service, one on each line: name, minutes, price.');
      if (!c.days.length) problems.push('Choose at least one open day.');
      if (t2m(c.close) <= t2m(c.open)) problems.push('Closing time must be after opening time.');
      if (problems.length) { out.innerHTML = '<div class="bz-warn"><b>Before you get your link:</b><ul>' + problems.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>'; return; }
      var link = location.origin + '/book/b/#' + enc(c);
      var preview = c.svc.map(function (s) { var n = slots(c, s, ds(new Date(Date.now() + 86400000)), null).length; return esc(s.n) + ' (' + s.min + ' min' + (s.p ? ', ' + money(s.p) : '') + '): ' + n + ' slots tomorrow'; });
      out.innerHTML = '<div class="result"><h2>Your booking link is ready</h2><p>Send it to customers on WhatsApp or put it in your profile. It is ' + link.length + ' characters long.</p><p><input type="text" readonly id="bk-link" value="' + esc(link) + '" aria-label="Your booking link" style="width:100%;min-height:46px;font:inherit;padding:8px"></p>' +
        '<div class="acts"><button class="btn" type="button" data-copy="' + esc(link) + '">Copy the link</button><a class="btn ghost" target="_blank" rel="noopener" href="' + esc(link) + '">Open and test it</a><button class="btn ghost" type="button" data-wa="Book an appointment with ' + esc(c.name) + ': ' + esc(link) + '">Share on WhatsApp</button></div>' +
        '<p>Check: ' + preview.join('; ') + '.</p></div>';
    };
    mk.addEventListener('input', run); mk.addEventListener('change', run);
    $('#bk-load').addEventListener('click', function () {
      var v = B.s('bk-paste').trim(), i = v.indexOf('#'); if (i < 0) { $('#bk-lmsg').textContent = 'Paste a full booking link that contains a # sign.'; return; }
      try {
        var c = dec(v.slice(i + 1)); var set = function (id, x) { document.getElementById(id).value = x; };
        set('bk-name', c.name || ''); set('bk-wa', c.wa || ''); set('bk-note', c.note || ''); set('bk-svc', (c.svc || []).map(function (s) { return s.n + ', ' + s.min + ', ' + (s.p || 0); }).join('\n'));
        DAYS.forEach(function (d, i) { $('#bk-d' + i).checked = (c.days || []).indexOf(i) >= 0; }); set('bk-open', c.open || '09:00'); set('bk-close', c.close || '18:00'); set('bk-step', c.step || 30); set('bk-gap', c.gap || 0); set('bk-ahead', c.ahead || 14);
        set('bk-off', (c.off || []).join(', ')); set('bk-taken', (c.taken || []).join('\n')); set('bk-lang', c.lang || 'en'); $('#bk-lmsg').textContent = 'Loaded. Change what you need; the new link is below.'; run();
      } catch (e) { $('#bk-lmsg').textContent = 'That link could not be read.'; }
    });
    var pm = /^#t=(\w+)/.exec(location.hash), PR = window.BOOK_PRESETS;
    if (pm && PR && PR[pm[1]]) {
      var p = PR[pm[1]], setv = function (id, x) { document.getElementById(id).value = x; };
      setv('bk-svc', p.svc); setv('bk-step', p.step); setv('bk-gap', p.gap); setv('bk-open', p.open); setv('bk-close', p.close);
      DAYS.forEach(function (d, i) { $('#bk-d' + i).checked = p.days.indexOf(i) >= 0; });
      $('#bk-lmsg').textContent = 'Loaded the example setup for ' + p.name + '. Type your name and number, and change the services to yours.';
    }
    run();
  }

  var vw = document.getElementById('bk-view');
  if (vw) {
    var cfg = null;
    try { cfg = dec(location.hash.slice(1)); } catch (e) { cfg = null; }
    if (!cfg || !cfg.svc || !cfg.svc.length) { vw.innerHTML = '<div class="bz-warn"><h2>This booking link is not complete</h2><p>Ask the business to send the link again. Business owners can make a free booking link on the <a href="/book/">booking page maker</a>.</p></div>'; return; }
    var st = { svc: 0, date: null, slot: null }, now = new Date();
    var L = { en: { pick: 'Choose a service', day: 'Choose a day', slot: 'Choose a time', none: 'No free times on this day. Try another day.', name: 'Your name', phone: 'Your phone number', msg: 'Anything the business should know (optional)', send: 'Send booking request on WhatsApp', note: 'This is a request. The business will confirm it by reply on WhatsApp.',
      text: function (c, s, d, t, n, p, m) { return 'Hello ' + c.name + ', I would like to book ' + s.n + ' on ' + d + ' at ' + t + '. Name: ' + n + '. Phone: ' + p + (m ? '. Note: ' + m : '') + '.'; } },
      hi: { pick: 'सेवा चुनें', day: 'दिन चुनें', slot: 'समय चुनें', none: 'इस दिन कोई समय खाली नहीं है। दूसरा दिन चुनें।', name: 'आपका नाम', phone: 'आपका फ़ोन नंबर', msg: 'कुछ बताना हो तो लिखें (ज़रूरी नहीं)', send: 'WhatsApp पर बुकिंग अनुरोध भेजें', note: 'यह एक अनुरोध है। व्यवसाय WhatsApp पर जवाब देकर पक्का करेगा।',
        text: function (c, s, d, t, n, p, m) { return 'नमस्ते ' + c.name + ', मैं ' + d + ' को ' + t + ' बजे ' + s.n + ' के लिए बुकिंग करना चाहता/चाहती हूँ। नाम: ' + n + '। फ़ोन: ' + p + (m ? '। नोट: ' + m : '') + '।'; } },
      pa: { pick: 'ਸੇਵਾ ਚੁਣੋ', day: 'ਦਿਨ ਚੁਣੋ', slot: 'ਸਮਾਂ ਚੁਣੋ', none: 'ਇਸ ਦਿਨ ਕੋਈ ਸਮਾਂ ਖਾਲੀ ਨਹੀਂ ਹੈ। ਹੋਰ ਦਿਨ ਚੁਣੋ।', name: 'ਤੁਹਾਡਾ ਨਾਂ', phone: 'ਤੁਹਾਡਾ ਫ਼ੋਨ ਨੰਬਰ', msg: 'ਕੁਝ ਦੱਸਣਾ ਹੋਵੇ ਤਾਂ ਲਿਖੋ (ਲੋੜੀਂਦਾ ਨਹੀਂ)', send: 'WhatsApp \'ਤੇ ਬੁਕਿੰਗ ਬੇਨਤੀ ਭੇਜੋ', note: 'ਇਹ ਇੱਕ ਬੇਨਤੀ ਹੈ। ਕਾਰੋਬਾਰ WhatsApp \'ਤੇ ਜਵਾਬ ਦੇ ਕੇ ਪੱਕਾ ਕਰੇਗਾ।',
        text: function (c, s, d, t, n, p, m) { return 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ ' + c.name + ', ਮੈਂ ' + d + ' ਨੂੰ ' + t + ' ਵਜੇ ' + s.n + ' ਲਈ ਬੁਕਿੰਗ ਕਰਨਾ ਚਾਹੁੰਦਾ/ਚਾਹੁੰਦੀ ਹਾਂ। ਨਾਂ: ' + n + '। ਫ਼ੋਨ: ' + p + (m ? '। ਨੋਟ: ' + m : '') + '।'; } } };
    var T = L[cfg.lang] || L.en;
    document.title = 'Book with ' + cfg.name; var h1 = document.getElementById('bk-h1'); if (h1) h1.textContent = cfg.name;
    var draw = function () {
      var s = cfg.svc[st.svc] || cfg.svc[0], dates = [], i, d;
      for (i = 0; i < (cfg.ahead || 14) && dates.length < 14; i++) { d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); if (slots(cfg, s, ds(d), now).length) dates.push(d); }
      if (!st.date || !dates.some(function (x) { return ds(x) === st.date; })) st.date = dates.length ? ds(dates[0]) : null;
      var sl = st.date ? slots(cfg, s, st.date, now) : [];
      var h = (cfg.note ? '<p>' + esc(cfg.note) + '</p>' : '') + '<h2>' + T.pick + '</h2><div class="bz-tabs" role="group">' + cfg.svc.map(function (x, k) { return '<button type="button" data-svc="' + k + '" aria-pressed="' + (k === st.svc) + '">' + esc(x.n) + ' · ' + x.min + ' min' + (x.p ? ' · ' + money(x.p) : '') + '</button>'; }).join('') + '</div>' +
        '<h2>' + T.day + '</h2><div class="bz-tabs" role="group">' + (dates.map(function (x) { return '<button type="button" data-date="' + ds(x) + '" aria-pressed="' + (ds(x) === st.date) + '">' + x.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + '</button>'; }).join('') || '<p>' + T.none + '</p>') + '</div>' +
        '<h2>' + T.slot + '</h2><div class="bz-tabs" role="group">' + (sl.map(function (m) { return '<button type="button" data-slot="' + m + '" aria-pressed="' + (st.slot === m) + '">' + tm(m) + '</button>'; }).join('') || '<p>' + T.none + '</p>') + '</div>' +
        '<form class="finder" id="bk-send"><div class="fields"><div><label for="bv-n">' + T.name + '</label><input type="text" id="bv-n" required maxlength="60"></div><div><label for="bv-p">' + T.phone + '</label><input type="tel" id="bv-p" inputmode="tel" maxlength="20"></div></div>' +
        '<label for="bv-m" style="margin-top:10px">' + T.msg + '</label><textarea id="bv-m" maxlength="200"></textarea><div class="acts"><button class="btn" type="submit"' + (st.slot == null ? ' disabled' : '') + '>' + T.send + '</button></div><p>' + T.note + '</p></form>';
      var keep = vw.querySelector('#bv-n') ? [B.s('bv-n'), B.s('bv-p'), B.s('bv-m')] : null;
      vw.innerHTML = h;
      if (keep) { $('#bv-n').value = keep[0]; $('#bv-p').value = keep[1]; $('#bv-m').value = keep[2]; }
    };
    vw.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-svc')) { st.svc = +b.getAttribute('data-svc'); st.slot = null; draw(); }
      else if (b.hasAttribute('data-date')) { st.date = b.getAttribute('data-date'); st.slot = null; draw(); }
      else if (b.hasAttribute('data-slot')) { st.slot = +b.getAttribute('data-slot'); draw(); }
    });
    vw.addEventListener('submit', function (e) {
      e.preventDefault(); if (st.slot == null) return;
      var s = cfg.svc[st.svc], d = new Date(st.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      window.open(B.wa(cfg.wa, T.text(cfg, s, d, tm(st.slot), B.s('bv-n').trim(), B.s('bv-p').trim(), B.s('bv-m').trim())), '_blank', 'noopener');
    });
    draw();
  }

  var sl = document.getElementById('sl-form');
  if (sl) {
    var go = function () {
      var len = B.v('sl-len'), gap = B.v('sl-gap'), open = B.v('sl-hours') * 60, per = len + gap, n = per > 0 ? Math.floor((open + gap) / per) : 0, price = B.v('sl-price'), days = B.v('sl-days');
      var res = $('#sl-res'); res.hidden = false; res.className = 'result';
      res.innerHTML = '<h2>You can fit <span class="big">' + n + '</span> appointments a day</h2><div class="tbl"><table><tbody><tr><td>Time for one appointment including the gap</td><td class="bz-n">' + per + ' minutes</td></tr><tr><td>Appointments in ' + B.v('sl-hours') + ' open hours</td><td class="bz-n">' + n + '</td></tr><tr><td>Appointments in a week of ' + days + ' days</td><td class="bz-n">' + n * days + '</td></tr>' +
        '<tr><td>Money if every slot is booked, per week</td><td class="bz-n">' + money(n * days * price) + '</td></tr><tr><td>If only 60 percent are booked</td><td class="bz-n">' + money(n * days * price * 0.6) + '</td></tr></tbody></table></div>';
    };
    sl.addEventListener('input', go); go();
  }
})();
