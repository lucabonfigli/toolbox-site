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

/* --- the record: pick a kind of tool, see where it sits and what it is --- */
(function () {
  var rec = document.querySelector('[data-record]');
  if (!rec) return;
  var TOOLS = {
    create:  'Configure & quote · Configure with AI · Specification document · Final quote · Email teaser · QR card · Listing sheet',
    analyse: 'Build audit · Ask the ERP · Lead research · Parts report · Labour report · Marketing report',
    operate: 'Job card · Pick list · Parts list · Handover · Commercial invoice'
  };
  var buttons = rec.querySelectorAll('.ctl button'), out = rec.querySelector('.out');
  function pick(kind){
    buttons.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.kind === kind)); });
    rec.querySelectorAll('.st').forEach(function(st){ st.classList.toggle('on', st.dataset.kind === kind); });
    out.textContent = TOOLS[kind];
  }
  buttons.forEach(function(b){ b.addEventListener('click', function(){ pick(b.dataset.kind); }); });
  pick('create');
})();
