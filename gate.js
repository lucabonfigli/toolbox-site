/* ===========================================================================
   THE GATE — page three.
   The knob rests in first, Submit. Pointing at a gear shifts to it through
   neutral, the way a gear lever moves.
   Submit a tool flips the panel to the form; the form is not connected yet,
   and says so rather than pretending to send.
   =========================================================================== */
(function () {
  var flip = document.querySelector('[data-flip]');
  if (!flip) return;
  var svg = flip.querySelector('.gate'), knob = svg.querySelector('.knob');
  var gears = svg.querySelectorAll('.gear');
  var front = flip.querySelector('.front'), form = flip.querySelector('[data-form]');
  var status = form.querySelector('.status');

  var NEUTRAL = 200;
  var AT = { 1:[110, 110], 2:[110, 290], 3:[320, 110], 4:[320, 290], 5:[530, 110] };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gear = 1, pos = AT[1].slice(), run = 0;

  function place(p){ knob.setAttribute('cx', p[0]); knob.setAttribute('cy', p[1]); pos = p; }

  /* through neutral: out of the slot, across, into the next */
  function shift(to){
    if (to === gear) return;
    var a = AT[gear], b = AT[to];
    var path = [pos, [a[0], NEUTRAL], [b[0], NEUTRAL], b];
    gear = to;
    gears.forEach(function(g){ g.classList.toggle('on', +g.dataset.gear === to); });
    if (reduced) { place(b); return; }
    var id = ++run, legs = [], total = 0;
    for (var i = 1; i < path.length; i++) {
      var d = Math.abs(path[i][0] - path[i-1][0]) + Math.abs(path[i][1] - path[i-1][1]);
      legs.push(d); total += d;
    }
    if (!total) { place(b); return; }
    var t0 = performance.now(), dur = 160 + total * 0.9;
    (function frame(t){
      if (id !== run) return;
      var k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2;
      var dist = e * total, i = 0;
      while (i < legs.length - 1 && dist > legs[i]) { dist -= legs[i]; i++; }
      var f = legs[i] ? Math.min(1, dist / legs[i]) : 1, p = path[i], q = path[i+1];
      place([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]);
      if (k < 1) requestAnimationFrame(frame);
    })(t0);
  }

  gears.forEach(function(g){
    var n = +g.dataset.gear;
    g.addEventListener('mouseenter', function(){ shift(n); });
    g.addEventListener('focus', function(){ shift(n); });
    g.addEventListener('click', function(){ shift(n); if (n === 1) open(); });
    g.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shift(n); if (n === 1) open(); }
    });
  });
  gears[0].classList.add('on');

  /* the flip: the hidden face is inert, so neither tab nor a reader lands in it */
  function setFace(back){
    flip.classList.toggle('on', back);
    if ('inert' in front) { front.inert = back; form.inert = !back; }
  }
  function open(){
    shift(1);
    setFace(true);
    setTimeout(function(){ var f = form.querySelector('input'); if (f) f.focus({preventScroll:true}); }, reduced ? 0 : 520);
  }
  setFace(false);
  document.querySelectorAll('[data-open]').forEach(function(b){
    b.addEventListener('click', function(e){
      if (b.tagName === 'A') { e.preventDefault(); document.getElementById('start').scrollIntoView({behavior: reduced ? 'auto' : 'smooth'}); }
      open();
    });
  });
  form.querySelector('[data-close]').addEventListener('click', function(){ setFace(false); status.textContent = ''; });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    status.textContent = 'The form is not connected yet. Nothing was sent.';
  });
})();
