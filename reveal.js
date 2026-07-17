(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var seen = new WeakSet();
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }) : null;

    function bind(el) {
      if (seen.has(el)) return;
      seen.add(el);
      if (io) io.observe(el);
      else { el.style.opacity = '1'; el.style.transform = 'none'; }
    }

    function scan() {
      document.querySelectorAll('[data-reveal]').forEach(bind);
    }

    scan();

    var mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
  });
})();
