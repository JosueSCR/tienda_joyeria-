(function () {
  function cartCount() {
    try {
      var cart = JSON.parse(localStorage.getItem('eclat-cart')) || [];
      return cart.reduce(function (sum, it) { return sum + (it.qty || 0); }, 0);
    } catch (e) { return 0; }
  }

  function isLoggedIn() {
    try { return !!JSON.parse(localStorage.getItem('eclat-user')); } catch (e) { return false; }
  }

  function ensureBadge(a) {
    var badge = a.querySelector('.eclat-cart-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'eclat-cart-badge';
      badge.style.cssText = 'position:absolute; top:-8px; right:-10px; min-width:16px; height:16px; padding:0 4px; border-radius:8px; background:#C9A84C; color:#071F1A; font-size:10px; line-height:16px; text-align:center; font-family:Jost,sans-serif; font-weight:600;';
      a.style.position = a.style.position || 'relative';
      a.appendChild(badge);
    }
    return badge;
  }

  function updateBadge() {
    var links = document.querySelectorAll('a[href="Carrito.html"]');
    var count = cartCount();
    links.forEach(function (a) {
      if (count > 0) {
        var badge = ensureBadge(a);
        var text = count > 99 ? '99+' : String(count);
        if (badge.textContent !== text) badge.textContent = text;
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
      } else {
        var existing = a.querySelector('.eclat-cart-badge');
        if (existing) existing.remove();
      }
    });

    var accountLinks = document.querySelectorAll('a[href="IniciarSesion.html"]');
    var logged = isLoggedIn();
    accountLinks.forEach(function (a) {
      var dot = a.querySelector('.eclat-account-dot');
      if (logged) {
        if (!dot) {
          dot = document.createElement('span');
          dot.className = 'eclat-account-dot';
          dot.style.cssText = 'position:absolute; bottom:-2px; right:-4px; width:8px; height:8px; border-radius:50%; background:#C9A84C; border:1.5px solid #000;';
          a.style.position = a.style.position || 'relative';
          a.appendChild(dot);
        }
      } else if (dot) {
        dot.remove();
      }
    });
  }

  window.EclatUpdateBadge = updateBadge;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    updateBadge();
    window.addEventListener('storage', updateBadge);
  });
})();
