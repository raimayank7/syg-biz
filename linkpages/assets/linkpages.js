(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, esc = B.esc;
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function wno(s) { var d = digits(s); return d.length <= 10 ? '91' + d : d; }
  function wire(id, fn) { var f = document.getElementById(id); if (!f) return; var go = function () { fn(f); }; f.addEventListener('input', go); f.addEventListener('change', go); f.addEventListener('submit', function (e) { e.preventDefault(); go(); }); go(); }
  function qrSvg(text, cell) {
    try { if (!window.qrcode) return ''; var q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag(cell || 4, 2); } catch (e) { return ''; }
  }
  function linkBox(out, what, link, scan, title) {
    var qr = link.length <= 1800 ? qrSvg(link, 4) : '';
    out.innerHTML = '<div class="result"><h2>Your ' + what + ' link is ready</h2><p>Share it on WhatsApp or put it in your profile. It is ' + link.length + ' characters long.</p><input type="text" readonly value="' + esc(link) + '" aria-label="Your link" style="width:100%;min-height:46px;padding:8px;font:inherit"><div class="acts"><button class="btn" type="button" data-copy="' + esc(link) + '">Copy the link</button><a class="btn ghost" target="_blank" rel="noopener" href="' + esc(link) + '">Open and test it</a><button class="btn ghost" type="button" data-wa="' + esc(link) + '">Share on WhatsApp</button></div>' +
      (qr ? '<h3>QR code</h3><div style="max-width:220px;background:#fff;padding:8px" id="lp-qr">' + qr + '</div><p>Customers scan it with their phone camera. Test it once yourself.</p><div class="acts"><button class="btn sm" type="button" id="lp-qrprint">Print a QR card</button></div>' : (link.length > 1800 ? '<p class="note">The link is too long for a QR code. Shorten the text, or share the link itself.</p>' : '')) + '</div>';
    var pb = document.getElementById('lp-qrprint');
    if (pb) pb.onclick = function () { B.printHtml('<div style="max-width:420px;margin:20px auto;padding:20px;border:2px solid #000;text-align:center;font:18px/1.4 system-ui,sans-serif;color:#000;background:#fff"><div style="font-size:24px;font-weight:800">' + esc(title || what) + '</div><p>' + esc(scan || 'Scan to open') + '</p><div style="width:300px;margin:0 auto">' + qrSvg(link, 6) + '</div></div>'); };
  }
  function problems(out, list) { out.innerHTML = '<div class="bz-warn"><b>Before you get your link:</b><ul>' + list.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>'; }
  function bad(v) { return '<div class="bz-warn"><h2>This link is not complete</h2><p>Ask the sender for the link again, or make your own on the <a href="/linkpages/">home page</a>.</p></div>'; }
  function applyPreset() {
    var pm = /^#t=(\w+)/.exec(location.hash), PS = window.LP_PRESETS;
    if (pm && PS && PS[pm[1]]) { var pr = PS[pm[1]]; Object.keys(pr).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = pr[id]; }); }
  }

  // ---------- form ----------
  function parseQs(t) {
    return String(t).split('\n').map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 20).map(function (l) {
      var p = l.split('|').map(function (x) { return x.trim(); }), q = p[0].slice(0, 140), ty = (p[1] || 'text').toLowerCase(), opts = [];
      if (ty.indexOf('choice') === 0) { opts = ((p[1] || '').split(':')[1] || p[2] || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8); ty = opts.length >= 2 ? 'choice' : 'text'; }
      else if (['rating', 'long', 'text'].indexOf(ty) < 0) ty = 'text';
      return { q: q, t: ty, o: opts };
    }).filter(function (x) { return x.q; });
  }
  var ff = document.getElementById('fm-form');
  if (ff) {
    applyPreset();
    wire('fm-form', function () {
      var c = { t: B.s('fm-t').trim().slice(0, 80), i: B.s('fm-i').trim().slice(0, 240), w: digits(B.s('fm-w')), q: parseQs(B.s('fm-q')), r: B.s('fm-r').trim().slice(0, 80) }, p = [];
      if (!c.t) p.push('Type a title for the form.'); if (c.w.length < 10) p.push('Type your WhatsApp number with the country code, for example 919876543210.'); if (!c.q.length) p.push('Add at least one question, one on each line.');
      var out = $('#fm-out'); if (p.length) return problems(out, p);
      linkBox(out, 'form', location.origin + '/linkpages/f/#' + enc(c), 'Scan to answer a few questions', c.t);
    });
  }
  var fv = document.getElementById('fm-view');
  if (fv) {
    var c = null; try { c = dec(location.hash.slice(1)); } catch (e) { c = null; }
    if (!c || !c.q || !c.q.length) fv.innerHTML = bad();
    else {
      var h1 = document.getElementById('fm-h1'); if (h1) h1.textContent = c.t || 'Form'; document.title = c.t || 'Form';
      var h = (c.i ? '<p>' + esc(c.i) + '</p>' : '') + '<form id="fm-send">' + c.q.map(function (x, k) {
        var id = 'q' + k, lab = '<label for="' + id + '" style="font-weight:600">' + (k + 1) + '. ' + esc(x.q) + '</label>';
        if (x.t === 'rating') return '<fieldset class="finder"><legend style="font-weight:600">' + (k + 1) + '. ' + esc(x.q) + '</legend><div class="bz-tabs">' + [1, 2, 3, 4, 5].map(function (n) { return '<label style="margin:0"><input type="radio" name="' + id + '" value="' + n + '" style="position:absolute;opacity:0"><span class="btn ghost" style="min-width:48px;justify-content:center;cursor:pointer">' + n + '</span></label>'; }).join('') + '</div><small>1 is poor, 5 is excellent</small></fieldset>';
        if (x.t === 'choice') return '<fieldset class="finder"><legend style="font-weight:600">' + (k + 1) + '. ' + esc(x.q) + '</legend>' + x.o.map(function (o, j) { return '<label style="display:flex;gap:8px;align-items:center;min-height:40px;font-weight:400"><input type="radio" name="' + id + '" value="' + esc(o) + '"> ' + esc(o) + '</label>'; }).join('') + '</fieldset>';
        if (x.t === 'long') return '<div class="finder">' + lab + '<textarea id="' + id + '" rows="3" maxlength="500" style="width:100%"></textarea></div>';
        return '<div class="finder">' + lab + '<input type="text" id="' + id + '" maxlength="200" style="width:100%"></div>';
      }).join('') + '<div class="acts"><button class="btn" type="submit">Send on WhatsApp</button></div><p>' + (c.r ? esc(c.r) + ' ' : '') + 'Your answers go only to the business on WhatsApp. You can add your name in the message before you send.</p></form>';
      fv.innerHTML = h;
      fv.addEventListener('click', function (e) { var s = e.target.closest('label span.btn'); if (s) { var grp = s.closest('.bz-tabs'); grp.querySelectorAll('span.btn').forEach(function (x) { x.classList.add('ghost'); }); s.classList.remove('ghost'); } });
      fv.addEventListener('submit', function (e) {
        e.preventDefault(); var lines = [c.t, ''];
        c.q.forEach(function (x, k) { var a = ''; if (x.t === 'rating' || x.t === 'choice') { var r = fv.querySelector('input[name="q' + k + '"]:checked'); a = r ? r.value + (x.t === 'rating' ? ' out of 5' : '') : '-'; } else a = (document.getElementById('q' + k).value || '-').trim(); lines.push((k + 1) + '. ' + x.q + ' ' + a); });
        window.open(B.wa(c.w, lines.join('\n')), '_blank', 'noopener');
      });
    }
  }

  // ---------- course page ----------
  var cf = document.getElementById('co-form');
  if (cf) {
    applyPreset();
    wire('co-form', function () {
      var upi = B.s('co-u').trim(), c = { t: B.s('co-t').trim().slice(0, 80), by: B.s('co-by').trim().slice(0, 60), d: B.s('co-d').trim().slice(0, 400), pts: B.s('co-p').split('\n').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8).map(function (x) { return x.slice(0, 120); }), s: B.s('co-s').trim().slice(0, 120), pr: parseFloat(B.s('co-pr')) || 0, u: upi, w: digits(B.s('co-w')) }, p = [];
      if (!c.t) p.push('Type the name of your course or class.'); if (c.w.length < 10) p.push('Type your WhatsApp number with the country code.'); if (upi && !/^[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9]{1,}$/.test(upi)) p.push('Your UPI id should look like name@bank.');
      var out = $('#co-out'); if (p.length) return problems(out, p);
      linkBox(out, 'course page', location.origin + '/linkpages/c/#' + enc(c), 'Scan to see the class and join', c.t);
    });
  }
  var cv = document.getElementById('co-view');
  if (cv) {
    var d = null; try { d = dec(location.hash.slice(1)); } catch (e) { d = null; }
    if (!d || !d.t) cv.innerHTML = bad();
    else {
      var h1c = document.getElementById('co-h1'); if (h1c) h1c.textContent = d.t; document.title = d.t;
      var upiOk = d.u && /^[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9]{1,}$/.test(d.u) && d.pr > 0, upiLink = upiOk ? 'upi://pay?pa=' + encodeURIComponent(d.u) + '&pn=' + encodeURIComponent(d.by || d.t) + '&am=' + encodeURIComponent(d.pr.toFixed(2)) + '&cu=INR&tn=' + encodeURIComponent(d.t.slice(0, 40)) : '';
      cv.innerHTML = (d.by ? '<p><b>' + esc(d.by) + '</b></p>' : '') + (d.d ? '<p>' + esc(d.d) + '</p>' : '') + (d.pts && d.pts.length ? '<h2>What you get</h2><ul>' + d.pts.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + (d.s ? '<h2>When</h2><p>' + esc(d.s) + '</p>' : '') + (d.pr ? '<h2>Fee</h2><p style="font-size:1.4rem;font-weight:800">\u20b9' + Math.round(d.pr).toLocaleString('en-IN') + '</p>' : '') +
        '<div class="acts" style="flex-direction:column;align-items:stretch">' + (upiOk ? '<a class="btn" href="' + esc(upiLink) + '">Pay by UPI</a>' : '') + '<a class="btn' + (upiOk ? ' ghost' : '') + '" target="_blank" rel="noopener" href="' + esc(B.wa(d.w, 'Hello, I would like to join ' + d.t + '. My name is ')) + '">' + (upiOk ? 'I have paid: tell the organiser on WhatsApp' : 'Ask or join on WhatsApp') + '</a></div><p>' + (upiOk ? 'Paying opens your UPI app with the amount filled in. Check the name and amount before you pay, then send a message so that the organiser can confirm your place.' : 'Send a message to join. The organiser will tell you how to pay.') + '</p>';
    }
  }

  // ---------- event page ----------
  function ics(e) {
    var d = String(e.d || '').replace(/-/g, ''), t = String(e.tm || '10:00').replace(':', '') + '00', uid = Math.random().toString(36).slice(2) + '@shareyourgroup', esc2 = function (s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); };
    return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ShareYourGroup//Event//EN\r\nBEGIN:VEVENT\r\nUID:' + uid + '\r\nDTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z\r\nDTSTART:' + d + 'T' + t + '\r\nSUMMARY:' + esc2(e.t) + '\r\nLOCATION:' + esc2(e.p) + '\r\nDESCRIPTION:' + esc2(e.x) + '\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
  }
  var ef = document.getElementById('ev-form');
  if (ef) {
    applyPreset();
    wire('ev-form', function () {
      var c = { t: B.s('ev-t').trim().slice(0, 80), d: B.s('ev-d'), tm: B.s('ev-tm'), p: B.s('ev-p').trim().slice(0, 140), x: B.s('ev-x').trim().slice(0, 400), h: B.s('ev-h').trim().slice(0, 60), pr: B.s('ev-pr').trim().slice(0, 40), w: digits(B.s('ev-w')) }, p = [];
      if (!c.t) p.push('Type the name of the event.'); if (!c.d) p.push('Choose the date.'); if (!c.p) p.push('Type the place.'); if (c.w.length < 10) p.push('Type your WhatsApp number with the country code.');
      var out = $('#ev-out'); if (p.length) return problems(out, p);
      linkBox(out, 'event', location.origin + '/linkpages/e/#' + enc(c), 'Scan to see the event and reply', c.t);
    });
  }
  var ev = document.getElementById('ev-view');
  if (ev) {
    var e0 = null; try { e0 = dec(location.hash.slice(1)); } catch (e) { e0 = null; }
    if (!e0 || !e0.t) ev.innerHTML = bad();
    else {
      var h1e = document.getElementById('ev-h1'); if (h1e) h1e.textContent = e0.t; document.title = e0.t;
      var when = e0.d ? new Date(e0.d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (e0.tm ? ' at ' + e0.tm : '') : '';
      ev.innerHTML = (e0.h ? '<p>Hosted by <b>' + esc(e0.h) + '</b></p>' : '') + '<h2>When</h2><p>' + esc(when) + '</p><h2>Where</h2><p>' + esc(e0.p) + '</p>' + (e0.x ? '<h2>Details</h2><p>' + esc(e0.x) + '</p>' : '') + (e0.pr ? '<h2>Entry</h2><p>' + esc(e0.pr) + '</p>' : '') +
        '<form class="finder" id="ev-rsvp"><div class="fields"><div><label for="ev-n">Your name</label><input type="text" id="ev-n" maxlength="60" required></div><div><label for="ev-g">How many will come (including you)</label><input type="number" id="ev-g" min="1" max="20" value="1"></div></div><div class="acts"><button class="btn" type="submit">I will come: tell the host on WhatsApp</button><button class="btn ghost" type="button" id="ev-no">I cannot come</button></div></form>' +
        '<div class="acts"><button class="btn ghost" type="button" id="ev-ics">Add to my calendar</button><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e0.p) + '">Open the place on a map</a></div>';
      document.getElementById('ev-rsvp').addEventListener('submit', function (e) { e.preventDefault(); window.open(B.wa(e0.w, 'Hello, I will come to ' + e0.t + ' on ' + e0.d + '. Name: ' + B.s('ev-n').trim() + '. Number of people: ' + (B.s('ev-g') || 1) + '.'), '_blank', 'noopener'); });
      document.getElementById('ev-no').addEventListener('click', function () { window.open(B.wa(e0.w, 'Hello, I am sorry, I cannot come to ' + e0.t + '. Name: ' + B.s('ev-n').trim() + '.'), '_blank', 'noopener'); });
      document.getElementById('ev-ics').addEventListener('click', function () { B.download((e0.t || 'event') + '.ics', ics(e0), 'text/calendar'); });
    }
  }

  // ---------- menu page ----------
  function parseMenu(t) {
    var secs = [], cur = null;
    String(t).split('\n').forEach(function (l) {
      l = l.trim(); if (!l) return;
      if (l.charAt(0) === '#') { cur = { n: l.replace(/^#+\s*/, '').slice(0, 50), i: [] }; secs.push(cur); return; }
      var p = l.split('|').map(function (x) { return x.trim(); }); if (!p[0]) return;
      if (!cur) { cur = { n: 'Menu', i: [] }; secs.push(cur); }
      var v = (p[2] || '').toLowerCase(); cur.i.push([p[0].slice(0, 60), parseFloat(p[1]) || 0, v === 'v' ? 'v' : v === 'n' ? 'n' : '', (p[3] || '').slice(0, 100)]);
    });
    return secs.filter(function (x) { return x.i.length; }).slice(0, 12);
  }
  var mf = document.getElementById('mn-form');
  if (mf) {
    applyPreset();
    wire('mn-form', function () {
      var c = { t: B.s('mn-t').trim().slice(0, 60), w: digits(B.s('mn-w')), i: B.s('mn-i').trim().slice(0, 200), s: parseMenu(B.s('mn-q')), tb: B.s('mn-tb') === '1' ? 1 : 0 }, p = [], n = 0;
      c.s.forEach(function (x) { n += x.i.length; });
      if (!c.t) p.push('Type the name of your place.'); if (c.w.length < 10) p.push('Type your WhatsApp number with the country code, for example 919876543210.'); if (!n) p.push('Add at least one dish. Start a section with # and write each dish as: name | price | v or n | short description.');
      var out = $('#mn-out'); if (p.length) return problems(out, p);
      linkBox(out, 'menu', location.origin + '/linkpages/m/#' + enc(c), 'Scan to see our menu and order', c.t);
    });
  }
  var mv = document.getElementById('mn-view');
  if (mv) {
    var M = null; try { M = dec(location.hash.slice(1)); } catch (e) { M = null; }
    if (!M || !M.s || !M.s.length) mv.innerHTML = bad();
    else {
      var h1m = document.getElementById('mn-h1'); if (h1m) h1m.textContent = M.t || 'Menu'; document.title = (M.t || 'Menu') + ' menu';
      var qty = {}, flat = []; M.s.forEach(function (sec, a) { sec.i.forEach(function (it, b) { flat.push([a, b]); }); });
      var money = function (n) { return n ? '\u20b9' + Math.round(n).toLocaleString('en-IN') : ''; };
      var draw = function (f) {
        f = (f || '').toLowerCase();
        mv.querySelector('#mn-list').innerHTML = M.s.map(function (sec, a) {
          var items = sec.i.map(function (it, b) { if (f && (it[0] + ' ' + it[3]).toLowerCase().indexOf(f) < 0) return ''; var k = a + '_' + b;
            return '<li class="card"><div><span style="display:inline-block;padding:0 6px;border-radius:4px;font-size:.75rem;font-weight:700;color:#fff;background:' + (it[2] === 'v' ? '#1b7f4b' : it[2] === 'n' ? '#b4281e' : 'transparent') + '">' + (it[2] === 'v' ? 'Veg' : it[2] === 'n' ? 'Non-veg' : '') + '</span> <b>' + esc(it[0]) + '</b></div>' + (it[3] ? '<p style="margin:2px 0">' + esc(it[3]) + '</p>' : '') + '<div class="acts"><span class="bz-n">' + money(it[1]) + '</span><button class="btn sm ghost" type="button" data-k="' + k + '" data-d="-1" aria-label="Fewer ' + esc(it[0]) + '">-</button><span class="bz-n" id="q' + k + '" style="min-width:2ch;text-align:center">' + (qty[k] || 0) + '</span><button class="btn sm" type="button" data-k="' + k + '" data-d="1" aria-label="More ' + esc(it[0]) + '">+</button></div></li>'; }).join('');
          return items ? '<h2>' + esc(sec.n) + '</h2><ul style="list-style:none;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))">' + items + '</ul>' : '';
        }).join('');
      };
      var tot = function () { var n = 0, s = 0; M.s.forEach(function (sec, a) { sec.i.forEach(function (it, b) { var q = qty[a + '_' + b] || 0; n += q; s += q * it[1]; }); }); return [n, s]; };
      var sum = function () { var t = tot(); mv.querySelector('#mn-sum').innerHTML = t[0] ? '<b>' + t[0] + ' item' + (t[0] === 1 ? '' : 's') + (t[1] ? ', ' + money(t[1]) : '') + '</b> <button class="btn" type="button" id="mn-send">Send order on WhatsApp</button>' : 'Tap + on a dish to start your order.'; };
      mv.innerHTML = (M.i ? '<p>' + esc(M.i) + '</p>' : '') + '<div class="finder"><label for="mn-f">Search the menu</label><input type="search" id="mn-f" style="width:100%;min-height:46px;padding:8px;font:inherit"></div><div id="mn-list"></div><div class="finder" style="position:sticky;bottom:8px"><div id="mn-sum" aria-live="polite"></div>' + (M.tb ? '<label for="mn-tn">Table number</label><input type="text" id="mn-tn" maxlength="10" style="width:100%;min-height:42px;padding:6px;font:inherit">' : '<label for="mn-tn">Your name and address (for delivery or pick-up)</label><input type="text" id="mn-tn" maxlength="120" style="width:100%;min-height:42px;padding:6px;font:inherit">') + '</div>';
      draw(''); sum();
      mv.addEventListener('input', function (e) { if (e.target.id === 'mn-f') draw(e.target.value); });
      mv.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-k')) { var k = b.getAttribute('data-k'); qty[k] = Math.max(0, Math.min(50, (qty[k] || 0) + (+b.getAttribute('data-d')))); var el = document.getElementById('q' + k); if (el) el.textContent = qty[k]; sum(); }
        else if (b.id === 'mn-send') {
          var lines = []; M.s.forEach(function (sec, a) { sec.i.forEach(function (it, b2) { var q = qty[a + '_' + b2] || 0; if (q) lines.push(q + ' x ' + it[0] + (it[1] ? ' (' + money(it[1] * q) + ')' : '')); }); }); var t = tot(), who = (document.getElementById('mn-tn') || {}).value || '';
          window.open(B.wa(M.w, 'Hello ' + (M.t || '') + ', I would like to order:\n' + lines.join('\n') + (t[1] ? '\nTotal: ' + money(t[1]) : '') + '\n' + (M.tb ? 'Table: ' : 'Name and address: ') + who), '_blank', 'noopener');
        }
      });
    }
  }

  // ---------- review request kit ----------
  var rf = document.getElementById('rv-form');
  if (rf) wire('rv-form', function () {
    var name = B.s('rv-n').trim(), link = B.s('rv-l').trim(), out = $('#rv-out');
    if (!/^https:\/\/[^\s"'<>]+$/i.test(link)) { out.innerHTML = '<p class="note">Paste the review link you copied from your own business profile. It starts with https://</p>'; return; }
    var qr = qrSvg(link, 5), msgs = {
      en: 'Hello, thank you for visiting ' + (name || 'us') + '. If you have a minute, we would be grateful for an honest review: ' + link,
      hi: 'नमस्ते, ' + (name || 'हमारे यहाँ') + ' आने के लिए धन्यवाद। यदि आपके पास एक मिनट हो तो कृपया अपना सच्चा अनुभव यहाँ लिखें: ' + link,
      pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ' + (name || 'ਸਾਡੇ ਕੋਲ') + ' ਆਉਣ ਲਈ ਧੰਨਵਾਦ। ਜੇ ਤੁਹਾਡੇ ਕੋਲ ਇੱਕ ਮਿੰਟ ਹੋਵੇ ਤਾਂ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸੱਚਾ ਤਜਰਬਾ ਇੱਥੇ ਲਿਖੋ: ' + link };
    out.innerHTML = '<div class="result"><h2>Your review request kit</h2>' + (qr ? '<div style="max-width:220px;background:#fff;padding:8px">' + qr + '</div><div class="acts"><button class="btn" type="button" id="rv-print">Print a QR card</button></div>' : '<p class="note">The link is too long to turn into a QR code, but the messages below still work.</p>') +
      ['en', 'hi', 'pa'].map(function (l) { return '<div class="card"><p class="msg"' + (l !== 'en' ? ' lang="' + l + '"' : '') + '><b>' + (l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Punjabi') + '</b>\n' + esc(msgs[l]) + '</p><div class="acts"><button class="btn sm" type="button" data-copy="' + esc(msgs[l]) + '">Copy</button><button class="btn sm ghost" type="button" data-wa="' + esc(msgs[l]) + '">WhatsApp</button></div></div>'; }).join('') + '</div>';
    var pb = document.getElementById('rv-print');
    if (pb) pb.onclick = function () { B.printHtml('<div style="max-width:420px;margin:20px auto;padding:20px;border:2px solid #000;text-align:center;font:18px/1.4 system-ui,sans-serif;color:#000;background:#fff"><div style="font-size:24px;font-weight:800">' + esc(name || 'Thank you') + '</div><p>Enjoyed your visit? Scan to leave an honest review.</p><div style="width:300px;margin:0 auto">' + qrSvg(link, 6) + '</div></div>'); };
  });
})();
