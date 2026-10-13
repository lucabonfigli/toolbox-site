/* ===========================================================================
   MOTION
   The mark holds still: 3D, one pose, no rotation. It is only fitted to the
   stage. Everything else reveals once, on entry, and then stays put.
   =========================================================================== */
var A = window.anime || {};

/* --- the mark: fit to the stage, nothing more --- */
(function () {
  var stage = document.getElementById('tbxStage');
  if (!stage) return;
  function fit(){
    /* the object is authored at ~640px wide; scale it to the stage */
    var s = Math.min(stage.clientWidth / 760, stage.clientHeight / 520, 1.35);
    document.documentElement.style.setProperty('--tbx-s', Math.max(0.42, s).toFixed(3));
  }
  fit(); addEventListener('resize', fit, {passive:true});
})();

/* --- reveal on entry: rules draw, labels assemble, copy rises --- */
(function () {
  var animate = A.animate, scrambleText = A.scrambleText;

  function reveal(el){
    if (el.dataset.done) return;
    el.dataset.done = '1';

    if (el.hasAttribute('data-draw') && animate) {
      el.style.transform = 'scaleX(0)';
      animate(el, { scaleX:[0,1], duration:640, ease:'out(3)' });
      return;
    }
    if (el.hasAttribute('data-scramble') && scrambleText && animate) {
      animate(el, { innerHTML: scrambleText() });
      return;
    }
    if (el.hasAttribute('data-rise')) {
      if (!animate) { el.style.opacity = 1; return; }
      animate(el, { opacity:[0,1], translateY:[22,0], duration:620, ease:'out(3)' });
    }
  }

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
  }, { rootMargin:'0px 0px -12% 0px', threshold:0.15 });

  document.querySelectorAll('[data-draw],[data-scramble],[data-rise]').forEach(function(el){
    io.observe(el);
  });
})();

/* --- the story: pick what comes out, and its wire lights --- */
(function () {
  var bridge = document.querySelector('[data-bridge]');
  if (!bridge) return;
  var kinds = bridge.querySelectorAll('.kind');
  function pick(kind){
    kinds.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.kind === kind)); });
  }
  kinds.forEach(function(b){ b.addEventListener('click', function(){ pick(b.dataset.kind); }); });

  /* The wires converge on the box: into the middle of its left edge, and out
     of the middle of its right edge. They stop there, never cross it. */
  var box3 = bridge.querySelector('[data-box]'), svg = bridge.querySelector('.wires');
  var NS = 'http://www.w3.org/2000/svg';

  function wire(){
    if (getComputedStyle(svg).display === 'none') return;
    var box = bridge.getBoundingClientRect();
    var pi = box3.querySelector('.pin.in').getBoundingClientRect(), po = box3.querySelector('.pin.out').getBoundingClientRect();
    var ix = pi.left - box.left, iy = pi.top - box.top;
    var ox = po.left - box.left, oy = po.top - box.top;
    var paths = [];
    bridge.querySelectorAll('.slab').forEach(function(sl){
      var r = sl.getBoundingClientRect(), x = r.right - box.left, y = r.top - box.top + r.height / 2;
      var mx = (x + ix) / 2;
      paths.push({ d: 'M' + x + ' ' + y + ' C' + mx + ' ' + y + ' ' + mx + ' ' + iy + ' ' + ix + ' ' + iy });
    });
    kinds.forEach(function(k){
      var r = k.querySelector('.dot').getBoundingClientRect();
      var x = r.left - box.left, y = r.top - box.top + r.height / 2, mx = (ox + x) / 2;
      paths.push({ d: 'M' + ox + ' ' + oy + ' C' + mx + ' ' + oy + ' ' + mx + ' ' + y + ' ' + x + ' ' + y, kind: k.dataset.kind,
                   on: k.getAttribute('aria-pressed') === 'true' });
    });
    svg.innerHTML = '';
    paths.forEach(function(p){
      var el = document.createElementNS(NS, 'path');
      el.setAttribute('d', p.d);
      if (p.kind) { el.dataset.kind = p.kind; if (p.on) el.classList.add('on'); }
      svg.appendChild(el);
    });
  }

  var oldPick = pick;
  pick = function(kind){
    oldPick(kind);
    svg.querySelectorAll('path[data-kind]').forEach(function(p){ p.classList.toggle('on', p.dataset.kind === kind); });
  };
  pick('create');

  wire();
  addEventListener('resize', wire, {passive:true});
  /* the bridge rises into place; draw again once it has settled */
  setTimeout(wire, 900);
  new IntersectionObserver(function(e){ if (e[0].isIntersecting) setTimeout(wire, 700); }).observe(bridge);
})();

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
