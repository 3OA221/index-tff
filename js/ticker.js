/* Announcement strip: an endless, slowly moving line of text (items come from js/announcements.js).
   The items are repeated until one set is wider than the screen, and the set is shown twice so the loop has no seam.
   Hovering the strip stops it; visitors who prefer reduced motion get it static (see CSS). */
(function () {
  var strip = document.getElementById('ticker'), track = document.getElementById('tk-track');
  var items = window.TFF_ANNOUNCEMENTS || [];
  if (!strip || !track) return;
  if (!items.length) { strip.hidden = true; return; }
  var SPEED = 55;   /* pixels per second */
  var view = track.parentNode;

  function span(lang, text) { var s = document.createElement('span'); s.setAttribute('data-l', lang); s.lang = lang; s.textContent = text; return s; }
  function makeSet(repeat, hideAll) {
    var set = document.createElement('div'); set.className = 'tk-set';
    if (hideAll) set.setAttribute('aria-hidden', 'true');
    for (var r = 0; r < repeat; r++) items.forEach(function (it) {
      var el = document.createElement('span'); el.className = 'tk-item';
      if (r > 0) el.setAttribute('aria-hidden', 'true');
      el.appendChild(span('cs', it.cs)); el.appendChild(span('en', it.en)); set.appendChild(el);
    });
    return set;
  }
  function build(repeat) {
    while (track.firstChild) track.removeChild(track.firstChild);
    track.appendChild(makeSet(repeat, false)); track.appendChild(makeSet(repeat, true));
    return track.firstChild.offsetWidth;
  }
  function layout() {
    var w = build(1);
    if (!w) return;
    var repeat = Math.max(1, Math.ceil(view.clientWidth / w));
    if (repeat > 1) w = build(repeat);
    track.style.setProperty('--tk-dur', (w / SPEED).toFixed(1) + 's');
  }

  var t;
  function later() { clearTimeout(t); t = setTimeout(layout, 120); }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('resize', later);
  document.addEventListener('tff:lang', layout);

})();
