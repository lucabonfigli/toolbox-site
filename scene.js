/* ===========================================================================
   THE SCENE — the point becoming the story.
   One box. On the point it is large, in one pose, over the wordmark; as the
   scene scrolls it shrinks into the centre of the diagram, the wordmark and
   slogan fall away, and the systems, the tools and the wires come in.
   Progress is the scroll itself; the page snaps to either end.
   =========================================================================== */
(function () {
  var scene = document.querySelector('[data-scene]');
  if (!scene) return;
  var stage = scene.querySelector('.stage'), box3 = scene.querySelector('[data-box]');
  var point = scene.querySelector('[data-point]'), story = scene.querySelector('[data-story]');
  var foot = point.querySelector('.hero-foot');
  var slotPoint = scene.querySelector('[data-slot="point"]'), slotStory = scene.querySelector('[data-slot="story"]');
  var bridge = scene.querySelector('[data-bridge]'), svg = bridge.querySelector('.wires');
  var kinds = bridge.querySelectorAll('.kind');
  var NS = 'http://www.w3.org/2000/svg';
  var POSE = ' rotateX(-12deg) rotateY(-26deg)';

  function clamp(v){ return Math.max(0, Math.min(1, v)); }
  function ease(t){ return t * t * (3 - 2 * t); }
  function lerp(a, b, t){ return a + (b - a) * t; }

  /* where the box sits, and how large, at either end */
  function ends(){
    var st = stage.getBoundingClientRect(), a = slotPoint.getBoundingClientRect(), b = slotStory.getBoundingClientRect();
    /* the box is authored at ~640px wide; on the point it fills its stage */
    var s0 = Math.max(0.42, Math.min(a.width / 760, a.height / 520, 1.35));
    var s1 = parseFloat(getComputedStyle(slotStory).getPropertyValue('--tbx-s')) || 0.5;
    return {
      x0: a.left - st.left + a.width / 2, y0: a.top - st.top + a.height / 2 + 70, s0: s0,
      /* centred on its own height, lid and handle included */
      x1: b.left - st.left + b.width / 2, y1: b.top - st.top + b.height / 2 + 81 * s1, s1: s1
    };
  }

  function wire(){
    if (getComputedStyle(svg).display === 'none') { svg.innerHTML = ''; return; }
    var box = bridge.getBoundingClientRect();
    var pi = box3.querySelector('.pin.in').getBoundingClientRect(), po = box3.querySelector('.pin.out').getBoundingClientRect();
    var ix = pi.left - box.left, iy = pi.top - box.top, ox = po.left - box.left, oy = po.top - box.top;
    var html = '';
    bridge.querySelectorAll('.slab').forEach(function(sl){
      var r = sl.getBoundingClientRect(), x = r.right - box.left, y = r.top - box.top + r.height / 2, mx = (x + ix) / 2;
      html += '<path d="M' + x + ' ' + y + ' C' + mx + ' ' + y + ' ' + mx + ' ' + iy + ' ' + ix + ' ' + iy + '"/>';
    });
    kinds.forEach(function(k){
      var r = k.querySelector('.dot').getBoundingClientRect();
      var x = r.left - box.left, y = r.top - box.top + r.height / 2, mx = (ox + x) / 2;
      var on = k.getAttribute('aria-pressed') === 'true' ? ' class="on"' : '';
      html += '<path' + on + ' data-kind="' + k.dataset.kind + '" d="M' + ox + ' ' + oy + ' C' + mx + ' ' + oy + ' ' + mx + ' ' + y + ' ' + x + ' ' + y + '"/>';
    });
    svg.innerHTML = html;
  }

  var ticking = false;
  function frame(){
    ticking = false;
    var p = ease(clamp((window.scrollY - scene.offsetTop) / window.innerHeight));
    var e = ends();
    var s = lerp(e.s0, e.s1, p);
    box3.style.transform = 'translate(' + lerp(e.x0, e.x1, p) + 'px,' + lerp(e.y0, e.y1, p) + 'px) scale(' + s + ')' + POSE;

    foot.style.opacity = (1 - clamp(p * 2.2)).toFixed(3);
    foot.style.transform = 'translateY(' + (p * 40) + 'px)';
    var q = clamp((p - 0.45) / 0.55);
    story.style.opacity = q.toFixed(3);
    story.style.pointerEvents = q > 0.9 ? 'auto' : 'none';
    if (q > 0) wire();
  }
  function request(){ if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', request, {passive:true});
  addEventListener('resize', request, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
  frame();

  /* pick what comes out, and its wire lights */
  function pick(kind){
    kinds.forEach(function(k){ k.setAttribute('aria-pressed', String(k.dataset.kind === kind)); });
    svg.querySelectorAll('path[data-kind]').forEach(function(p){ p.classList.toggle('on', p.dataset.kind === kind); });
  }
  kinds.forEach(function(k){ k.addEventListener('click', function(){ pick(k.dataset.kind); }); });
})();
