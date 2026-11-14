(function () {
  'use strict';
  var B = window.BIZ, $ = B.$, esc = B.esc;
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function money(n, c) { return (B.cur[c] || '') + (Math.round(n * 100) / 100).toLocaleString(c === 'INR' ? 'en-IN' : 'en-US'); }
  function wire(id, fn) { var f = document.getElementById(id); if (!f) return; var go = function () { fn(f); }; f.addEventListener('input', go); f.addEventListener('change', go); f.addEventListener('submit', function (e) { e.preventDefault(); go(); }); go(); }

  // ---- Code 128 (code set B) and EAN-13 ----
  var C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];
  function code128(text) {
    var vals = [104], sum = 104, i, c;
    for (i = 0; i < text.length; i++) { c = text.charCodeAt(i) - 32; if (c < 0 || c > 94) return null; vals.push(c); sum += c * (i + 1); }
    vals.push(sum % 103); vals.push(106);
    var bars = [], x = 0, dark = true;
    vals.forEach(function (v) { String(C128[v]).split('').forEach(function (w) { w = +w; if (dark) bars.push([x, w]); x += w; dark = !dark; }); dark = true; });
    return { bars: bars, width: x };
  }
  var L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'], PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  function eanCheck(d12) { var s = 0; for (var i = 0; i < 12; i++) s += (+d12[i]) * (i % 2 ? 3 : 1); return (10 - s % 10) % 10; }
  function ean13(digits) {
    digits = String(digits).replace(/\D/g, ''); if (digits.length === 12) digits += eanCheck(digits); if (digits.length !== 13 || +digits[12] !== eanCheck(digits)) return null;
    var p = PAR[+digits[0]], bits = '101', i, d;
    for (i = 1; i <= 6; i++) { d = +digits[i]; bits += p[i - 1] === 'G' ? L[d].split('').map(function (b) { return b === '1' ? '0' : '1'; }).reverse().join('') : L[d]; }
    bits += '01010';
    for (i = 7; i <= 12; i++) bits += L[+digits[i]].split('').map(function (b) { return b === '1' ? '0' : '1'; }).join('');
    bits += '101';
    var bars = [], x = 0, run = 0;
    for (i = 0; i <= bits.length; i++) { if (bits[i] === '1') { run++; } else { if (run) { bars.push([i - run, run]); run = 0; } } }
    return { bars: bars, width: bits.length, digits: digits };
  }
  function svg(b, text, h, kind) {
    var q = 10, w = b.width + q * 2, tall = kind === 'ean' ? h + 4 : h, out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + (h + 14) + '" style="width:100%;height:auto;display:block" role="img" aria-label="Barcode ' + esc(text) + '"><rect width="' + w + '" height="' + (h + 14) + '" fill="#fff"/>';
    b.bars.forEach(function (r, i) { var guard = kind === 'ean' && (r[0] < 3 || (r[0] >= 45 && r[0] < 50) || r[0] >= b.width - 3); out += '<rect x="' + (q + r[0]) + '" y="0" width="' + r[1] + '" height="' + (guard ? tall : h) + '" fill="#000"/>'; });
    if (kind === 'ean') { var d = b.digits; out += '<text x="' + (q - 3) + '" y="' + (h + 11) + '" font-size="10" font-family="monospace" text-anchor="end">' + d[0] + '</text><text x="' + (q + 3 + 21) + '" y="' + (h + 11) + '" font-size="10" font-family="monospace" text-anchor="middle" textLength="39">' + d.slice(1, 7) + '</text><text x="' + (q + 50 + 21) + '" y="' + (h + 11) + '" font-size="10" font-family="monospace" text-anchor="middle" textLength="39">' + d.slice(7) + '</text>'; }
    else out += '<text x="' + (w / 2) + '" y="' + (h + 11) + '" font-size="10" font-family="monospace" text-anchor="middle">' + esc(text) + '</text>';
    return out + '</svg>';
  }
  function barcodeSvg(text, type, h) { if (type === 'ean') { var e = ean13(text); return e ? svg(e, e.digits, h, 'ean') : null; } var c = code128(text); return c ? svg(c, text, h, 'c128') : null; }
  window.PRINTX = { code128: code128, ean13: ean13, eanCheck: eanCheck, C128: C128 };

  // ---- labels ----
  wire('lb-form', function () {
    var rows = B.s('lb-rows').split('\n').map(function (l) { var p = l.split(',').map(function (x) { return x.trim(); }); return { n: p[0] || '', p: p[1] || '', c: p[2] || '' }; }).filter(function (r) { return r.n || r.c; }), cur = B.s('lb-cur'), type = B.s('lb-type'), bt = B.s('lb-bt'), cols = +B.s('lb-sheet'), shop = B.s('lb-shop').trim(), bad = [];
    var cell = rows.map(function (r) {
      var code = r.c || r.n, bc = '', price = parseFloat(r.p);
      if (type !== 'shelf') { bc = barcodeSvg(code, bt, 38); if (!bc) { bad.push(code); bc = '<div style="color:#b00;font-size:11px">Cannot make a barcode for "' + esc(code) + '"' + (bt === 'ean' ? ' (EAN-13 needs 12 or 13 digits with a correct last digit)' : '') + '</div>'; } }
      if (type === 'bar') return '<div class="lb">' + bc + '</div>';
      if (type === 'shelf') return '<div class="lb"><div style="font-weight:700;font-size:1.1em">' + esc(r.n) + '</div>' + (isFinite(price) ? '<div style="font-size:2.2em;font-weight:800;line-height:1.1">' + esc(money(price, cur)) + '</div>' : '') + (shop ? '<div style="font-size:.7em">' + esc(shop) + '</div>' : '') + '</div>';
      return '<div class="lb">' + (shop ? '<div style="font-size:.65em">' + esc(shop) + '</div>' : '') + '<div style="font-weight:700;font-size:.9em;line-height:1.15">' + esc(r.n) + '</div>' + (isFinite(price) ? '<div style="font-size:1.35em;font-weight:800">' + esc(money(price, cur)) + '</div>' : '') + bc + '</div>';
    });
    var h = '<style>.lbs{display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:3mm}.lb{border:1px dashed #888;padding:2mm;text-align:center;overflow:hidden;color:#000;background:#fff;font:12px/1.2 system-ui,sans-serif;break-inside:avoid;min-height:' + (cols === 3 ? 30 : cols === 4 ? 24 : 19) + 'mm}</style><div class="lbs">' + cell.join('') + '</div>';
    $('#lb-out').innerHTML = (bad.length ? '<p class="bz-warn">' + bad.length + ' code(s) could not be turned into a barcode. Fix them before you print.</p>' : '') + '<div class="bz-sheet" style="max-height:520px;overflow:auto">' + h + '</div><p>' + rows.length + ' label' + (rows.length === 1 ? '' : 's') + '. Print one page first and test-scan a few before you print a full sheet.</p>';
    $('#lb-out').setAttribute('data-html', h);
  });
  var lp = document.getElementById('lb-print'); if (lp) lp.addEventListener('click', function () { B.printHtml('<div style="background:#fff;padding:6mm">' + $('#lb-out').getAttribute('data-html') + '</div>'); });
  var bg = document.getElementById('bg-form');
  if (bg) wire('bg-form', function () {
    var t = B.s('bg-text').trim(), type = B.s('bg-type'), h = barcodeSvg(t, type, 70), out = $('#bg-out');
    if (!t) { out.innerHTML = ''; return; }
    if (type === 'ean' && !h) { var d = t.replace(/\D/g, ''); out.innerHTML = '<div class="bz-warn">' + (d.length === 12 ? '' : 'EAN-13 needs 12 digits (the check digit is added) or 13 digits with a correct last digit.') + (d.length === 13 ? ' The last digit should be ' + eanCheck(d.slice(0, 12)) + '.' : '') + '</div>'; return; }
    if (!h) { out.innerHTML = '<div class="bz-warn">Code 128 here takes letters, digits and common symbols only, no accents.</div>'; return; }
    var ck = type === 'ean' ? ean13(t).digits : t;
    out.innerHTML = '<div class="result"><h2>Your barcode</h2><div style="max-width:420px;background:#fff;padding:6px">' + h + '</div>' + (type === 'ean' ? '<p>Full number with check digit: <b>' + ck + '</b></p>' : '') + '<div class="acts"><button class="btn sm" type="button" id="bg-dl">Download as SVG</button></div></div>';
    $('#bg-dl').onclick = function () { B.download('barcode-' + ck + '.svg', h, 'image/svg+xml'); };
  });

  // ---- ID cards ----
  var logo = '';
  var lf = document.getElementById('id-logo'); if (lf) lf.addEventListener('change', function () { var f = lf.files[0]; if (!f) { logo = ''; return; } var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 200 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); logo = c.toDataURL('image/png'); document.getElementById('id-form').dispatchEvent(new Event('input')); }; im.src = r.result; }; r.readAsDataURL(f); });
  wire('id-form', function () {
    var org = B.s('id-org'), sub = B.s('id-sub'), col = B.s('id-col'), valid = B.s('id-valid'), back = B.s('id-back');
    var rows = B.s('id-rows').split('\n').map(function (l) { return l.split(',').map(function (x) { return x.trim(); }); }).filter(function (r) { return r[0]; }).slice(0, 200);
    var card = function (r) { return '<div class="idc" style="width:86mm;height:54mm;border:1px solid #555;border-radius:3mm;overflow:hidden;display:inline-block;margin:1.5mm;vertical-align:top;font:12px/1.25 system-ui,sans-serif;color:#000;background:#fff;break-inside:avoid"><div style="background:' + col + ';color:#fff;padding:2mm 3mm;display:flex;gap:2mm;align-items:center;min-height:12mm">' + (logo ? '<img src="' + logo + '" alt="" style="height:9mm;background:#fff;border-radius:1mm;padding:.5mm">' : '') + '<div><b style="font-size:13px">' + esc(org) + '</b><div style="font-size:9px">' + esc(sub) + '</div></div></div><div style="display:flex;gap:3mm;padding:3mm"><div style="width:20mm;height:25mm;border:1px solid #999;font-size:8px;color:#777;display:flex;align-items:center;justify-content:center;text-align:center">Photo</div><div><div style="font-size:15px;font-weight:700">' + esc(r[0]) + '</div><div>' + esc(r[1] || '') + '</div><div style="font-size:11px">ID: ' + esc(r[2] || '') + '</div><div style="font-size:11px">' + esc(r[3] || '') + '</div></div></div><div style="padding:0 3mm;font-size:9px">' + esc(valid) + '</div><div style="padding:1mm 3mm;font-size:8px;color:#444">' + esc(back) + '</div></div>'; };
    var h = rows.map(card).join('');
    $('#id-out').innerHTML = '<div class="bz-sheet" style="max-height:480px;overflow:auto">' + h + '</div><p>' + rows.length + ' card' + (rows.length === 1 ? '' : 's') + ', each 86 mm by 54 mm (the usual card size). Ten fit on an A4 page.</p>'; $('#id-out').setAttribute('data-html', h);
  });
  var ip = document.getElementById('id-print'); if (ip) ip.addEventListener('click', function () { B.printHtml('<div style="background:#fff;padding:6mm">' + $('#id-out').getAttribute('data-html') + '</div>'); });

  // ---- poster ----
  var cv = document.getElementById('po-canvas');
  if (cv) {
    var PAL = { sun: ['#ff9f1c', '#ffbf69', '#2b2d42', '#ffffff'], green: ['#1b7f4b', '#52b788', '#08301c', '#ffffff'], blue: ['#1d4ed8', '#60a5fa', '#0b1b4d', '#ffffff'], red: ['#c1121f', '#ff758f', '#3a0a0f', '#ffffff'], purple: ['#6d28d9', '#c084fc', '#2e1065', '#ffffff'], dark: ['#111827', '#374151', '#fbbf24', '#ffffff'] };
    var SZ = { sq: [1080, 1080], story: [1080, 1920], a4: [1240, 1754] };
    var wrap = function (ctx, t, w) { var words = String(t).split(/\s+/), lines = [], cur = ''; words.forEach(function (x) { var tt = cur ? cur + ' ' + x : x; if (ctx.measureText(tt).width > w && cur) { lines.push(cur); cur = x; } else cur = tt; }); if (cur) lines.push(cur); return lines; };
    var fit = function (ctx, t, w, maxH, start, weight) { var s = start; for (; s > 24; s -= 4) { ctx.font = weight + ' ' + s + 'px system-ui,Segoe UI,Arial,sans-serif'; if (wrap(ctx, t, w).length * s * 1.15 <= maxH) break; } return s; };
    wire('po-form', function () {
      var sz = SZ[B.s('po-size')], P = PAL[B.s('po-pal')], W = sz[0], H = sz[1], ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
      var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, P[0]); g.addColorStop(1, P[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = .12; ctx.fillStyle = '#fff'; for (var i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(W * (0.1 + i * 0.15), H * (i % 2 ? 0.12 : 0.9), W * 0.16, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
      var pad = W * 0.08, y = H * 0.07; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; var cx = W / 2;
      var line = function (t, size, weight, color, maxW, maxH) { if (!t) return; var s = fit(ctx, t, maxW, maxH, size, weight); ctx.font = weight + ' ' + s + 'px system-ui,Segoe UI,Arial,sans-serif'; ctx.fillStyle = color; wrap(ctx, t, maxW).forEach(function (l) { ctx.fillText(l, cx, y); y += s * 1.15; }); y += s * 0.25; };
      line(B.s('po-shop').toUpperCase(), W * 0.045, '700', P[3], W - pad * 2, H * 0.08);
      y += H * 0.03; line(B.s('po-head'), W * 0.11, '800', P[3], W - pad * 2, H * 0.28);
      var off = B.s('po-offer');
      if (off) { y += H * 0.02; var r = Math.min(W * 0.27, H * 0.17), cy = y + r; ctx.fillStyle = P[2]; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; var s2 = fit(ctx, off, r * 1.5, r * 1.2, r * 0.7, '800'); ctx.font = '800 ' + s2 + 'px system-ui,Segoe UI,Arial,sans-serif'; ctx.textBaseline = 'middle'; var ls = wrap(ctx, off, r * 1.5), t0 = cy - ls.length * s2 * 1.1 / 2 + s2 * 0.55; ls.forEach(function (l, k) { ctx.fillText(l, cx, t0 + k * s2 * 1.1); }); ctx.textBaseline = 'top'; y = cy + r + H * 0.03; }
      line(B.s('po-det'), W * 0.05, '600', P[3], W - pad * 2, H * 0.2);
      ctx.fillStyle = P[2]; ctx.fillRect(0, H - H * 0.12, W, H * 0.12); y = H - H * 0.12 + H * 0.025; line(B.s('po-contact'), W * 0.05, '700', '#fff', W - pad * 2, H * 0.08);
    });
    var pd = document.getElementById('po-dl'); if (pd) pd.addEventListener('click', function () { cv.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'poster.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }); });
    var pp = document.getElementById('po-print'); if (pp) pp.addEventListener('click', function () { B.printHtml('<div style="background:#fff;text-align:center"><img src="' + cv.toDataURL('image/png') + '" alt="Poster" style="max-width:100%;max-height:270mm"></div>'); });
  }

  // ---- visiting card ----
  function vcf(c) { var e = function (s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }; return 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:' + e(c.n) + '\r\nORG:' + e(c.b) + '\r\nTITLE:' + e(c.r) + '\r\n' + (c.p ? 'TEL;TYPE=CELL:' + e(c.p) + '\r\n' : '') + (c.e ? 'EMAIL:' + e(c.e) + '\r\n' : '') + (c.w ? 'URL:' + e(c.w) + '\r\n' : '') + (c.a ? 'ADR;TYPE=WORK:;;' + e(c.a) + ';;;;\r\n' : '') + 'END:VCARD\r\n'; }
  function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  var vf = document.getElementById('vc-form');
  if (vf) wire('vc-form', function () {
    var c = { n: B.s('vc-n').trim(), r: B.s('vc-r').trim(), b: B.s('vc-b').trim(), p: B.s('vc-p').replace(/[^\d+]/g, ''), e: B.s('vc-e').trim(), w: safeUrl(B.s('vc-w')), a: B.s('vc-a').trim(), t: B.s('vc-t').trim() };
    var card = '<div style="width:86mm;height:54mm;border:1px solid #555;border-radius:3mm;padding:4mm;box-sizing:border-box;font:12px/1.35 system-ui,sans-serif;color:#000;background:#fff;display:inline-block;margin:1.5mm;vertical-align:top;overflow:hidden;break-inside:avoid"><div style="font-size:16px;font-weight:800">' + esc(c.n) + '</div><div>' + esc(c.r) + '</div><div style="font-weight:700;margin:1mm 0 2mm">' + esc(c.b) + '</div><div style="font-size:11px">' + (c.p ? esc(c.p) + '<br>' : '') + (c.e ? esc(c.e) + '<br>' : '') + (c.w ? esc(c.w.replace(/^https?:\/\//, '')) + '<br>' : '') + esc(c.a) + '</div></div>';
    var link = location.origin + '/printkit/v/#' + enc({ n: c.n, r: c.r, b: c.b, p: c.p, e: c.e, w: c.w, a: c.a, t: c.t });
    $('#vc-out').innerHTML = '<div class="result"><h2>Your card</h2><div class="bz-sheet">' + card + '</div><div class="acts"><button class="btn" type="button" id="vc-print">Print 10 cards on A4</button><button class="btn ghost" type="button" id="vc-vcf">Download contact file (.vcf)</button></div>' +
      '<h3>Digital card link</h3><p>Customers open it on their phone and tap to call, message on WhatsApp, email, find the place or save your contact. Link length ' + link.length + ' characters.</p><input type="text" readonly value="' + esc(link) + '" aria-label="Card link" style="width:100%;min-height:46px;padding:8px;font:inherit"><div class="acts"><button class="btn sm" type="button" data-copy="' + esc(link) + '">Copy the link</button><a class="btn sm ghost" target="_blank" rel="noopener" href="' + esc(link) + '">Open and test it</a></div></div>';
    $('#vc-print').onclick = function () { var s = ''; for (var i = 0; i < 10; i++) s += card; B.printHtml('<div style="background:#fff;padding:6mm">' + s + '</div>'); };
    $('#vc-vcf').onclick = function () { B.download((c.n || 'contact') + '.vcf', vcf(c), 'text/vcard'); };
  });
  var vv = document.getElementById('vc-view');
  if (vv) {
    var c = null; try { c = dec(location.hash.slice(1)); } catch (e) { c = null; }
    if (!c || !c.n) vv.innerHTML = '<div class="bz-warn"><h2>This card link is not complete</h2><p>Ask for the link again, or make your own card on the <a href="/printkit/visiting-card/">visiting card maker</a>.</p></div>';
    else {
      var h1 = document.getElementById('vc-h1'); if (h1) h1.textContent = c.n; document.title = c.n + ' - visiting card';
      var ph = String(c.p || '').replace(/[^\d+]/g, ''), wa = ph.replace(/\D/g, ''), url = safeUrl(c.w);
      vv.innerHTML = '<p style="font-size:1.1rem"><b>' + esc(c.r || '') + '</b><br>' + esc(c.b || '') + '</p>' + (c.t ? '<p>' + esc(c.t) + '</p>' : '') + '<div class="acts" style="flex-direction:column;align-items:stretch">' + (ph ? '<a class="btn" href="tel:' + esc(ph) + '">Call ' + esc(ph) + '</a><a class="btn" target="_blank" rel="noopener" href="' + esc(B.wa(wa.length <= 10 ? '91' + wa : wa, 'Hello ' + (c.n || ''))) + '">WhatsApp</a>' : '') + (c.e ? '<a class="btn ghost" href="mailto:' + esc(c.e) + '">Email</a>' : '') + (url ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(url) + '">Website</a>' : '') + (c.a ? '<a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.a) + '">Find us on the map</a><p>' + esc(c.a) + '</p>' : '') + '<button class="btn ghost" type="button" id="vc-save">Save contact</button></div>';
      document.getElementById('vc-save').onclick = function () { B.download((c.n || 'contact') + '.vcf', vcf(c), 'text/vcard'); };
    }
  }

  // ---- flex banner calculator ----
  wire('bn-form', function () {
    var U = { ft: 12, in: 1, m: 39.3701, cm: 0.393701 }, u = B.s('bn-u'), k = U[u], wi = B.v('bn-w') * k, hi = B.v('bn-h') * k, n = Math.max(1, B.v('bn-n')), rate = B.v('bn-rate'), sp = B.v('bn-sp') || 1, dpi = B.v('bn-dpi') || 72, res = $('#bn-out');
    if (wi <= 0 || hi <= 0) { res.innerHTML = '<p class="note">Type the width and the height.</p>'; return; }
    var sqft = wi * hi / 144, cost = sqft * rate * n, per = 2 * (wi + hi) / 12, eye = Math.ceil(per / sp) + 0, px = Math.round(wi * dpi) + ' x ' + Math.round(hi * dpi), dist = Math.round(hi / 4);
    var ft = function (x) { return (Math.round(x / 12 * 100) / 100) + ' ft'; };
    res.innerHTML = '<div class="result"><h2>' + (Math.round(sqft * 100) / 100) + ' square feet each</h2><div class="tbl"><table><tbody><tr><td>Size</td><td class="bz-n">' + ft(wi) + ' x ' + ft(hi) + ' (' + Math.round(wi) + ' x ' + Math.round(hi) + ' inches)</td></tr><tr><td>Area of one banner</td><td class="bz-n">' + (Math.round(sqft * 100) / 100) + ' sq ft</td></tr><tr><td>Area of ' + n + '</td><td class="bz-n">' + (Math.round(sqft * n * 100) / 100) + ' sq ft</td></tr><tr class="bz-total"><td>Printing cost at your rate</td><td class="bz-n">' + (rate ? money(cost, 'INR') : 'type a rate') + '</td></tr><tr><td>Around the edge</td><td class="bz-n">' + ft(per * 12) + '</td></tr><tr><td>Eyelets about every ' + sp + ' ft (each banner)</td><td class="bz-n">' + eye + '</td></tr><tr><td>Design file size at ' + dpi + ' pixels per inch</td><td class="bz-n">' + px + ' pixels</td></tr><tr><td>Rule of thumb: main letters about 1 inch tall for every 10 ft of reading distance</td><td class="bz-n">' + (Math.round(hi / 12 * 10) + ' ft away') + ' for the full height</td></tr></tbody></table></div><p>Add the rate your printer quotes. Printers may charge a minimum size, a hem or eyelet fee, or tax, which are not included here.</p></div>';
  });

  // ---- presets from a template page (#t=key) ----
  var pm = /^#t=(\w+)/.exec(location.hash), PS = window.PK_PRESETS;
  if (pm && PS && PS[pm[1]]) {
    var pr = PS[pm[1]], first = null;
    Object.keys(pr).forEach(function (id) { var el = document.getElementById(id); if (el) { el.value = pr[id]; first = first || el; } });
    if (first && first.form) first.form.dispatchEvent(new Event('input', { bubbles: true }));
  }
})();
