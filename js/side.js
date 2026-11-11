/* Side panel helpers (wide screens only).
   1. The language switch is black on the page and white over the footer. A white copy of it sits on top of the original
      and is clipped to the part the footer covers, so the change happens exactly at the footer edge.
   2. Portfolio zoom: while the works section is on screen the page gets the class "in-works" (white page, smaller logo,
      wider works). It has a little hysteresis so it never flickers while the layout moves. All motion is CSS (see --p). */
(function () {
  var root = document.documentElement;
  var side = document.querySelector('.side');
  var foot = document.querySelector('.site-footer');
  var works = document.getElementById('works');
  var wide = window.matchMedia('(min-width: 900px)');
  var wrap = null, ghost = null, on = false, atFoot = false, raf = 0;

  var lang = side && side.querySelector('.lang');
  if (lang) {
    wrap = document.createElement('div'); wrap.className = 'lang-wrap';
    lang.parentNode.insertBefore(wrap, lang); wrap.appendChild(lang);
    ghost = lang.cloneNode(true);
    ghost.className = 'lang lang-ghost';
    ghost.setAttribute('aria-hidden', 'true'); ghost.removeAttribute('role'); ghost.removeAttribute('aria-label');
    if ('inert' in ghost) ghost.inert = true;
    Array.prototype.forEach.call(ghost.querySelectorAll('button'), function (b) { b.tabIndex = -1; b.removeAttribute('aria-label'); });
    wrap.appendChild(ghost);
  }

  function update() {
    raf = 0;
    var vh = window.innerHeight;
    if (works) {
      var r = works.getBoundingClientRect(), want = on;
      if (!wide.matches || !r.height) want = false;
      else {
        var ft = foot ? foot.getBoundingClientRect().top : Infinity;
        if (!on) want = r.top < vh * 0.25 && ft > vh * 0.85;       /* the works have reached the top and the footer is still far */
        else want = !(r.top > vh * 0.5 || ft < vh * 0.7);          /* back near the about text, or the footer fills the screen */
      }
      if (want !== on) { on = want; root.classList.toggle('in-works', on); }
    }
    /* on a work page the logo is small and the page white; with the footer on screen it goes back to the landing look */
    if (foot) {
      var isWork = root.classList.contains('is-work'), fy = foot.getBoundingClientRect().top, wantFoot = atFoot;
      if (!isWork || !wide.matches) wantFoot = false;
      else wantFoot = atFoot ? fy < vh * 0.8 : fy < vh * 0.6;
      if (wantFoot !== atFoot) { atFoot = wantFoot; root.classList.toggle('at-foot', atFoot); }
    }
    if (ghost && foot && wide.matches) {
      var h = wrap.offsetHeight, ft = foot.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
      ghost.style.clipPath = ft <= 0 ? 'none' : ft >= h ? 'inset(100% 0 0 0)' : 'inset(' + ft.toFixed(1) + 'px 0 0 0)';
    }
  }
  function ask() { if (!raf) raf = requestAnimationFrame(update); }

  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  window.addEventListener('hashchange', ask);
  document.addEventListener('tff:lang', ask);
  update();
  window.addEventListener('load', update);
})();
