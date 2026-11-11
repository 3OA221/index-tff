/* Works grid + dropdown filters (index page).
   A search field plus four dropdowns in one row: Name, Medium, Year, Study year. Choices combine (AND). Newest first.
   Grid / list switch at the far right. Search looks in titles, authors, descriptions (original + English), format and medium; it ignores case and diacritics.
   Filter state is kept in the URL (?q=&name=&medium=&year=&study=). Data comes from js/works.js.
   Tiles show the cover (still). Where a work has an animated preview, it plays on hover/focus
   (only on devices with hover, and not when the visitor prefers reduced motion). */
(function () {
  var W = window.TFF_WORKS || [], F = window.TFF_FACETS || {};
  var CFG = window.TFF_CONFIG || {};
  var IMG = CFG.imgBase || 'img/';
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), emptyEl = $('empty'), statusEl = $('status');
  if (!grid) return;

  var canHover = window.matchMedia && matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  var collator = new Intl.Collator('cs');
  function surname(n) { var p = n.split(' '); return p[p.length - 1] + ' ' + p[0]; }

  var names = [];
  W.forEach(function (w) { w.authors.forEach(function (a) { if (names.indexOf(a) < 0) names.push(a); }); });
  names.sort(function (a, b) { return collator.compare(a, b); });   /* alphabetical, as the names are written */
  var years = W.map(function (w) { return String(w.year); })
    .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  var studies = W.map(function (w) { return String(w.study); })
    .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });

  function same(list) { return list.map(function (x) { return { id: x, cs: x, en: x }; }); }
  var FIELDS = {
    name:   { el: $('f-name'),   label: { cs: 'Jméno',   en: 'Name' },       opts: same(names) },
    medium: { el: $('f-medium'), label: { cs: 'Médium',  en: 'Medium' },     opts: F.medium || [] },
    year:   { el: $('f-year'),   label: { cs: 'Rok',     en: 'Year' },       opts: same(years) },
    study:  { el: $('f-study'),  label: { cs: 'Ročník',  en: 'Study year' }, opts: studies.map(function (s) { return { id: s, cs: s + '. ročník', en: 'Year ' + s }; }) }
  };
  var KEYS = ['name', 'medium', 'year', 'study'];
  var state = { name: '', medium: '', year: '', study: '' };
  var qEl = $('f-q'), qBox = qEl.parentNode, query = '';
  var fx = {}, fxQ = document.querySelector('.fx[data-for="q"]');   /* the small x at the start of an active filter */
  KEYS.forEach(function (k) { fx[k] = document.querySelector('.fx[data-for="' + k + '"]'); });
  function norm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  var HAY = {};
  W.forEach(function (w) {
    var parts = [w.id, w.title.cs, w.title.en, w.authors.join(' '), w.year, w.study + '. rocnik year ' + w.study,
      w.description.original, w.description.en, w.format.cs, w.format.en];
    (w.collaborators || []).concat(w.credits || []).forEach(function (c) { parts.push(c.name); });
    w.mediums.forEach(function (m) { var l = labelOfMedium(m); parts.push(l.cs, l.en); });
    HAY[w.id] = norm(parts.join(' '));
  });
  function labelOfMedium(id) { var l = (F.medium || []).filter(function (m) { return m.id === id; })[0]; return l || { cs: id, en: id }; }
  var labelOf = {};
  KEYS.forEach(function (k) { labelOf[k] = {}; FIELDS[k].opts.forEach(function (o) { labelOf[k][o.id] = o; }); });

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function pair(parent, cs, en) {
    [['cs', cs], ['en', en]].forEach(function (p) {
      var s = document.createElement('span'); s.setAttribute('data-l', p[0]); s.lang = p[0]; s.textContent = p[1]; parent.appendChild(s);
    }); return parent;
  }


  /* ---------- custom dropdowns ----------
     The <select> elements stay in the page as the data model (hidden); what the visitor sees and uses is a button + list in the site's
     style. Keyboard: arrows, Home/End, Enter or Space to choose, Esc to close, letters jump to a matching entry. */
  var DD = {}, openK = null;
  function ddBuild(k) {
    var sel = FIELDS[k].el, wrap = sel.parentNode;
    sel.hidden = true; sel.setAttribute('aria-hidden', 'true'); sel.tabIndex = -1;
    var btn = el('button', 'dd-btn'), lab = el('span', 'dd-label'), list = el('ul', 'dd-list');
    btn.id = 'dd-btn-' + k; btn.type = 'button'; btn.setAttribute('role', 'combobox'); btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    list.id = 'dd-list-' + k; list.setAttribute('role', 'listbox'); list.hidden = true; btn.setAttribute('aria-controls', list.id);
    btn.appendChild(lab); wrap.appendChild(btn); wrap.appendChild(list);
    var d = DD[k] = { btn: btn, lab: lab, list: list, items: [], cur: -1 };
    btn.addEventListener('click', function () { openK === k ? ddClose() : ddOpen(k); });
    btn.addEventListener('blur', function () { if (openK === k) ddClose(); });
    btn.addEventListener('keydown', function (e) { ddKey(k, e); });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });     /* keep focus on the button */
    list.addEventListener('click', function (e) { var li = e.target.closest ? e.target.closest('li') : null; if (li) ddChoose(k, li.getAttribute('data-v')); });
    list.addEventListener('mouseover', function (e) { var li = e.target.closest ? e.target.closest('li') : null; if (li) ddCur(k, d.items.indexOf(li), true); });
  }
  function ddSync(k) {
    var d = DD[k], f = FIELDS[k]; if (!d) return;
    while (d.list.firstChild) d.list.removeChild(d.list.firstChild);
    d.items = [];
    Array.prototype.forEach.call(f.el.options, function (o) {
      if (o.value === '') return;
      var li = el('li', 'dd-opt'); li.id = 'dd-' + k + '-' + d.items.length; li.setAttribute('role', 'option');
      li.setAttribute('data-v', o.value); li.textContent = o.textContent; li.setAttribute('aria-selected', String(o.value === state[k]));
      d.list.appendChild(li); d.items.push(li);
    });
    d.lab.textContent = state[k] ? labelOf[k][state[k]][root.lang] : f.label[root.lang];
    d.btn.setAttribute('data-active', String(!!state[k]));
    d.btn.setAttribute('aria-label', f.label[root.lang]);
  }
  function ddOpen(k) {
    if (openK) ddClose();
    var d = DD[k]; d.list.hidden = false; d.btn.setAttribute('aria-expanded', 'true'); openK = k;
    var i = 0; d.items.forEach(function (li, j) { if (li.getAttribute('data-v') === state[k]) i = j; });
    ddCur(k, i);
  }
  function ddClose() {
    if (!openK) return;
    var d = DD[openK]; d.list.hidden = true; d.btn.setAttribute('aria-expanded', 'false'); d.btn.removeAttribute('aria-activedescendant'); openK = null;
  }
  function ddCur(k, i, noScroll) {
    var d = DD[k]; if (!d.items.length) return;
    i = Math.max(0, Math.min(d.items.length - 1, i)); d.cur = i;
    d.items.forEach(function (li, j) { li.classList.toggle('cur', j === i); });
    var li = d.items[i]; d.btn.setAttribute('aria-activedescendant', li.id);
    if (!noScroll) {
      var t = li.offsetTop, b = t + li.offsetHeight;
      if (t < d.list.scrollTop) d.list.scrollTop = t; else if (b > d.list.scrollTop + d.list.clientHeight) d.list.scrollTop = b - d.list.clientHeight;
    }
  }
  function ddChoose(k, v) { state[k] = v; FIELDS[k].el.value = v; ddClose(); render(); }
  function ddKey(k, e) {
    var d = DD[k], key = e.key, isOpen = openK === k;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      e.preventDefault(); if (!isOpen) { ddOpen(k); return; }
      ddCur(k, d.cur + (key === 'ArrowDown' ? 1 : -1));
    } else if (key === 'Home' && isOpen) { e.preventDefault(); ddCur(k, 0); }
    else if (key === 'End' && isOpen) { e.preventDefault(); ddCur(k, d.items.length - 1); }
    else if (key === 'Enter' || key === ' ') {
      e.preventDefault(); if (isOpen) ddChoose(k, d.items[d.cur].getAttribute('data-v')); else ddOpen(k);
    } else if (key === 'Escape') { if (isOpen) { e.preventDefault(); ddClose(); } }
    else if (key === 'Tab') { ddClose(); }
    else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!isOpen) ddOpen(k);
      var ch = norm(key), n = d.items.length;
      for (var s = 1; s <= n; s++) { var j = (d.cur + s) % n; if (norm(d.items[j].textContent).charAt(0) === ch) { ddCur(k, j); break; } }
    }
  }
  document.addEventListener('mousedown', function (e) { if (openK && !DD[openK].btn.parentNode.contains(e.target)) ddClose(); });
  KEYS.forEach(ddBuild);

  /* <option> cannot hold spans, so option text is rebuilt when the language changes */
  function buildOptions() {
    var lang = root.lang;
    KEYS.forEach(function (k) {
      var f = FIELDS[k], sel = f.el;
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      /* the label is a hidden placeholder: it is shown while nothing is chosen but is not a repeated choice in the list. Reset = the button at the right. */
      var all = el('option'); all.value = ''; all.textContent = f.label[lang]; all.disabled = true; all.hidden = true; sel.appendChild(all);
      (k === 'medium' ? f.opts.slice().sort(function (a, b) { return new Intl.Collator(lang).compare(a[lang], b[lang]); }) : f.opts).forEach(function (o) { var op = el('option'); op.value = o.id; op.textContent = o[lang]; sel.appendChild(op); });
      sel.value = state[k];
      sel.setAttribute('aria-label', f.label[lang]);
      fx[k].setAttribute('aria-label', (lang === 'en' ? 'Clear filter: ' : 'Zrušit filtr: ') + f.label[lang]);
      ddSync(k);
    });
    fxQ.setAttribute('aria-label', lang === 'en' ? 'Clear search' : 'Zrušit hledání');
    qEl.placeholder = lang === 'en' ? 'Search' : 'Hledat';
    qEl.setAttribute('aria-label', lang === 'en' ? 'Search projects' : 'Hledat v projektech');
  }

  function matches(w) {
    if (query) {
      var terms = norm(query).split(/\s+/).filter(Boolean), h = HAY[w.id];
      for (var i = 0; i < terms.length; i++) if (h.indexOf(terms[i]) < 0) return false;
    }
    if (state.name   && w.authors.indexOf(state.name) < 0) return false;
    if (state.medium && w.mediums.indexOf(state.medium) < 0) return false;
    if (state.year   && String(w.year) !== state.year) return false;
    if (state.study  && String(w.study) !== state.study) return false;
    return true;
  }

  function card(w) {
    var li = el('li'), a = el('a', 'work');
    a.href = CFG.workHref ? CFG.workHref(w.id) : 'work.html?id=' + w.id;
    var sq = el('div', 'sq');
    var img = el('img'); img.src = IMG + w.media.cover.thumb; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.width = w.media.cover.w; img.height = w.media.cover.h;
    sq.appendChild(img);
    a.appendChild(sq);
    if (canHover && w.media.preview) {
      var still = img.src, anim = IMG + w.media.preview, warmed = false;
      var on = function () { if (!warmed) warmed = true; img.src = anim; };
      var off = function () { img.src = still; };
      a.addEventListener('mouseenter', on); a.addEventListener('focus', on);
      a.addEventListener('mouseleave', off); a.addEventListener('blur', off);
    }
    var cap = el('span', 'cap'), t = el('span', 'cap-t stack'), meta = el('span', 'cap-m');
    pair(t, w.title.cs, w.title.en);
    var ma = el('span', 'm-a'), ms = el('span', 'm-sep'), my = el('span', 'm-y');
    ma.textContent = w.authors.join(', '); ms.textContent = ' · '; my.textContent = w.year;
    meta.appendChild(ma); meta.appendChild(ms); meta.appendChild(my);
    var mx = el('span', 'cap-x');   /* mediums, shown in the list view only */
    var ml = w.mediums.map(labelOfMedium);
    pair(mx, ml.map(function (m) { return m.cs; }).join(', '), ml.map(function (m) { return m.en; }).join(', '));
    cap.appendChild(t); cap.appendChild(meta); cap.appendChild(mx); a.appendChild(cap); li.appendChild(a);
    return li;
  }

  function render() {
    var vis = W.filter(matches).sort(function (a, b) { return (b.year - a.year) || (a.id < b.id ? -1 : 1); });   /* newest year first, then by number; Previous / Next on the work pages use the same order (js/work.js) */
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    vis.forEach(function (w) { grid.appendChild(card(w)); });
    emptyEl.hidden = vis.length > 0;
    var any = !!query || KEYS.some(function (k) { return state[k]; });
    qBox.setAttribute('data-active', String(!!query));
    KEYS.forEach(function (k) { fx[k].hidden = !state[k]; });
    fxQ.hidden = !query;
    KEYS.forEach(function (k) { ddSync(k); });
    statusEl.textContent = root.lang === 'en' ? vis.length + ' of ' + W.length + ' projects' : vis.length + ' z ' + W.length + ' projektů';
    writeUrl();
  }

  function readUrl() {
    if (CFG.urlState === false) return;
    var p = new URLSearchParams(location.search);
    KEYS.forEach(function (k) { var v = p.get(k) || ''; state[k] = labelOf[k][v] ? v : ''; });
    query = (p.get('q') || '').slice(0, 100); qEl.value = query;
  }
  function writeUrl() {
    if (CFG.urlState === false) return;
    var p = new URLSearchParams();
    KEYS.forEach(function (k) { if (state[k]) p.set(k, state[k]); });
    if (query) p.set('q', query);
    var qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {}
  }

  /* grid / list view (remembered in this browser) */
  var vBtns = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  function setView(v, save) {
    grid.classList.toggle('list', v === 'list');
    vBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === v)); });
    if (save) { try { localStorage.setItem('tff-view', v); } catch (e) {} }
  }
  vBtns.forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view'), true); }); });
  var saved = ''; try { saved = localStorage.getItem('tff-view'); } catch (e) {}
  setView(saved === 'list' ? 'list' : 'grid', false);

  KEYS.forEach(function (k) {
    FIELDS[k].el.addEventListener('change', function () { state[k] = FIELDS[k].el.value; render(); });
  });
  qEl.addEventListener('input', function () { query = qEl.value.trim(); render(); });
  KEYS.forEach(function (k) {
    fx[k].addEventListener('click', function () { state[k] = ''; FIELDS[k].el.value = ''; render(); });
  });
  fxQ.addEventListener('click', function () { query = ''; qEl.value = ''; render(); qEl.focus(); });
  $('filters').addEventListener('submit', function (e) { e.preventDefault(); });
  document.addEventListener('tff:lang', function () { ddClose(); buildOptions(); render(); });

  readUrl();
  buildOptions();
  render();
})();
