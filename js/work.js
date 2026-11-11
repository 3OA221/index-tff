/* Project page template: renders one project from js/works.js.
   Deployed version: work.html?id=NN. Preview build: called by the hash router (#work-NN). */
(function () {
  /* same order as the grid (js/filter.js): newest year first, then by number */
  var works = (window.TFF_WORKS || []).slice().sort(function (a, b) { return (b.year - a.year) || (a.id < b.id ? -1 : 1); });
  var F = window.TFF_FACETS || {};
  var CFG = window.TFF_CONFIG || {};
  var IMG = CFG.imgBase || 'img/';
  var root = document.documentElement;
  var $ = function (i) { return document.getElementById(i); };
  var LANGNAME = { cs: { cs: 'česky', en: 'Czech' }, sk: { cs: 'slovensky', en: 'Slovak' } };

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function pair(parent, cs, en) {
    [['cs', cs], ['en', en]].forEach(function (p) {
      var s = document.createElement('span'); s.setAttribute('data-l', p[0]); s.lang = p[0]; s.textContent = p[1]; parent.appendChild(s);
    }); return parent;
  }
  function row(dl, cs, en, node) {
    var dt = el('dt'); pair(dt, cs, en);
    var dd = el('dd'); dd.appendChild(node); dl.appendChild(dt); dl.appendChild(dd);
  }
  /* play button in the style of the YouTube one, in the dark grey of the theme; it only makes the preview look like a video (does nothing) */
  function playIcon() {
    var s = el('span', 'play'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 68 48" focusable="false"><rect width="68" height="48" rx="18" fill="currentColor"/><path d="M27 14v20l18-10z" fill="#fff"/></svg>';
    return s;
  }
  window.TFF_playIcon = playIcon;
  function paras(parent, text) {
    text.split('\n\n').forEach(function (block) {
      var p = el('p'), lines = block.split('\n');
      lines.forEach(function (ln, i) { if (i) p.appendChild(document.createElement('br')); p.appendChild(document.createTextNode(ln)); });
      parent.appendChild(p);
    });
  }
  function facetLabel(id) {
    var l = (F.medium || []).filter(function (m) { return m.id === id; })[0];
    return l || { cs: id, en: id };
  }
  function nameList(list) {
    var span = el('span');
    list.forEach(function (c, i) {
      if (i) span.appendChild(document.createTextNode(', '));
      span.appendChild(document.createTextNode(c.name));
      if (c.role) { var s = el('span', 'sub'); s.appendChild(document.createTextNode(' (')); pair(s, c.role.cs, c.role.en); s.appendChild(document.createTextNode(')')); span.appendChild(s); }
    });
    return span;
  }

  /* ---- lightbox ---- */
  var lb = $('lb'), lbImg = $('lb-img'), shots = [], cur = 0;
  var lbDots = $('lb-dots');
  function showShot(i) {
    if (!shots.length) return;
    cur = (i + shots.length) % shots.length;
    var s = shots[cur];
    lbImg.src = IMG + s.src; lbImg.alt = s.alt[root.lang] || '';
    $('lb-open').href = lbImg.src;
    $('lb-count').textContent = (cur + 1) + ' / ' + shots.length;
    /* position marker: a story-style bar, one segment per image, filled up to the current one; click a segment to jump */
    if (lbDots.children.length !== shots.length || lbDots.getAttribute('data-lang') !== root.lang) {
      clear(lbDots); lbDots.setAttribute('data-lang', root.lang);
      shots.forEach(function (x, n) {
        var li = el('li'), b = el('button', 'lb-dot'); b.type = 'button';
        b.setAttribute('aria-label', (root.lang === 'en' ? 'Image ' : 'Obrázek ') + (n + 1));
        b.addEventListener('click', function () { showShot(n); });
        li.appendChild(b); lbDots.appendChild(li);
      });
    }
    lbDots.hidden = shots.length < 2;
    Array.prototype.forEach.call(lbDots.children, function (li, n) {
      var d = li.firstChild;
      if (n === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      d.classList.toggle('done', n <= cur);
    });
  }
  if (lb) {
    $('lb-x').addEventListener('click', function () { lb.close(); });
    $('lb-p').addEventListener('click', function () { showShot(cur - 1); });
    $('lb-n').addEventListener('click', function () { showShot(cur + 1); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { showShot(cur - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { showShot(cur + 1); e.preventDefault(); }
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  function buildMedia(w) {
    var box = $('w-media'); clear(box);
    var m = w.media;
    function videoBlock() {
      if (m.videoEmbed && m.videoEmbed.length) {
        var wrap = el('div', 'videos');
        m.videoEmbed.forEach(function (id) {
          var v = el('div', 'videobox'), f = el('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + id; f.title = w.title.en + ' (video)';
          f.setAttribute('allow', 'encrypted-media; picture-in-picture; fullscreen'); f.setAttribute('allowfullscreen', ''); f.loading = 'lazy';
          v.appendChild(f); wrap.appendChild(v);
        });
        return wrap;
      }
      if (m.images.length) return null;   /* nothing to show until a video is embedded */
      var vb = el('figure', 'videobox');
      var poster = el('img'); poster.src = IMG + m.cover.src; poster.width = m.cover.w; poster.height = m.cover.h;
      poster.alt = ''; vb.appendChild(poster);
      vb.appendChild(playIcon());   /* looks like a video; does nothing yet */
      return vb;
    }
    if (m.hasVideo && !m.images.length) { var v0 = videoBlock(); if (v0) box.appendChild(v0); }
    shots = m.images;
    /* 1 to 4 images: each one full width, one below the other. 5 or more: a grid, wide pictures spanning the row. */
    var stack = m.images.length <= 4;
    var wides = m.images.map(function (im) { return stack || im.w / im.h > 1.3; });
    if (!stack) {   /* a single picture left alone in a row (before a wide one, or at the end) takes the full width */
      var col = 0;
      wides.forEach(function (wd, i) {
        if (wd) { if (col === 1) wides[i - 1] = true; col = 0; }
        else if (col === 0) col = 1;
        else col = 0;
      });
      if (col === 1) wides[wides.length - 1] = true;
    }
    m.images.forEach(function (im, i) {
      var isWide = wides[i];
      var fig = el('figure', 'shot' + (isWide ? ' wide' : ''));
      var b = el('button'); b.type = 'button';
      var cap = el('span', 'sr-only'); pair(cap, 'Zvětšit obrázek ' + (i + 1), 'Enlarge image ' + (i + 1)); b.appendChild(cap);
      var img = el('img'); img.loading = i < 2 ? 'eager' : 'lazy'; img.decoding = 'async';
      img.width = im.w; img.height = im.h; img.src = IMG + im.thumb;
      if (im.tw && im.tw < im.w) {
        img.srcset = IMG + im.thumb + ' ' + im.tw + 'w, ' + IMG + im.src + ' ' + im.w + 'w';
        img.sizes = isWide ? '(min-width: 1100px) 55vw, 92vw' : '(min-width: 1100px) 30vw, (min-width: 561px) 46vw, 92vw';
      }
      img.alt = im.alt[root.lang] || ''; img.setAttribute('data-alt-cs', im.alt.cs); img.setAttribute('data-alt-en', im.alt.en);
      b.appendChild(img);
      b.addEventListener('click', function () { if (lb && lb.showModal) { showShot(i); lb.showModal(); } });
      fig.appendChild(b); box.appendChild(fig);
    });
    if (m.hasVideo && m.images.length) { var v1 = videoBlock(); if (v1) box.appendChild(v1); }
  }

  /* Renders project `id` into the page. Returns false if it does not exist. */
  window.TFF_renderWork = function (id) {
    var idx = works.findIndex(function (w) { return w.id === id; });
    if (idx < 0) return false;
    var w = works[idx];
    $('w-num').textContent = w.id;
    var t = $('w-title'); clear(t); pair(t, w.title.cs, w.title.en);
    var o = $('w-orig'); clear(o);
    if (w.title.cs !== w.title.en) { var os = el('span'); os.setAttribute('data-l', 'en'); os.lang = w.description.lang; os.textContent = w.title.cs; o.appendChild(os); }
    o.hidden = (w.title.cs === w.title.en);

    var dl = $('w-meta'); clear(dl);
    var au = el('span'); au.textContent = w.authors.join(', ');
    row(dl, 'Autorství', w.authors.length > 1 ? 'Authors' : 'Author', au);
    var coll = (w.collaborators || []).concat(w.credits || []);
    if (coll.length) row(dl, 'Spolupráce', 'Collaboration', nameList(coll));
    row(dl, 'Rok', 'Year', document.createTextNode(String(w.year)));
    var st = el('span'); pair(st, w.study + '. ročník', 'Year ' + w.study); row(dl, 'Ročník', 'Study year', st);
    var md = el('span');
    w.mediums.forEach(function (mid, i) {
      if (i) md.appendChild(document.createTextNode(', '));
      var l = facetLabel(mid), s = el('span'); pair(s, l.cs, l.en); md.appendChild(s);
    });
    row(dl, 'Médium', 'Medium', md);
    var fm = el('span'); pair(fm, w.format.cs, w.format.en); row(dl, 'Formát', 'Format', fm);
    if (w.duration) row(dl, 'Stopáž', 'Duration', document.createTextNode(w.duration));

    /* description: original language on the Czech page; English draft + original on the English page */
    var d = $('w-desc'); clear(d);
    var ln = w.description.lang, ln2 = LANGNAME[ln] || LANGNAME.cs;
    var dcs = el('div'); dcs.setAttribute('data-l', 'cs'); dcs.lang = ln; paras(dcs, w.description.original); d.appendChild(dcs);
    var den = el('div'); den.setAttribute('data-l', 'en'); den.lang = 'en'; paras(den, w.description.en);
    var note = el('p', 'note'); note.textContent = 'English text: draft translation, not yet reviewed by the author.'; den.appendChild(note);
    var orig = el('div', 'orig'); orig.lang = ln;
    var lab = el('span', 'lab'); lab.lang = 'en'; lab.textContent = 'Original (' + ln2.en + ')'; orig.appendChild(lab);
    paras(orig, w.description.original); den.appendChild(orig);
    d.appendChild(den);

    var ul = $('w-socials'); clear(ul);
    (w.links || []).forEach(function (l) {
      var li = el('li'), a = el('a'); a.href = l.url; a.rel = 'noopener'; pair(a, l.label.cs, l.label.en); li.appendChild(a); ul.appendChild(li);
    });
    (w.socials || []).forEach(function (s) {
      var li = el('li'), a = el('a'); a.href = s.url; a.rel = 'noopener'; a.textContent = s.label; li.appendChild(a); ul.appendChild(li);
    });
    ul.hidden = !ul.firstChild;

    buildMedia(w);

    var href = CFG.workHref || function (x) { return 'work.html?id=' + x; };
    var p = $('w-prev'), n = $('w-next'); clear(p); clear(n); p.hidden = n.hidden = true;
    if (works[idx - 1]) { p.href = href(works[idx - 1].id); pair(p, '← Předchozí', '← Previous'); p.hidden = false; }
    if (works[idx + 1]) { n.href = href(works[idx + 1].id); pair(n, 'Další →', 'Next →'); n.hidden = false; }
    /* browser tab: "Name - Title" (the creator's own title, never translated) */
    var tabTitle = w.authors.join(', ') + ' - ' + w.title.cs;
    root.setAttribute('data-title-cs', tabTitle);
    root.setAttribute('data-title-en', tabTitle);
    document.title = root.getAttribute('data-title-' + root.lang);
    $('work').hidden = false;
    return true;
  };

  document.addEventListener('tff:lang', function (e) {
    var lang = (e && e.detail) || root.lang;
    var imgs = document.querySelectorAll('#w-media img[data-alt-cs]');
    for (var i = 0; i < imgs.length; i++) imgs[i].alt = imgs[i].getAttribute('data-alt-' + lang) || '';
    if (lb && lb.open) showShot(cur);
  });

  if ($('w-missing') && !document.getElementById('work-view')) {
    var id = new URLSearchParams(location.search).get('id');
    if (!window.TFF_renderWork(id)) $('w-missing').hidden = false;
  }
})();
