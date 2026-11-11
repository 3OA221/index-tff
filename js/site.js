/* Language switcher (cs / en). Runs in <head> so the right language is set before first paint.
   Priority: ?lang= in URL, then saved choice, then Czech. */
(function () {
  var LANGS = ['cs', 'en'];
  var root = document.documentElement;

  function initial() {
    var q = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(q) > -1) return q;
    try {
      var s = localStorage.getItem('tff-lang');
      if (LANGS.indexOf(s) > -1) return s;
    } catch (e) {}
    return 'cs';
  }

  function apply(lang) {
    root.lang = lang;
    try { localStorage.setItem('tff-lang', lang); } catch (e) {}
    var t = root.getAttribute('data-title-' + lang);
    if (t) document.title = t;
    var buttons = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-set-lang') === lang));
    }
    document.dispatchEvent(new CustomEvent('tff:lang', { detail: lang }));
  }

  root.lang = initial();

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        apply(e.currentTarget.getAttribute('data-set-lang'));
      });
    }
    apply(root.lang);
  });

  window.TFF = { apply: apply, lang: function () { return root.lang; } };
})();
