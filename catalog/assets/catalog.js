(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, esc = B.esc, KEY = 'bz-catalog-v1';
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function money(n, c) { return n ? (B.cur[c] || '') + (Math.round(n * 100) / 100).toLocaleString(c === 'INR' ? 'en-IN' : 'en-US') : ''; }
  window.CATX = { enc: enc, dec: dec };

  var root = document.getElementById('ct-app');
  if (root) {
    var C = B.store.get(KEY, null) || { shop: '', wa: '', cur: 'INR', note: '', items: [{ n: '', p: '', d: '', img: '' }] };
    var PR = window.CAT_PRESETS, pm = /^#t=(\w+)/.exec(location.hash);
    if (pm && PR && PR[pm[1]] && !(C.items.length > 1 && C.items[0].n)) { C.items = PR[pm[1]].items.map(function (x) { return { n: x[0], p: x[1], d: x[2], img: '' }; }); C.note = C.note || PR[pm[1]].note; }
    var msg = '';
    var save = function () { if (!B.store.set(KEY, C)) msg = 'Your browser could not save the photos here (too large). Download the catalogue file to keep a copy.'; };
    var field = function (id, label, val, type, extra) { return '<div><label for="' + id + '">' + label + '</label><input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '></div>'; };
    var drawForm = function () {
      var h = '<form class="finder bz" id="ct-form" onsubmit="return false"><h2>Your shop</h2><div class="fields">' + field('ct-shop', 'Shop or business name', C.shop, 'text', 'maxlength="60"') + field('ct-wa', 'WhatsApp number with country code', C.wa, 'tel', 'inputmode="numeric" maxlength="16" placeholder="919876543210"') +
        '<div><label for="ct-cur">Currency</label><select id="ct-cur">' + ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD'].map(function (c) { return '<option value="' + c + '"' + (C.cur === c ? ' selected' : '') + '>' + c + ' ' + B.cur[c] + '</option>'; }).join('') + '</select></div></div>' +
        field('ct-note', 'A line under the name (address, hours, delivery; optional)', C.note, 'text', 'maxlength="200"') + '<h2>Your items</h2><div id="ct-items">' + C.items.map(function (x, i) {
          return '<div class="finder" data-i="' + i + '" style="margin:10px 0"><div class="fields">' + field('ct-n' + i, 'Item name', x.n, 'text', 'maxlength="70" data-k="n"') + field('ct-p' + i, 'Price', x.p, 'number', 'min="0" step="any" inputmode="decimal" data-k="p"') + '</div>' +
            '<label for="ct-d' + i + '">A short description (optional)</label><input type="text" id="ct-d' + i + '" maxlength="140" value="' + esc(x.d) + '" data-k="d"><div class="acts"><label class="btn sm ghost" style="margin:0;cursor:pointer">' + (x.img ? 'Change photo' : 'Add photo') + '<input type="file" accept="image/*" data-photo="' + i + '" style="display:none"></label>' + (x.img ? '<img src="' + x.img + '" alt="" style="height:44px;border-radius:6px"> <button class="btn sm ghost" type="button" data-rmimg="' + i + '">Remove photo</button>' : '') + ' <button class="btn sm ghost" type="button" data-rm="' + i + '">Remove item</button></div></div>'; }).join('') + '</div>' +
        '<div class="acts"><button class="btn" type="button" id="ct-add">Add another item</button></div></form>';
      $('#ct-edit').innerHTML = h;
    };
    var drawOut = function () {
      var items = C.items.filter(function (x) { return x.n.trim(); });
      var o = '', c = C.cur;
      if (msg) o += '<p class="bz-warn">' + esc(msg) + '</p>';
      if (!items.length) { $('#ct-out').innerHTML = o + '<p class="note">Add an item name to see your catalogue.</p>'; return; }
      var txt = '*' + (C.shop || 'Our catalogue') + '*\n' + (C.note ? C.note + '\n' : '') + '\n' + items.map(function (x, i) { return (i + 1) + '. ' + x.n + (x.p ? ' - ' + money(+x.p, c) : '') + (x.d ? '\n   ' + x.d : ''); }).join('\n') + (C.wa ? '\n\nTo order, message us on WhatsApp: +' + C.wa : '');
      var link = location.origin + '/catalog/c/#' + enc({ s: C.shop, w: String(C.wa).replace(/\D/g, ''), c: c, t: C.note, i: items.map(function (x) { return [x.n, +x.p || 0, x.d]; }) });
      o += '<div class="result"><h2>' + items.length + ' item' + (items.length === 1 ? '' : 's') + ' ready</h2><div class="acts"><button class="btn" type="button" id="ct-print">Print or save as PDF (with photos)</button><button class="btn" type="button" data-copy="' + esc(txt) + '">Copy as a WhatsApp list</button><button class="btn ghost" type="button" data-wa="' + esc(txt) + '">Send the list on WhatsApp</button></div>' +
        '<h3>Order link (text only, no photos)</h3><p>Customers open it, choose quantities and send the order to you on WhatsApp. Link length: ' + link.length + ' characters' + (link.length > 3000 ? '. This is long; some apps may cut it. Use the PDF or the text list for a big catalogue.' : '.') + '</p><input type="text" readonly value="' + esc(link) + '" aria-label="Order link" style="width:100%;min-height:46px;padding:8px;font:inherit"><div class="acts"><button class="btn sm" type="button" data-copy="' + esc(link) + '">Copy the link</button><a class="btn sm ghost" target="_blank" rel="noopener" href="' + esc(link) + '">Open and test it</a></div></div>' +
        '<div class="cards" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr))">' + items.map(function (x) { return '<div class="card">' + (x.img ? '<img src="' + x.img + '" alt="' + esc(x.n) + '" style="width:100%;border-radius:8px">' : '') + '<b>' + esc(x.n) + '</b>' + (x.p ? '<div class="bz-n">' + money(+x.p, c) + '</div>' : '') + (x.d ? '<p style="margin:4px 0 0;font-size:.9rem">' + esc(x.d) + '</p>' : '') + '</div>'; }).join('') + '</div>';
      $('#ct-out').innerHTML = o;
    };
    var printIt = function () {
      var items = C.items.filter(function (x) { return x.n.trim(); }), c = C.cur;
      B.printHtml('<div style="font:14px/1.4 system-ui,sans-serif;color:#000;background:#fff;padding:10px"><h1 style="margin:0;font-size:26px">' + esc(C.shop || 'Our catalogue') + '</h1><p style="margin:2px 0 4px">' + esc(C.note) + '</p><p style="margin:0 0 12px"><b>' + (C.wa ? 'Order on WhatsApp: +' + esc(C.wa) : '') + '</b></p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">' +
        items.map(function (x) { return '<div style="border:1px solid #999;border-radius:8px;padding:8px;break-inside:avoid">' + (x.img ? '<img src="' + x.img + '" alt="" style="width:100%;border-radius:6px">' : '') + '<div style="font-weight:700;margin-top:4px">' + esc(x.n) + '</div>' + (x.p ? '<div style="font-size:16px">' + esc(money(+x.p, c)) + '</div>' : '') + (x.d ? '<div style="font-size:12px">' + esc(x.d) + '</div>' : '') + '</div>'; }).join('') + '</div></div>');
    };
    var resize = function (file, done) {
      var r = new FileReader();
      r.onload = function () { var im = new Image(); im.onload = function () { var m = 520, k = Math.min(1, m / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); done(cv.toDataURL('image/jpeg', 0.72)); }; im.onerror = function () { done(''); }; im.src = r.result; };
      r.readAsDataURL(file);
    };
    root.innerHTML = '<div id="ct-edit"></div><div id="ct-out" aria-live="polite"></div>' +
      '<div class="finder bz"><h2>Keep a copy</h2><p>Your catalogue is saved in this browser only. Download a file to keep a copy or to move to another phone.</p><div class="acts"><button class="btn ghost" type="button" id="ct-dl">Download catalogue file</button><label class="btn ghost" style="cursor:pointer;margin:0">Restore from a file<input type="file" accept=".json,application/json" id="ct-up" style="display:none"></label><button class="btn ghost" type="button" id="ct-clear">Clear everything</button></div></div>';
    drawForm(); drawOut();
    var t = null; var later = function () { clearTimeout(t); t = setTimeout(function () { save(); drawOut(); }, 250); };
    root.addEventListener('input', function (e) {
      var el = e.target, box = el.closest('[data-i]');
      if (box && el.getAttribute('data-k')) { C.items[+box.getAttribute('data-i')][el.getAttribute('data-k')] = el.value; }
      else if (el.id === 'ct-shop') C.shop = el.value; else if (el.id === 'ct-wa') C.wa = el.value.replace(/\D/g, ''); else if (el.id === 'ct-note') C.note = el.value; else return;
      later();
    });
    root.addEventListener('change', function (e) {
      var el = e.target;
      if (el.id === 'ct-cur') { C.cur = el.value; save(); drawOut(); }
      else if (el.hasAttribute('data-photo')) { var i = +el.getAttribute('data-photo'), f = el.files[0]; if (!f) return; resize(f, function (u) { C.items[i].img = u; save(); drawForm(); drawOut(); }); }
      else if (el.id === 'ct-up') { var f2 = el.files[0]; if (!f2) return; var r = new FileReader(); r.onload = function () { try { var x = JSON.parse(r.result); if (!x || !Array.isArray(x.items)) throw 0; C = x; msg = ''; save(); drawForm(); drawOut(); } catch (err) { msg = 'That file is not a catalogue from this tool.'; drawOut(); } }; r.readAsText(f2); }
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button,a'); if (!b) return;
      if (b.id === 'ct-add') { C.items.push({ n: '', p: '', d: '', img: '' }); save(); drawForm(); var l = document.getElementById('ct-n' + (C.items.length - 1)); if (l) l.focus(); }
      else if (b.hasAttribute('data-rm')) { C.items.splice(+b.getAttribute('data-rm'), 1); if (!C.items.length) C.items.push({ n: '', p: '', d: '', img: '' }); save(); drawForm(); drawOut(); }
      else if (b.hasAttribute('data-rmimg')) { C.items[+b.getAttribute('data-rmimg')].img = ''; save(); drawForm(); drawOut(); }
      else if (b.id === 'ct-print') printIt();
      else if (b.id === 'ct-dl') B.download('catalogue.json', JSON.stringify(C));
      else if (b.id === 'ct-clear') { if (confirm('Clear the whole catalogue from this browser? Download a file first if you want a copy.')) { C = { shop: '', wa: '', cur: 'INR', note: '', items: [{ n: '', p: '', d: '', img: '' }] }; save(); drawForm(); drawOut(); } }
    });
  }

  var vw = document.getElementById('ct-view');
  if (vw) {
    var D = null; try { D = dec(location.hash.slice(1)); } catch (e) { D = null; }
    if (!D || !D.i || !D.i.length) { vw.innerHTML = '<div class="bz-warn"><h2>This catalogue link is not complete</h2><p>Ask the shop to send the link again. Shops can make a free catalogue on the <a href="/catalog/">catalogue maker</a>.</p></div>'; }
    else {
      var q = {}, c = D.c || 'INR', h1 = document.getElementById('ct-h1'); if (h1) h1.textContent = D.s || 'Catalogue'; document.title = (D.s || 'Catalogue') + ' catalogue';
      var total = function () { var n = 0, s = 0; D.i.forEach(function (x, k) { if (q[k]) { n += q[k]; s += q[k] * (x[1] || 0); } }); return [n, s]; };
      var draw = function (filter) {
        var f = (filter || '').toLowerCase();
        $('#ct-list').innerHTML = D.i.map(function (x, k) { if (f && (x[0] + ' ' + (x[2] || '')).toLowerCase().indexOf(f) < 0) return ''; return '<li class="card"><b>' + esc(x[0]) + '</b>' + (x[1] ? '<div class="bz-n">' + money(x[1], c) + '</div>' : '') + (x[2] ? '<p style="margin:2px 0">' + esc(x[2]) + '</p>' : '') +
          '<div class="acts"><button class="btn sm ghost" type="button" data-q="' + k + '" data-d="-1" aria-label="Fewer ' + esc(x[0]) + '">-</button><span class="bz-n" style="min-width:2ch;text-align:center" id="q' + k + '">' + (q[k] || 0) + '</span><button class="btn sm" type="button" data-q="' + k + '" data-d="1" aria-label="More ' + esc(x[0]) + '">+</button></div></li>'; }).join('');
      };
      var sum = function () { var t = total(); $('#ct-sum').innerHTML = t[0] ? '<b>' + t[0] + ' item' + (t[0] === 1 ? '' : 's') + (t[1] ? ', ' + money(t[1], c) : '') + '</b> <button class="btn" type="button" id="ct-send">Send order on WhatsApp</button>' : 'Tap + on an item to start an order.'; };
      vw.innerHTML = (D.t ? '<p>' + esc(D.t) + '</p>' : '') + '<div class="finder"><label for="ct-q">Search this catalogue</label><input type="search" id="ct-q" style="width:100%;min-height:46px;padding:8px;font:inherit"></div><ul class="cards" id="ct-list" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr));list-style:none;padding:0"></ul><div class="finder" id="ct-sum" style="position:sticky;bottom:8px" aria-live="polite"></div>';
      draw(''); sum();
      vw.addEventListener('input', function (e) { if (e.target.id === 'ct-q') draw(e.target.value); });
      vw.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-q')) { var k = +b.getAttribute('data-q'); q[k] = Math.max(0, Math.min(99, (q[k] || 0) + (+b.getAttribute('data-d')))); var s = document.getElementById('q' + k); if (s) s.textContent = q[k]; sum(); }
        else if (b.id === 'ct-send') {
          var lines = D.i.map(function (x, k) { return q[k] ? q[k] + ' x ' + x[0] + (x[1] ? ' (' + money(x[1] * q[k], c) + ')' : '') : ''; }).filter(Boolean), t = total();
          window.open(B.wa(D.w, 'Hello ' + (D.s || '') + ', I would like to order:\n' + lines.join('\n') + (t[1] ? '\nTotal: ' + money(t[1], c) : '') + '\nName: '), '_blank', 'noopener');
        }
      });
    }
  }

  var pl = document.getElementById('pl-form');
  if (pl) {
    var run = function () {
      var shop = B.s('pl-shop'), wa = B.s('pl-wa').replace(/\D/g, ''), c = B.s('pl-cur'), rows = B.s('pl-rows').split('\n').map(function (l) { var i = l.lastIndexOf(','); return i < 0 ? [l.trim(), ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }).filter(function (r) { return r[0]; });
      var txt = '*' + (shop || 'Price list') + '*\n\n' + rows.map(function (r) { var p = parseFloat(r[1]); return r[0] + (isFinite(p) ? ' - ' + money(p, c) : (r[1] ? ' - ' + r[1] : '')); }).join('\n') + (wa ? '\n\nOrder on WhatsApp: +' + wa : '') + '\n\nPrices may change. Please confirm before you order.';
      $('#pl-out').innerHTML = '<div class="result"><h2>Your price list</h2><div class="card"><p class="msg">' + esc(txt) + '</p><div class="acts"><button class="btn sm" type="button" data-copy="' + esc(txt) + '">Copy</button><button class="btn sm ghost" type="button" data-wa="' + esc(txt) + '">Send on WhatsApp</button><button class="btn sm ghost" type="button" id="pl-print">Print</button></div></div></div>';
      $('#pl-print').onclick = function () { B.printHtml('<div style="font:16px/1.6 system-ui,sans-serif;color:#000;background:#fff;padding:14px;max-width:640px"><h1>' + esc(shop || 'Price list') + '</h1><table style="width:100%;border-collapse:collapse">' + rows.map(function (r) { var p = parseFloat(r[1]); return '<tr><td style="border-bottom:1px solid #aaa;padding:6px 4px">' + esc(r[0]) + '</td><td style="border-bottom:1px solid #aaa;padding:6px 4px;text-align:right">' + esc(isFinite(p) ? money(p, c) : r[1]) + '</td></tr>'; }).join('') + '</table><p>' + (wa ? 'Order on WhatsApp: +' + esc(wa) : '') + '</p></div>'); };
    };
    pl.addEventListener('input', run); pl.addEventListener('change', run); run();
  }
})();
