(function () {
  'use strict';
  var S = window.LGStore;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var money = S.money;
  function when(iso) { var d = new Date(iso); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  var toastT;
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2400); }
  var ME = 'admin';
  var STATUS = { awaiting: 'Checking payment', approved: 'Paid', ready: 'Ready', completed: 'Completed', rejected: 'Rejected', refunded: 'Refunded' };
  var TYPES = { opening: 'Opening', receive: 'Received', sale: 'Sale', reserve: 'Held (awaiting payment)', release: 'Released', adjust: 'Adjustment', writeoff: 'Write-off', return: 'Customer return', count: 'Stock count' };

  /* ---------- session: prototype lock with idle timeout and attempt limit ---------- */
  var SESSION = 'lg-admin-session', IDLE = 30 * 60 * 1000, fails = 0, lockedUntil = 0;
  function sessionOk() { try { var s = JSON.parse(sessionStorage.getItem(SESSION) || 'null'); return s && s.exp > Date.now(); } catch (e) { return false; } }
  function touch() { try { sessionStorage.setItem(SESSION, JSON.stringify({ exp: Date.now() + IDLE })); } catch (e) {} }
  function lock() { try { sessionStorage.removeItem(SESSION); } catch (e) {} showLogin(); }
  ['click', 'keydown'].forEach(function (t) { document.addEventListener(t, function () { if (!$('#app').hidden) { if (!sessionOk()) lock(); else touch(); } }, true); });
  setInterval(function () { if (!$('#app').hidden && !sessionOk()) { lock(); } }, 30000);

  function showLogin() {
    $('#app').hidden = true; $('#login').hidden = false;
    var first = !S.hasAdmin();
    $('#login-title').textContent = first ? 'Set up admin access' : 'Admin sign in';
    $('#login-sub').textContent = first ? 'Choose a passcode of at least 10 characters for this prototype.' : 'Enter the admin passcode.';
    $('#pass2-f').hidden = !first; $('#login-btn').textContent = first ? 'Create passcode' : 'Sign in';
    $('#pass').setAttribute('autocomplete', first ? 'new-password' : 'current-password');
    $('#pass').value = ''; $('#pass2').value = ''; $('#pass').focus();
  }
  function loginErr(m) { var e = $('#login-err'); e.hidden = !m; e.textContent = m || ''; }
  $('#login-form').addEventListener('submit', async function (e) {
    e.preventDefault(); loginErr('');
    var p = $('#pass').value;
    if (!S.hasAdmin()) {
      if (p.length < 10) return loginErr('Use at least 10 characters.');
      if (p !== $('#pass2').value) return loginErr('The passcodes don’t match.');
      await S.setPasscode(p); touch(); start(); return;
    }
    if (Date.now() < lockedUntil) return loginErr('Too many attempts. Try again in ' + Math.ceil((lockedUntil - Date.now()) / 1000) + ' seconds.');
    if (await S.checkPasscode(p)) { fails = 0; touch(); start(); }
    else { fails++; if (fails >= 5) { lockedUntil = Date.now() + 60000; fails = 0; } loginErr('That passcode isn’t right.'); $('#pass').select(); }
  });
  $('#lock').addEventListener('click', lock);

  /* ---------- router ---------- */
  var VIEWS = { dashboard: dashboard, orders: orders, catalogue: catalogue, stock: stock, settings: settings, activity: activity };
  var orderFilter = 'awaiting', catQuery = '', ledgerFilter = { product: '', type: '' };
  function route() {
    var v = location.hash.slice(1).split('?')[0] || 'dashboard'; if (!VIEWS[v]) v = 'dashboard';
    $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    VIEWS[v]().then(function () { badge(); });
  }
  window.addEventListener('hashchange', function () { route(); $('#view').focus(); });
  async function badge() { var n = (await S.listOrders()).filter(function (o) { return o.status === 'awaiting'; }).length; var b = $('#nav-awaiting'); b.hidden = !n; b.textContent = n; }
  function start() { $('#login').hidden = true; $('#app').hidden = false; route(); }
  function view(html) { $('#view').innerHTML = html; }

  /* ---------- dashboard ---------- */
  async function dashboard() {
    var orders = await S.listOrders(), prods = await S.listProducts(), st = S.settingsSync(), tx = await S.listTransactions();
    var awaiting = orders.filter(function (o) { return o.status === 'awaiting'; });
    var paid = orders.filter(function (o) { return ['approved', 'ready', 'completed'].indexOf(o.status) > -1; });
    var low = prods.filter(function (p) { return p.active && p.stock > 0 && p.stock <= st.lowStock; }), out = prods.filter(function (p) { return p.active && p.stock <= 0; });
    var stockValue = prods.reduce(function (a, p) { return a + (p.price || 0) * Math.max(p.stock, 0); }, 0);
    view('<div class="head"><div><h1>Good to see you</h1><p class="muted">Here’s what needs attention in the LeadsGate shop.</p></div><div class="actions"><a class="btn btn-ghost" href="#catalogue">Upload catalogue</a><a class="btn btn-primary" href="#stock">Record stock</a></div></div>' +
      '<div class="kpis">' +
      '<a class="kpi go" href="#orders"><small>Payments to check</small><strong>' + awaiting.length + '</strong><span>' + money(awaiting.reduce(function (a, o) { return a + o.total; }, 0)) + ' waiting</span></a>' +
      '<a class="kpi" href="#orders"><small>Confirmed sales</small><strong>' + money(paid.reduce(function (a, o) { return a + o.total; }, 0)) + '</strong><span>' + paid.length + ' orders · demo</span></a>' +
      '<a class="kpi warn" href="#catalogue"><small>Low stock</small><strong>' + low.length + '</strong><span>at or below ' + st.lowStock + ' units</span></a>' +
      '<a class="kpi bad" href="#catalogue"><small>Out of stock</small><strong>' + out.length + '</strong><span>stock value ' + money(stockValue) + '</span></a></div>' +
      '<div class="grid2"><section class="panel"><h2>Latest orders</h2>' + orderTable(orders.slice(0, 6), true) + '</section>' +
      '<section class="panel"><h2>Needs restocking</h2>' + (low.concat(out).length ? '<div class="tbl-wrap"><table><thead><tr><th>Product</th><th class="num">On hand</th><th></th></tr></thead><tbody>' + out.concat(low).map(function (p) {
        return '<tr><td><div class="prod"><img class="thumb" src="' + esc(img(p.image)) + '" alt=""><span>' + esc(p.name) + '</span></div></td><td class="num">' + p.stock + '</td><td class="num"><button class="btn btn-ghost btn-sm" data-receive="' + p.id + '">Receive</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="empty">Everything is above the low-stock level.</p>') + '</section></div>' +
      '<section class="panel"><h2>Recent stock movements</h2>' + ledgerTable(tx.slice(0, 8), prods) + '<p><a class="link" href="#stock">See full stock history</a></p></section>');
  }
  function img(src) { return src && src.charAt(0) === '/' ? '..' + src : src; }

  /* ---------- orders ---------- */
  function orderTable(list, compact) {
    if (!list.length) return '<p class="empty">No orders yet. Place one from either design’s checkout in this browser to see it here.</p>';
    return '<div class="tbl-wrap"><table><thead><tr><th>Order</th><th>Placed</th><th>Customer</th>' + (compact ? '' : '<th>MoMo ID</th>') + '<th class="num">Total</th><th>Status</th><th></th></tr></thead><tbody>' + list.map(function (o) {
      return '<tr><td><strong>' + esc(o.id) + '</strong></td><td>' + when(o.at) + '</td><td>' + esc(o.customer.name) + '<br><small class="muted">' + esc(o.customer.phone) + '</small></td>' + (compact ? '' : '<td><code>' + esc(o.momo.txnId) + '</code></td>') + '<td class="num">' + money(o.total) + '</td><td><span class="badge b-' + o.status + '">' + STATUS[o.status] + '</span></td><td class="num"><button class="btn btn-ghost btn-sm" data-order="' + esc(o.id) + '">' + (o.status === 'awaiting' ? 'Check payment' : 'Open') + '</button></td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  async function orders() {
    var all = await S.listOrders();
    var counts = {}; all.forEach(function (o) { counts[o.status] = (counts[o.status] || 0) + 1; });
    var tabs = [['awaiting', 'To check'], ['approved', 'Paid'], ['ready', 'Ready'], ['completed', 'Completed'], ['rejected', 'Rejected'], ['all', 'All']];
    var list = orderFilter === 'all' ? all : all.filter(function (o) { return o.status === orderFilter; });
    view('<div class="head"><div><h1>Orders</h1><p class="muted">Match each MoMo screenshot with your merchant statement before approving.</p></div></div>' +
      '<div class="tabs" role="group" aria-label="Filter orders">' + tabs.map(function (t) { var n = t[0] === 'all' ? all.length : counts[t[0]] || 0; return '<button type="button" data-ofilter="' + t[0] + '" aria-pressed="' + (orderFilter === t[0]) + '">' + t[1] + ' (' + n + ')</button>'; }).join('') + '</div>' +
      '<section class="panel">' + orderTable(list) + '</section>');
  }
  async function openOrder(ref) {
    var all = await S.listOrders(), o = all.filter(function (x) { return x.id === ref; })[0]; if (!o) return;
    var dup = all.filter(function (x) { return x.id !== o.id && x.momo.txnId.toLowerCase() === o.momo.txnId.toLowerCase(); });
    var mismatch = o.momo.amountPaid && o.momo.amountPaid !== o.total;
    var next = { awaiting: [], approved: [['ready', 'Mark ready', 'btn-primary'], ['refunded', 'Refund', 'btn-bad']], ready: [['completed', 'Mark collected or delivered', 'btn-ok']] }[o.status] || [];
    dialog('<div class="dlg"><div class="dlg-head"><div><p class="muted" style="margin:0">' + when(o.at) + '</p><h2 id="dlg-title">Order ' + esc(o.id) + ' <span class="badge b-' + o.status + '">' + STATUS[o.status] + '</span></h2></div><button class="x" type="button" data-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="order-grid"><div>' +
      '<h3 class="sr-only">Items</h3><div class="tbl-wrap"><table><tbody>' + o.items.map(function (i) { return '<tr><td>' + esc(i.name) + '</td><td class="num">× ' + i.qty + '</td><td class="num">' + money(i.price * i.qty) + '</td></tr>'; }).join('') + '<tr><td><strong>Total</strong></td><td></td><td class="num"><strong>' + money(o.total) + '</strong></td></tr></tbody></table></div>' +
      '<h3 style="font-size:14px;margin:16px 0 8px">Customer</h3><dl class="kv"><dt>Name</dt><dd>' + esc(o.customer.name) + '</dd><dt>Phone</dt><dd><a href="tel:' + esc(o.customer.phone) + '">' + esc(o.customer.phone) + '</a></dd>' + (o.customer.email ? '<dt>Email</dt><dd>' + esc(o.customer.email) + '</dd>' : '') + '<dt>Getting it</dt><dd>' + (o.customer.fulfil === 'delivery' ? 'Delivery: ' + esc(o.customer.area) : 'Collect from showroom') + '</dd>' + (o.customer.note ? '<dt>Note</dt><dd>' + esc(o.customer.note) + '</dd>' : '') + '</dl>' +
      '<h3 style="font-size:14px;margin:16px 0 8px">MoMo payment</h3><dl class="kv"><dt>Network</dt><dd>' + esc(o.momo.network) + '</dd><dt>Paid from</dt><dd>' + esc(o.momo.payerNumber) + (o.momo.payerName ? ' · ' + esc(o.momo.payerName) : '') + '</dd><dt>Transaction ID</dt><dd><code>' + esc(o.momo.txnId) + '</code></dd><dt>Amount stated</dt><dd>' + money(o.momo.amountPaid || 0) + '</dd><dt>Reference</dt><dd>' + esc(o.id) + '</dd></dl>' +
      (dup.length ? '<p class="err">This transaction ID also appears on ' + dup.map(function (d) { return esc(d.id); }).join(', ') + '. Check carefully.</p>' : '') +
      (mismatch ? '<p class="err">Amount stated does not match the order total.</p>' : '') +
      '<ul class="history">' + o.history.map(function (h) { return '<li>' + when(h.at) + ' · ' + STATUS[h.status] + ' · ' + esc(h.by) + (h.note ? ': ' + esc(h.note) : '') + '</li>'; }).join('') + '</ul>' +
      '</div><div><button type="button" class="proof" id="proof-btn" aria-label="Open the payment screenshot full size"><img src="' + esc(o.proof.dataUrl) + '" alt="Customer’s MoMo payment screenshot"></button><p class="muted" style="font-size:12.5px;margin:6px 0 0">' + esc(o.proof.name) + ' · ' + Math.round(o.proof.size / 1024) + ' KB</p>' +
      (o.status === 'awaiting' ? '<div class="warnbox" style="margin-top:12px"><strong>Before you approve</strong><ol class="checklist"><li>Find the transaction ID in your MoMo merchant statement or SMS.</li><li>The amount received is exactly ' + money(o.total) + '.</li><li>The sender number matches ' + esc(o.momo.payerNumber) + '.</li><li>The money has arrived. A screenshot alone can be edited.</li></ol></div>' +
        '<div class="decision"><button class="btn btn-ok" type="button" data-set="approved">Payment received: approve</button><label class="sr-only" for="reason">Reason for rejecting</label><textarea id="reason" rows="2" placeholder="Reason if rejecting, e.g. payment not found in statement"></textarea><button class="btn btn-bad" type="button" data-set="rejected">Reject and release stock</button></div>' : '') +
      (next.length ? '<div class="decision">' + next.map(function (n) { return '<button class="btn ' + n[2] + '" type="button" data-set="' + n[0] + '">' + n[1] + '</button>'; }).join('') + '</div>' : '') +
      '<p class="err" id="order-err" hidden></p></div></div></div>');
    $('#proof-btn').addEventListener('click', function () { var w = window.open(); if (w) { w.opener = null; w.document.title = o.id + ' proof'; var im = w.document.createElement('img'); im.src = o.proof.dataUrl; im.style.maxWidth = '100%'; w.document.body.appendChild(im); } });
    $$('[data-set]', $('#dlg')).forEach(function (b) {
      b.addEventListener('click', async function () {
        var status = b.getAttribute('data-set'), note = $('#reason') ? $('#reason').value : '';
        if (status === 'refunded' && !confirm('Mark as refunded and return the items to stock? Send the MoMo refund separately.')) return;
        try { await S.setOrderStatus(o.id, status, status === 'approved' ? 'Payment matched in MoMo statement' : note, ME); $('#dlg').close(); toast('Order ' + o.id + ': ' + STATUS[status]); route(); }
        catch (err) { var e = $('#order-err'); e.hidden = false; e.textContent = err.message; }
      });
    });
  }

  /* ---------- catalogue ---------- */
  async function catalogue() {
    var prods = await S.listProducts(), st = S.settingsSync(), q = catQuery.toLowerCase();
    var list = prods.filter(function (p) { return !q || (p.name + ' ' + p.sku + ' ' + p.room).toLowerCase().indexOf(q) > -1; });
    view('<div class="head"><div><h1>Catalogue</h1><p class="muted">' + prods.length + ' products. Edit prices inline, or upload a whole catalogue from a spreadsheet.</p></div><div class="actions"><button class="btn btn-ghost" type="button" id="tpl">Download CSV template</button><button class="btn btn-ghost" type="button" id="export">Export CSV</button><button class="btn btn-ghost" type="button" id="import">Upload CSV</button><button class="btn btn-primary" type="button" data-edit="">Add product</button></div></div>' +
      '<section class="panel"><div class="toolbar"><label class="sr-only" for="cat-q">Search products</label><input type="search" id="cat-q" placeholder="Search name, SKU or room" value="' + esc(catQuery) + '"></div>' +
      '<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Room</th><th class="num">Price (₵)</th><th class="num">Stock</th><th>Shop</th><th></th></tr></thead><tbody>' + (list.length ? list.map(function (p) {
        var lvl = p.stock <= 0 ? '<span class="badge b-out">Out</span>' : p.stock <= st.lowStock ? '<span class="badge b-low">Low</span>' : '';
        return '<tr><td><div class="prod"><img class="thumb" src="' + esc(img(p.image)) + '" alt=""><span>' + esc(p.name) + '<small>' + esc(p.range) + '</small></span></div></td><td><code>' + esc(p.sku) + '</code></td><td>' + esc(p.room) + '</td>' +
          '<td class="num"><label class="sr-only" for="pr-' + p.id + '">Price for ' + esc(p.name) + '</label><input class="inline-num" id="pr-' + p.id + '" data-price="' + p.id + '" inputmode="decimal" value="' + (p.price == null ? '' : (p.price / 100).toFixed(2)) + '"></td>' +
          '<td class="num">' + p.stock + ' ' + lvl + '</td><td><label class="switch"><input type="checkbox" data-active="' + p.id + '"' + (p.active ? ' checked' : '') + '><span></span><b class="sr-only">Show ' + esc(p.name) + ' in shop</b></label></td>' +
          '<td class="num"><button class="btn btn-ghost btn-sm" data-edit="' + p.id + '">Edit</button> <button class="btn btn-ghost btn-sm" data-receive="' + p.id + '">Stock</button></td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">No products match.</td></tr>') + '</tbody></table></div></section>');
    $('#cat-q').addEventListener('input', function (e) { catQuery = e.target.value; clearTimeout(window.__cq); window.__cq = setTimeout(function () { catalogue().then(function () { var i = $('#cat-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 250); });
    $$('[data-price]').forEach(function (inp) {
      inp.addEventListener('change', async function () {
        var p = prods.filter(function (x) { return x.id === inp.getAttribute('data-price'); })[0];
        try { await S.saveProduct({ id: p.id, sku: p.sku, name: p.name, room: p.room, range: p.range, desc: p.desc, price: inp.value.trim(), active: p.active }, ME); toast('Price saved for ' + p.name); }
        catch (err) { toast(err.message); inp.value = p.price == null ? '' : (p.price / 100).toFixed(2); }
      });
    });
    $$('[data-active]').forEach(function (cb) {
      cb.addEventListener('change', async function () {
        var p = prods.filter(function (x) { return x.id === cb.getAttribute('data-active'); })[0];
        await S.saveProduct({ id: p.id, sku: p.sku, name: p.name, room: p.room, range: p.range, desc: p.desc, price: p.price == null ? '' : p.price / 100, active: cb.checked }, ME);
        toast(p.name + (cb.checked ? ' is visible in the shop' : ' is hidden from the shop'));
      });
    });
    $('#tpl').addEventListener('click', function () { download('leadsgate-catalogue-template.csv', 'sku,name,room,range,description,price,stock,image\nLG-KETTLE-01,Electric kettle 1.7L,Kitchen,Kitchen Appliances,"Cordless kettle with auto shut-off",350.00,10,\n'); });
    $('#export').addEventListener('click', async function () { download('leadsgate-catalogue-' + new Date().toISOString().slice(0, 10) + '.csv', await S.exportCSV()); });
    $('#import').addEventListener('click', importDialog);
  }
  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function editProduct(id) {
    var p = id ? (await S.listProducts()).filter(function (x) { return x.id === id; })[0] : { name: '', sku: '', room: 'Kitchen', range: 'Utensils', desc: '', price: null, active: true, image: '' };
    var opt = function (arr, v) { return arr.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + x + '</option>'; }).join(''); };
    dialog('<form class="dlg" id="pform" novalidate><div class="dlg-head"><h2 id="dlg-title">' + (id ? 'Edit product' : 'Add product') + '</h2><button class="x" type="button" data-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="row"><div class="field"><label for="f-name">Product name</label><input id="f-name" required maxlength="90" value="' + esc(p.name) + '"></div><div class="field"><label for="f-sku">SKU</label><input id="f-sku" maxlength="30" value="' + esc(p.sku) + '" placeholder="Created if left blank"></div></div>' +
      '<div class="row"><div class="field"><label for="f-room">Room</label><select id="f-room">' + opt(S.ROOMS, p.room) + '</select></div><div class="field"><label for="f-range">Range</label><select id="f-range">' + opt(S.RANGES, p.range) + '</select></div><div class="field"><label for="f-price">Price (₵)</label><input id="f-price" inputmode="decimal" value="' + (p.price == null ? '' : (p.price / 100).toFixed(2)) + '"></div>' + (id ? '' : '<div class="field"><label for="f-stock">Opening stock</label><input id="f-stock" inputmode="numeric" value="0"></div>') + '</div>' +
      '<div class="field"><label for="f-desc">Description</label><textarea id="f-desc" rows="3" maxlength="400">' + esc(p.desc) + '</textarea></div>' +
      '<div class="field"><span style="font-weight:700;font-size:13px">Photo</span><label class="drop"><input type="file" id="f-img" accept="image/png,image/jpeg,image/webp" class="sr-only"><span id="f-img-l">' + (p.image ? '<img src="' + esc(img(p.image)) + '" alt="" style="height:80px;margin:0 auto 6px;object-fit:contain">Change photo' : 'Choose a product photo (PNG, JPG or WebP, up to 5 MB)') + '</span></label></div>' +
      '<p class="err" id="p-err" hidden></p><div class="actions"><button class="btn btn-primary" type="submit">Save product</button><button class="btn btn-ghost" type="button" data-close>Cancel</button></div></form>');
    var newImg = '';
    $('#f-img').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      if (['image/png', 'image/jpeg', 'image/webp'].indexOf(f.type) < 0 || f.size > 5 * 1024 * 1024) { toast('Use a PNG, JPG or WebP under 5 MB'); return; }
      var u = URL.createObjectURL(f), im = new Image();
      im.onload = function () { var k = Math.min(1, 600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); newImg = c.toDataURL('image/jpeg', 0.8); URL.revokeObjectURL(u); $('#f-img-l').innerHTML = '<img src="' + newImg + '" alt="" style="height:80px;margin:0 auto 6px;object-fit:contain">Photo ready'; };
      im.src = u;
    });
    $('#pform').addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        await S.saveProduct({ id: id || null, name: $('#f-name').value, sku: $('#f-sku').value, room: $('#f-room').value, range: $('#f-range').value, desc: $('#f-desc').value, price: $('#f-price').value.trim(), stock: $('#f-stock') ? $('#f-stock').value : 0, image: newImg, active: p.active !== false }, ME);
        $('#dlg').close(); toast('Product saved'); route();
      } catch (err) { var x = $('#p-err'); x.hidden = false; x.textContent = err.message; }
    });
  }
  function importDialog() {
    dialog('<div class="dlg"><div class="dlg-head"><h2 id="dlg-title">Upload catalogue</h2><button class="x" type="button" data-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<p class="muted">Use a CSV from Excel or Google Sheets with the columns <code>sku, name, room, range, description, price, stock, image</code>. Rows with a SKU that already exists are updated, and their stock is set to the new count. You’ll see a preview first.</p>' +
      '<label class="drop"><input type="file" id="csv" accept=".csv,text/csv" class="sr-only"><strong>Choose a CSV file</strong><br><small>Up to 1,000 rows · 2 MB</small></label><div id="csv-out" style="margin-top:14px"></div></div>');
    $('#csv').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      if (f.size > 2 * 1024 * 1024) { $('#csv-out').innerHTML = '<p class="err">That file is over 2 MB.</p>'; return; }
      var r = new FileReader();
      r.onload = async function () {
        try {
          var prev = await S.previewImport(String(r.result).replace(/^﻿/, ''));
          var good = prev.filter(function (x) { return !x.errors.length; });
          $('#csv-out').innerHTML = '<p class="' + (good.length === prev.length ? 'ok' : 'warnbox') + '">' + good.length + ' of ' + prev.length + ' rows ready: ' + good.filter(function (x) { return !x.existing; }).length + ' new, ' + good.filter(function (x) { return x.existing; }).length + ' updates.' + (good.length < prev.length ? ' Rows with problems will be skipped.' : '') + '</p>' +
            '<div class="tbl-wrap" style="max-height:300px;overflow:auto;margin-top:10px"><table class="preview-tbl"><thead><tr><th>Line</th><th>SKU</th><th>Name</th><th>Room</th><th class="num">Price</th><th class="num">Stock</th><th>Result</th></tr></thead><tbody>' + prev.map(function (x) {
              return '<tr><td>' + x.line + '</td><td>' + esc(x.data.sku) + '</td><td>' + esc(x.data.name) + '</td><td>' + esc(x.data.room || '') + '</td><td class="num">' + esc(x.data.price) + '</td><td class="num">' + esc(x.data.stock) + '</td><td class="' + (x.errors.length ? 'bad' : '') + '">' + (x.errors.length ? esc(x.errors.join(', ')) : x.existing ? 'Update' : 'New') + '</td></tr>';
            }).join('') + '</tbody></table></div><div class="actions" style="margin-top:14px"><button class="btn btn-primary" type="button" id="apply"' + (good.length ? '' : ' disabled') + '>Import ' + good.length + ' rows</button></div>';
          $('#apply').addEventListener('click', async function () { var res = await S.applyImport(prev, ME); $('#dlg').close(); toast(res.created + ' added, ' + res.updated + ' updated'); route(); });
        } catch (err) { $('#csv-out').innerHTML = '<p class="err">' + esc(err.message) + '</p>'; }
      };
      r.readAsText(f);
    });
  }

  /* ---------- stock ---------- */
  function ledgerTable(tx, prods) {
    if (!tx.length) return '<p class="empty">No stock movements match.</p>';
    var name = {}; prods.forEach(function (p) { name[p.id] = p.name; });
    return '<div class="tbl-wrap"><table><thead><tr><th>When</th><th>Product</th><th>Type</th><th class="num">Change</th><th class="num">Balance</th><th>Reference</th><th>Note</th><th>By</th></tr></thead><tbody>' + tx.map(function (t) {
      return '<tr><td>' + when(t.at) + '</td><td>' + esc(name[t.productId] || t.productId) + '</td><td><span class="badge b-type">' + (TYPES[t.type] || t.type) + '</span></td><td class="num ' + (t.qty > 0 ? 'pos' : t.qty < 0 ? 'neg' : '') + '">' + (t.qty > 0 ? '+' : '') + t.qty + '</td><td class="num">' + t.balance + '</td><td>' + esc(t.ref) + '</td><td>' + esc(t.note) + '</td><td>' + esc(t.by) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  async function stock(pre) {
    var prods = await S.listProducts(), tx = await S.listTransactions();
    var shown = tx.filter(function (t) { return (!ledgerFilter.product || t.productId === ledgerFilter.product) && (!ledgerFilter.type || t.type === ledgerFilter.type); });
    var popt = prods.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + ' (' + p.stock + ' on hand)</option>'; }).join('');
    view('<div class="head"><div><h1>Stock</h1><p class="muted">Every change is recorded with who, when and why. Sales and held stock are recorded automatically from orders.</p></div><div class="actions"><button class="btn btn-ghost" type="button" id="ledger-csv">Export history</button></div></div>' +
      '<div class="grid2"><section class="panel"><h2>Stock history</h2><div class="toolbar"><label class="sr-only" for="lf-p">Product</label><select id="lf-p"><option value="">All products</option>' + popt + '</select><label class="sr-only" for="lf-t">Type</label><select id="lf-t"><option value="">All types</option>' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '">' + TYPES[k] + '</option>'; }).join('') + '</select></div>' + ledgerTable(shown.slice(0, 200), prods) + '</section>' +
      '<section class="panel"><h2>Record a stock movement</h2><form id="sform" novalidate><div class="field"><label for="s-p">Product</label><select id="s-p" required>' + popt + '</select></div>' +
      '<div class="field"><label for="s-t">What happened?</label><select id="s-t"><option value="receive">Received a delivery (+)</option><option value="count">Stock count (set exact number)</option><option value="adjust">Adjustment (+ or −)</option><option value="writeoff">Damaged or lost (−)</option><option value="return">Customer return (+)</option></select></div>' +
      '<div class="row"><div class="field"><label for="s-q" id="s-q-l">Quantity</label><input id="s-q" inputmode="numeric" required></div><div class="field"><label for="s-r">Reference</label><input id="s-r" maxlength="40" placeholder="Supplier invoice, etc."></div></div>' +
      '<div class="field"><label for="s-n">Note</label><input id="s-n" maxlength="200"></div><p class="err" id="s-err" hidden></p><button class="btn btn-primary btn-block" type="submit">Record movement</button></form></section></div>');
    $('#lf-p').value = ledgerFilter.product; $('#lf-t').value = ledgerFilter.type;
    $('#lf-p').addEventListener('change', function (e) { ledgerFilter.product = e.target.value; stock(); });
    $('#lf-t').addEventListener('change', function (e) { ledgerFilter.type = e.target.value; stock(); });
    if (pre) $('#s-p').value = pre;
    $('#s-t').addEventListener('change', function () { $('#s-q-l').textContent = $('#s-t').value === 'count' ? 'Counted on shelf' : $('#s-t').value === 'adjust' ? 'Change (use − to reduce)' : 'Quantity'; });
    $('#sform').addEventListener('submit', async function (e) {
      e.preventDefault();
      var q = $('#s-q').value.trim().replace('−', '-'), type = $('#s-t').value, er = $('#s-err');
      if (!/^-?\d+$/.test(q) || (type !== 'adjust' && Number(q) < 0) || (type !== 'count' && Number(q) === 0)) { er.hidden = false; er.textContent = 'Enter a whole number' + (type === 'adjust' ? '' : ' above zero') + '.'; return; }
      if ((type === 'adjust' || type === 'writeoff') && !$('#s-n').value.trim()) { er.hidden = false; er.textContent = 'Add a note explaining the adjustment.'; return; }
      try { await S.stockMove($('#s-p').value, type, Number(q), $('#s-r').value, $('#s-n').value, ME); toast('Stock updated'); stock($('#s-p').value); }
      catch (err) { er.hidden = false; er.textContent = err.message; }
    });
    $('#ledger-csv').addEventListener('click', function () {
      var name = {}; prods.forEach(function (p) { name[p.id] = p.name; });
      var c = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      download('leadsgate-stock-history.csv', ['when,product,type,change,balance,reference,note,by'].concat(shown.map(function (t) { return [t.at, name[t.productId], TYPES[t.type], t.qty, t.balance, t.ref, t.note, t.by].map(c).join(','); })).join('\n'));
    });
  }

  /* ---------- settings ---------- */
  async function settings() {
    var st = S.settingsSync();
    view('<div class="head"><div><h1>Settings</h1><p class="muted">Payment details shown to customers at checkout.</p></div></div>' +
      '<div class="grid2"><section class="panel"><h2>MoMo payment details</h2><form id="mform" novalidate>' +
      '<div class="row"><div class="field"><label for="m-num">MoMo number</label><input id="m-num" inputmode="tel" value="' + esc(st.momoNumber) + '"></div><div class="field"><label for="m-net">Network</label><select id="m-net">' + ['MTN MoMo', 'Telecel Cash', 'AT Money'].map(function (n) { return '<option' + (n === st.momoNetwork ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field"><label for="m-name">Registered account name</label><input id="m-name" maxlength="80" value="' + esc(st.momoName) + '" placeholder="Exactly as customers will see it when sending"></div>' +
      '<div class="field"><label for="m-low">Low-stock warning level</label><input id="m-low" inputmode="numeric" value="' + st.lowStock + '"></div>' +
      '<p class="err" id="m-err" hidden></p><button class="btn btn-primary" type="submit">Save settings</button></form></section>' +
      '<section class="panel"><h2>Admin passcode</h2><form id="cform" novalidate><div class="field"><label for="c-old">Current passcode</label><input id="c-old" type="password" autocomplete="current-password"></div><div class="field"><label for="c-new">New passcode (10+ characters)</label><input id="c-new" type="password" autocomplete="new-password"></div><p class="err" id="c-err" hidden></p><button class="btn btn-ghost" type="submit">Change passcode</button></form>' +
      '<h2 style="margin-top:22px">Demo data</h2><p class="muted">Clears demo orders, stock history and products in this browser and starts again.</p><button class="btn btn-bad" type="button" id="reset">Reset demo data</button></section></div>');
    $('#mform').addEventListener('submit', async function (e) {
      e.preventDefault();
      try { await S.saveSettings({ momoNumber: $('#m-num').value, momoName: $('#m-name').value, momoNetwork: $('#m-net').value, lowStock: $('#m-low').value }, ME); toast('Settings saved'); settings(); }
      catch (err) { var x = $('#m-err'); x.hidden = false; x.textContent = err.message; }
    });
    $('#cform').addEventListener('submit', async function (e) {
      e.preventDefault(); var x = $('#c-err');
      if (!(await S.checkPasscode($('#c-old').value))) { x.hidden = false; x.textContent = 'Current passcode isn’t right.'; return; }
      try { await S.setPasscode($('#c-new').value); toast('Passcode changed'); settings(); } catch (err) { x.hidden = false; x.textContent = err.message; }
    });
    $('#reset').addEventListener('click', async function () { if (!confirm('Reset all demo data in this browser? This removes demo orders and the admin passcode.')) return; await S.reset(); lock(); });
  }

  /* ---------- activity ---------- */
  async function activity() {
    var a = await S.listAudit();
    view('<div class="head"><div><h1>Activity log</h1><p class="muted">Every admin change, newest first.</p></div></div><section class="panel">' + (a.length ? '<div class="tbl-wrap"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>' + a.map(function (x) { return '<tr><td>' + when(x.at) + '</td><td>' + esc(x.who) + '</td><td><code>' + esc(x.action) + '</code></td><td>' + esc(x.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="empty">Nothing yet.</p>') + '</section>');
  }

  /* ---------- dialog + delegated clicks ---------- */
  function dialog(html) { $('#dlg-body').innerHTML = html; var d = $('#dlg'); if (!d.open) d.showModal(); var f = d.querySelector('input, select, textarea, button:not(.x)'); if (f) f.focus(); }
  $('#dlg').addEventListener('click', function (e) { if (e.target === $('#dlg') || e.target.closest('[data-close]')) $('#dlg').close(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-order],[data-ofilter],[data-edit],[data-receive]'); if (!t) return;
    if (t.hasAttribute('data-order')) openOrder(t.getAttribute('data-order'));
    else if (t.hasAttribute('data-ofilter')) { orderFilter = t.getAttribute('data-ofilter'); orders(); }
    else if (t.hasAttribute('data-edit')) editProduct(t.getAttribute('data-edit'));
    else if (t.hasAttribute('data-receive')) { var id = t.getAttribute('data-receive'); location.hash = '#stock'; setTimeout(function () { var s = $('#s-p'); if (s) { s.value = id; $('#s-q').focus(); } }, 50); }
  });

  if (sessionOk()) start(); else showLogin();
})();
