/* --- the b of a wordmark, its hole filled red ---------------------------
   The b is redrawn on a canvas so its hole can be found exactly: every empty
   pixel the outside cannot reach. Without the font or a canvas it stays a b. */
(function () {
  var bs = document.querySelectorAll('[data-hole]');
  if (!bs.length) return;

  function fill(b){
    var cs = getComputedStyle(b), dpr = Math.max(2, window.devicePixelRatio || 1);
    var font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var probe = document.createElement('canvas').getContext('2d');
    probe.font = font;
    var m = probe.measureText('b');
    var asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    var w = Math.ceil(m.width), h = Math.ceil(asc + desc);
    var W = Math.ceil(w * dpr), H = Math.ceil(h * dpr);

    var c1 = document.createElement('canvas'); c1.width = W; c1.height = H;
    var x1 = c1.getContext('2d'); x1.scale(dpr, dpr); x1.font = font; x1.fillText('b', 0, asc);
    var a = x1.getImageData(0, 0, W, H).data;
    var empty = new Uint8Array(W * H), outside = new Uint8Array(W * H), stack = [];
    for (var i = 0; i < W * H; i++) empty[i] = a[i * 4 + 3] < 128 ? 1 : 0;
    function seed(i){ if (empty[i] && !outside[i]) { outside[i] = 1; stack.push(i); } }
    for (var x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (var y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (stack.length) {
      var j = stack.pop(), jx = j % W;
      if (jx > 0) seed(j - 1); if (jx < W - 1) seed(j + 1);
      if (j >= W) seed(j - W); if (j < W * (H - 1)) seed(j + W);
    }

    var out = document.createElement('canvas'); out.width = W; out.height = H;
    out.style.width = w + 'px'; out.style.height = h + 'px';
    out.style.verticalAlign = (-desc) + 'px';
    out.style.marginRight = cs.letterSpacing === 'normal' ? '0' : cs.letterSpacing;
    var ctx = out.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
    var red = getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#e8432e';
    var rr = parseInt(red.slice(1, 3), 16), rg = parseInt(red.slice(3, 5), 16), rb = parseInt(red.slice(5, 7), 16);
    for (var k = 0; k < W * H; k++) {
      if (!empty[k] || outside[k]) continue;
      var kx = k % W, ky = (k / W) | 0;
      /* one pixel wider, so the glyph's soft edge lands on red, not paper */
      for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
        var q = (ky + oy) * W + (kx + ox);
        if (q < 0 || q >= W * H || outside[q]) continue;
        d[q * 4] = rr; d[q * 4 + 1] = rg; d[q * 4 + 2] = rb; d[q * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.scale(dpr, dpr); ctx.font = font; ctx.fillStyle = cs.color; ctx.fillText('b', 0, asc);

    out.setAttribute('aria-hidden', 'true');
    b.textContent = '';
    b.appendChild(out);
  }

  var cs = getComputedStyle(bs[0]);
  var ready = document.fonts && document.fonts.load
    ? document.fonts.load(cs.fontWeight + ' ' + cs.fontSize + ' Orbitron') : Promise.resolve();
  ready.then(function(){ bs.forEach(fill); }, function(){});
})();
