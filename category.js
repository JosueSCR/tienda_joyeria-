(function () {
  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('eclat-favorites')) || []; } catch (e) { return []; }
  }
  function saveFavorites(list) {
    localStorage.setItem('eclat-favorites', JSON.stringify(list));
  }
  function bgFor(url) {
    return url ? ('url(' + JSON.stringify(url) + ')') : '';
  }

  function init(catKey, catLabel) {
    document.title = 'ÉCLAT — ' + catLabel;
    document.getElementById('breadcrumbLabel').textContent = catLabel;
    document.getElementById('pageTitle').textContent = catLabel;

    EclatNav.render(document.getElementById('navMount'), { active: catKey, accountMode: 'link' });

    var grid = document.getElementById('productGrid');

    function toggleFavorite(id, name, price) {
      var favs = loadFavorites();
      var i = favs.findIndex(function (f) { return f.id === id; });
      if (i >= 0) favs.splice(i, 1); else favs.push({ id: id, name: name, price: price });
      saveFavorites(favs);
      render();
    }

    async function render() {
      var favorites = loadFavorites();
      var products = [];
      try {
        products = await window.EclatStore.getProducts(catKey);
      } catch (e) {
        grid.innerHTML = '<div class="empty-state">No se pudo cargar el catálogo. Verifique que el servidor esté corriendo.</div>';
        return;
      }
      grid.innerHTML = '';
      products.forEach(function (p, i) {
        var isFav = favorites.some(function (f) { return f.id === p.id; });
        var hasImg = !!(p.images && p.images.main);

        var card = document.createElement('a');
        card.href = 'Producto.html?id=' + p.id;
        card.className = 'product-card';
        card.setAttribute('data-reveal', '');
        card.style.transitionDelay = (i * 100) + 'ms';

        var photo = document.createElement('div');
        photo.className = 'product-photo';
        if (hasImg) { photo.style.backgroundImage = bgFor(p.images.main); }
        else { photo.textContent = 'product photo'; }

        if (p.offer) {
          var badge = document.createElement('span');
          badge.className = 'offer-badge';
          badge.textContent = 'OFERTA';
          photo.appendChild(badge);
        }

        var favBtn = document.createElement('button');
        favBtn.className = 'fav-toggle';
        favBtn.type = 'button';
        favBtn.style.color = isFav ? '#C9A84C' : '#F5F0E8';
        favBtn.textContent = isFav ? '♥' : '♡';
        favBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(p.id, p.name, p.price);
        });
        photo.appendChild(favBtn);

        var name = document.createElement('div');
        name.className = 'product-name';
        name.textContent = p.name;

        card.appendChild(photo);
        card.appendChild(name);

        if (p.offer) {
          var row = document.createElement('div');
          row.className = 'product-price-row';
          row.innerHTML = '<span class="product-price-offer">' + p.offerPrice + '</span><span class="product-price-strike">' + p.price + '</span>';
          card.appendChild(row);
        } else {
          var price = document.createElement('div');
          price.className = 'product-price';
          price.textContent = p.price;
          card.appendChild(price);
        }

        grid.appendChild(card);
      });
    }

    render();
  }

  window.EclatCategory = { init: init };
})();
