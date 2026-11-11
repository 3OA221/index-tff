/* Logo: three words on the faces of an invisible 3D box (a cube).
   1. Each word is stretched so its ink fills its face: forma = front face, funkce = side face, text = top face.
      Metrics come from canvas text measurement, so the stretch follows the real glyph shapes. Re-fitted on resize.
   2. Small live effects, one per word (see EFFECTS at the bottom). Between effects the words are plain and fully readable.
      Effects are off for visitors who prefer reduced motion; hovering does not stop anything. */
(function () {
  var logo = document.querySelector('.logo');
  if (!logo) return;
  var wrap = logo.querySelector('.cube-wrap');
  var faces = Array.prototype.slice.call(logo.querySelectorAll('.face'));
  var ctx = document.createElement('canvas').getContext('2d');
  var SPECS = ['italic 700 100px Newsreader', '700 100px "Space Grotesk"', '700 100px "IBM Plex Mono"'];

  function wordOf(span) { return span.getAttribute('data-word') || span.textContent; }

  function ink(span) {
    var cs = getComputedStyle(span);
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' 100px ' + cs.fontFamily;
    var m = ctx.measureText(wordOf(span));
    var A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
    var base = (100 - (A + D)) / 2 + A;                       /* baseline from top of a line-height:1 box */
    return { x0: -m.actualBoundingBoxLeft, x1: m.actualBoundingBoxRight, y0: base - m.actualBoundingBoxAscent, y1: base + m.actualBoundingBoxDescent, base: base, font: ctx.font };
  }

  function fit() {
    faces.forEach(function (f) {
      var s = f.querySelector('span'), W = f.offsetWidth, H = f.offsetHeight, k = ink(s);
      var mx = W * 0.045, my = H * 0.06;                         /* small gap so neighbouring words do not touch */
      var sx = (W - 2 * mx) / (k.x1 - k.x0), sy = (H - 2 * my) / (k.y1 - k.y0);
      s.style.setProperty('--sx', sx); s.style.setProperty('--sy', sy);
      s.style.position = 'absolute'; s.style.left = '0'; s.style.top = '0';
      var tx = mx - k.x0 * sx, ty = my - k.y0 * sy;
      s.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sx + ',' + sy + ')';
      f.__fit = { sx: sx, sy: sy, tx: tx, ty: ty, base: k.base, font: k.font };      /* used by the pixelate effect */
    });
    logo.classList.add('fit');
  }

  /* ---------- effects ---------- */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parts = [], hover = false, built = false;
  function rnd(str) { return str.charAt(Math.floor(Math.random() * str.length)); }

  /* split each word into one box per letter, each as wide as the letter's real advance (kerning included),
     so swapping a letter for another never moves the others */
  function build() {
    if (built) return; built = true;
    faces.forEach(function (face) {
      var span = face.querySelector('span'), word = span.textContent.trim();
      var cs = getComputedStyle(span);
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' 100px ' + cs.fontFamily;
      span.setAttribute('data-word', word);
      face.setAttribute('aria-label', word);                      /* the letter boxes are decoration */
      span.setAttribute('aria-hidden', 'true');
      while (span.firstChild) span.removeChild(span.firstChild);
      var prev = 0, letters = [];
      for (var i = 0; i < word.length; i++) {
        var adv = ctx.measureText(word.slice(0, i + 1)).width - prev; prev += adv;
        var l = document.createElement('span'); l.className = 'l'; l.style.width = adv + 'px'; l.textContent = word.charAt(i);
        span.appendChild(l); letters.push(l);
      }
      var cv = null;
      if (face.classList.contains('f-left')) { cv = document.createElement('canvas'); cv.className = 'px'; cv.setAttribute('aria-hidden', 'true'); face.appendChild(cv); }
      parts.push({ canvas: cv, face: face, word: word, letters: letters, iv: 0, to: 0, name: face.classList.contains('f-top') ? 'top' : face.classList.contains('f-left') ? 'left' : 'right' });
    });
  }

  function reset(p) {
    clearInterval(p.iv); clearTimeout(p.to); p.iv = 0; p.to = 0;
    if (p.canvas) { p.canvas.style.visibility = 'hidden'; p.face.querySelector('span').style.visibility = ''; }
    p.letters.forEach(function (l, i) { l.textContent = p.word.charAt(i); l.style.transform = ''; l.style.animation = ''; l.style.filter = ''; });
  }

  var EFFECTS = {
    /* text: letters scramble and then decode from left to right */
    top: function (p) {
      var t0 = Date.now();
      p.iv = setInterval(function () {
        var t = Date.now() - t0, done = true;
        p.letters.forEach(function (l, i) {
          if (t >= 300 + i * 140) l.textContent = p.word.charAt(i);
          else { l.textContent = rnd('abcdefghijklmnopqrstuvwxyz'); done = false; }
        });
        if (done) { clearInterval(p.iv); p.iv = 0; }
      }, 55);
    },
    /* forma: the word breaks into coarse pixels and sharpens again */
    left: function (p) {
      var f = p.face, fit = f.__fit, cv = p.canvas, span = f.querySelector('span');
      if (!fit || !cv) return;
      var W = f.offsetWidth, H = f.offsetHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var src = document.createElement('canvas'); src.width = cv.width; src.height = cv.height;
      var sc = src.getContext('2d');
      sc.setTransform(dpr * fit.sx, 0, 0, dpr * fit.sy, dpr * fit.tx, dpr * fit.ty);
      sc.font = fit.font; sc.fillStyle = '#fff'; sc.textBaseline = 'alphabetic'; sc.fillText(p.word, 0, fit.base);
      var out = cv.getContext('2d'), small = document.createElement('canvas'), sm = small.getContext('2d');
      sm.imageSmoothingEnabled = true; sm.imageSmoothingQuality = 'high';
      var color = getComputedStyle(f).color, steps = [3, 5, 8, 12, 17, 12, 8, 5, 3], i = 0;
      function draw(ps) {
        var gw = Math.max(1, Math.round(W / ps)), gh = Math.max(1, Math.round(H / ps));
        small.width = gw; small.height = gh; sm.clearRect(0, 0, gw, gh); sm.drawImage(src, 0, 0, gw, gh);
        var d = sm.getImageData(0, 0, gw, gh).data;
        out.clearRect(0, 0, cv.width, cv.height); out.fillStyle = color;
        for (var y = 0; y < gh; y++) for (var x = 0; x < gw; x++) {
          if (d[(y * gw + x) * 4 + 3] > 100) {
            var x0 = Math.round(x * cv.width / gw), x1 = Math.round((x + 1) * cv.width / gw), y0 = Math.round(y * cv.height / gh), y1 = Math.round((y + 1) * cv.height / gh);
            out.fillRect(x0, y0, x1 - x0, y1 - y0);
          }
        }
      }
      cv.style.visibility = 'visible'; span.style.visibility = 'hidden';
      p.iv = setInterval(function () {
        if (i >= steps.length) { reset(p); return; }
        draw(steps[i++]);
      }, 80);
    },
    /* funkce: focus pull, the letters blur and sharpen again one after another */
    right: function (p) {
      var t0 = Date.now(), dur = 1000, lag = 80, n = p.letters.length;
      p.iv = setInterval(function () {
        var t = Date.now() - t0;
        if (t > dur + n * lag) { reset(p); return; }
        p.letters.forEach(function (l, i) {
          var x = (t - i * lag) / dur, b = x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0;
          l.style.filter = b > 0.03 ? 'blur(' + (b * 3.4).toFixed(2) + 'px)' : '';
        });
      }, 40);
    }
  };
  var TIMING = { top: [1200, 6500, 10500], left: [3500, 5500, 9000], right: [5800, 4500, 8000] };   /* first run, then every min..max ms */

  function schedule(p, first) {
    p.sched = setTimeout(function run() {
      if (!hover && !document.hidden) EFFECTS[p.name](p);
      var T = TIMING[p.name];
      p.sched = setTimeout(run, T[1] + Math.random() * (T[2] - T[1]));
    }, first);
  }
  function start() { parts.forEach(function (p) { clearTimeout(p.sched); schedule(p, TIMING[p.name][0]); }); }
  function stop() { parts.forEach(function (p) { clearTimeout(p.sched); reset(p); }); }
  function setHover(v) {
    if (!built || v === hover) return; hover = v;
    if (v) stop(); else start();
  }

  var t;
  function later() { clearTimeout(t); t = setTimeout(fit, 80); }
  var ready = document.fonts && document.fonts.load ? Promise.all(SPECS.map(function (s) { return document.fonts.load(s, 'textformafunkce'); })) : Promise.resolve();
  ready.then(function () { return document.fonts.ready; }).then(fit, fit).then(function () {
    if (reduce) return;
    build(); start();
  });
  window.addEventListener('resize', later);
})();
