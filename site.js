/* ===========================================================================
   MOTION — the first edition's, unchanged.
   Restrained on purpose. Scroll drives the mark directly; everything else
   reveals once, on entry, and then stays put.
   =========================================================================== */
var A = window.anime || {};

/* --- the mark: fit to viewport, then rotate away as the hero leaves --- */
(function () {
  var stage = document.getElementById('tbxStage'), obj = document.getElementById('tbx');
  if (!stage || !obj) return;

  function fit(){
    /* the object is authored at ~640px wide; scale it to the stage */
    var s = Math.min(stage.clientWidth / 760, stage.clientHeight / 520, 1.35);
    document.documentElement.style.setProperty('--tbx-s', Math.max(0.42, s).toFixed(3));
  }
  fit(); addEventListener('resize', fit, {passive:true});

  var hero = document.querySelector('.hero'), ticking = false;
  function frame(){
    ticking = false;
    var h = hero.offsetHeight;
    var p = Math.min(1, Math.max(0, scrollY / h));          /* 0 at top, 1 when hero has left */
    var s = getComputedStyle(document.documentElement).getPropertyValue('--tbx-s') || 1;
    /* Rotation stops well short of 90deg, so the box stays dimensional the
       whole way out; rotateX deepens to keep three faces in view. */
    obj.style.transform =
      'translateY(' + (70 - p * 150) + 'px) scale(' + (parseFloat(s) * (1 - p * 0.18)) + ') ' +
      'rotateX(' + (-12 - p * 16) + 'deg) rotateY(' + (-26 - p * 46) + 'deg)';
    obj.style.opacity = (1 - p * 0.8).toFixed(3);
    var co = document.querySelector('[data-callouts]');
    if (co) co.style.opacity = (1 - Math.min(1, p * 2.4)).toFixed(3);
  }
  addEventListener('scroll', function(){
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, {passive:true});
  frame();
})();

/* --- reveal on entry: rules draw, labels assemble, copy rises --- */
(function () {
  var animate = A.animate, scrambleText = A.scrambleText, stagger = A.stagger;

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
    if (!el.hasAttribute('data-onscroll')) io.observe(el);
  });

  /* These sit in the first viewport, so revealing them on intersection would
     mean revealing them on load. They wait for the first real scroll. */
  var gated = [].slice.call(document.querySelectorAll('[data-onscroll]'));
  function releaseGated(){
    if (scrollY < 30) return;
    gated.forEach(function(el, i){
      setTimeout(function(){ reveal(el); }, i * 90);
    });
    removeEventListener('scroll', releaseGated);
  }
  addEventListener('scroll', releaseGated, {passive:true});

  /* the hero's callouts draw themselves once, on load */
  var svg = document.querySelector('[data-callouts]');
  if (svg && animate && A.createDrawable) {
    animate(A.createDrawable(svg.querySelectorAll('.ldr')), {
      draw:['0 0','0 1'], duration:760,
      delay: stagger ? stagger(120, {start:420}) : 420, ease:'inOut(2)'
    });
    animate(svg.querySelectorAll('.dot'), {
      opacity:[0,1], duration:220,
      delay: stagger ? stagger(120, {start:1000}) : 1000, ease:'linear'
    });
  }
})();
