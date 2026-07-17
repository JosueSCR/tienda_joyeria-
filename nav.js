(function () {
  var ICONS = {
    search: '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    account: '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path></svg>',
    favorites: '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.5C0.3 7.8 2.4 4 6 4c2 0 3.5 1 6 3.3C14.5 5 16 4 18 4c3.6 0 5.7 3.8 4 7.5C19.5 16.4 12 21 12 21z"></path></svg>',
    cart: '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg>',
  };

  var LINKS = [
    { key: 'inicio', label: 'INICIO', href: 'index.html' },
    { key: 'pulseras', label: 'PULSERAS', href: 'Pulseras.html' },
    { key: 'collares', label: 'COLLARES', href: 'Collares.html' },
    { key: 'anillos', label: 'ANILLOS', href: 'Anillos.html' },
    { key: 'aretes', label: 'ARETES', href: 'Aretes.html' },
  ];

  function render(mount, opts) {
    opts = opts || {};
    var active = opts.active || '';
    var accountMode = opts.accountMode || 'link'; // 'link' | 'static' | 'hidden'
    var cartActive = opts.icon === 'carrito';

    var linksHtml = LINKS.map(function (l) {
      var cls = l.key === active ? ' class="active"' : '';
      return '<a href="' + l.href + '"' + cls + '>' + l.label + '</a>';
    }).join('');

    var accountHtml = '';
    if (accountMode === 'link') {
      accountHtml = '<a href="IniciarSesion.html">' + ICONS.account + '</a>';
    } else if (accountMode === 'static') {
      accountHtml = '<span class="icon-static icon-active">' + ICONS.account + '</span>';
    }

    var cartHtml = '<a href="Carrito.html"' + (cartActive ? ' class="active"' : '') + '>' + ICONS.cart + '</a>';

    mount.innerHTML =
      '<nav class="nav">' +
        '<a href="index.html" class="nav-brand">ÉCLAT</a>' +
        '<div class="nav-links">' + linksHtml + '</div>' +
        '<div class="nav-icons">' +
          '<a href="Busqueda.html">' + ICONS.search + '</a>' +
          accountHtml +
          '<a href="Favoritos.html">' + ICONS.favorites + '</a>' +
          cartHtml +
        '</div>' +
      '</nav>';

    if (window.EclatUpdateBadge) window.EclatUpdateBadge();
  }

  window.EclatNav = { render: render };
})();
