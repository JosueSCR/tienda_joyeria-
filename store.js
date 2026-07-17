(function () {
  var API_BASE = 'http://localhost:4000/api';

  function authHeaders(extra) {
    var headers = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    var token = localStorage.getItem('eclat-token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
  }

  async function handle(res) {
    if (res.status === 204) return null;
    var data = await res.json().catch(function () { return null; });
    if (!res.ok) {
      var err = new Error((data && data.error) || ('Error ' + res.status));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function getCategories() {
    return fetch(API_BASE + '/categories').then(handle);
  }

  function updateCategoryImage(adminKey, catId, image) {
    return fetch(API_BASE + '/categories/' + catId, {
      method: 'PUT',
      headers: authHeaders({ 'x-admin-key': adminKey }),
      body: JSON.stringify({ image: image }),
    }).then(handle);
  }

  function getSetting(key) {
    return fetch(API_BASE + '/settings/' + key).then(handle);
  }

  function updateSetting(adminKey, key, value) {
    return fetch(API_BASE + '/settings/' + key, {
      method: 'PUT',
      headers: authHeaders({ 'x-admin-key': adminKey }),
      body: JSON.stringify({ value: value }),
    }).then(handle);
  }

  function getProducts(cat, q) {
    var params = new URLSearchParams();
    if (cat) params.set('cat', cat);
    if (q) params.set('q', q);
    var qs = params.toString();
    return fetch(API_BASE + '/products' + (qs ? '?' + qs : '')).then(handle);
  }

  function getProduct(id) {
    return fetch(API_BASE + '/products/' + id).then(function (res) {
      if (res.status === 404) return null;
      return handle(res);
    });
  }

  function addProduct(adminKey, data) {
    return fetch(API_BASE + '/products', {
      method: 'POST',
      headers: authHeaders({ 'x-admin-key': adminKey }),
      body: JSON.stringify(data),
    }).then(handle);
  }

  function updateProduct(adminKey, id, data) {
    return fetch(API_BASE + '/products/' + id, {
      method: 'PUT',
      headers: authHeaders({ 'x-admin-key': adminKey }),
      body: JSON.stringify(data),
    }).then(handle);
  }

  function removeProduct(adminKey, id) {
    return fetch(API_BASE + '/products/' + id, {
      method: 'DELETE',
      headers: authHeaders({ 'x-admin-key': adminKey }),
    }).then(handle);
  }

  function register(payload) {
    return fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle).then(saveSession);
  }

  function login(payload) {
    return fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle).then(saveSession);
  }

  function saveSession(result) {
    localStorage.setItem('eclat-token', result.token);
    localStorage.setItem('eclat-user', JSON.stringify(result.user));
    return result;
  }

  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('eclat-user')); } catch (e) { return null; }
  }

  function logout() {
    localStorage.removeItem('eclat-token');
    localStorage.removeItem('eclat-user');
  }

  function placeOrder(items, shipping) {
    return fetch(API_BASE + '/orders', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ items: items, shipping: shipping }),
    }).then(handle);
  }

  window.EclatStore = {
    getCategories: getCategories,
    updateCategoryImage: updateCategoryImage,
    getSetting: getSetting,
    updateSetting: updateSetting,
    getProducts: getProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    removeProduct: removeProduct,
    register: register,
    login: login,
    logout: logout,
    getCurrentUser: getCurrentUser,
    placeOrder: placeOrder,
  };
})();
