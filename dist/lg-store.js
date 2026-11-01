/* LeadsGate prototype data layer.
   PROTOTYPE ONLY: everything is stored in this browser's localStorage so the client can try
   checkout, MoMo proof upload, admin and stock without a server. It is NOT secure and NOT shared
   between devices. The public API below is async and shaped like the planned Supabase backend
   (products, stock_transactions, orders, payment_proofs, settings), so each function can be
   replaced by a database call without changing the pages that use it. */
(function (global) {
  'use strict';
  var KEY = 'lg-demo-db-v1';
  var ROOMS = ['Kitchen', 'Dining', 'Storage', 'Cleaning', 'Living'];
  var RANGES = ['Kitchen Appliances', 'Utensils', 'Home essentials', 'Home Decor', 'Furniture'];

  /* Demo values only. Prices and stock are placeholders for the walkthrough, not LeadsGate figures. */
  var SEED = [
    ['cookware-steel', 'Stainless steel cookware set', 'Kitchen', 'Utensils', 'Two frying pans, a stockpot, a saucepan and a sauté pan, with matching lids.', 'Set', 1450, 12],
    ['saucepan', 'Colour-pop saucepan', 'Kitchen', 'Utensils', 'Cream saucepan with a glass lid and a coral silicone rim, knob and handle.', '', 320, 8],
    ['saute-pan', 'Everyday sauté pan', 'Kitchen', 'Utensils', 'Wide, deep pan with a glass lid and gold-tone handles.', '', 380, 6],
    ['casserole', 'Covered casserole pot', 'Kitchen', 'Utensils', 'Two-handled pot with a glass lid and soft-grip handles and knob.', '', 410, 0],
    ['utensils', 'Kitchen utensil set', 'Kitchen', 'Utensils', 'Spoons, turners, whisk, tongs, ladle and more in a ribbed holder.', 'Set', 260, 20],
    ['nesting-bowls', 'Nesting kitchen bowls', 'Kitchen', 'Utensils', 'Mixing bowls, colander and measuring cups that stack into one.', '', 290, 9],
    ['toaster', 'Two-slice toaster', 'Kitchen', 'Kitchen Appliances', 'Two-slot toaster with cancel, reheat and defrost buttons.', '', 450, 4],
    ['dinnerware', 'Gather-round dinnerware', 'Dining', 'Utensils', 'White textured set with bowls, plates, cups and saucers, and two platters.', 'Set', 980, 7],
    ['cutlery', 'Table-ready cutlery set', 'Dining', 'Utensils', 'Stainless steel knives, forks, spoons and teaspoons in a gift box.', '', 350, 15],
    ['food-carriers', 'Food carrier set', 'Storage', 'Utensils', 'Insulated carriers with stainless steel inner pots and locking lids, in several sizes.', '', 520, 10],
    ['storage-rect', 'Rectangular food containers', 'Storage', 'Utensils', 'Clear containers with four clip locks, in three sizes.', '', 180, 24],
    ['storage-square', 'Square food containers', 'Storage', 'Utensils', 'Square clear containers with four clip locks, in three sizes.', '', 170, 22],
    ['dish-rack', 'Two-tier dish rack', 'Cleaning', 'Home essentials', 'Folding rack for plates, bowls and mugs, with a drip tray.', '', 240, 11],
    ['sink-caddy', 'Sink organiser & soap dispenser', 'Cleaning', 'Home essentials', 'Soap pump, sponge tray and cloth rail in one unit.', '', 150, 3],
    ['microfibre', 'Microfibre cleaning cloths', 'Cleaning', 'Home essentials', 'Reusable cloths on a roll. Pack shows 50 per roll, 25 × 25 cm.', '', 95, 30]
  ];

  function now() { return new Date().toISOString(); }
  function uid(prefix) {
    var a = new Uint8Array(6); (global.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; });
    return (prefix || '') + Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function orderRef() {
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', a = new Uint8Array(6); crypto.getRandomValues(a);
    return 'LG-' + Array.prototype.map.call(a, function (b) { return c[b % c.length]; }).join('');
  }
  function clean(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200); }
  function slug(s) { return clean(s, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function seed() {
    var t = now(), db = { version: 1, demo: true, createdAt: t, settings: { momoNumber: '024 375 5765', momoName: '', momoNetwork: 'MTN MoMo', lowStock: 5, adminHash: '', adminSalt: '' }, products: [], transactions: [], orders: [], audit: [] };
    SEED.forEach(function (r) {
      db.products.push({ id: r[0], sku: 'LG-' + r[0].toUpperCase(), name: r[1], room: r[2], range: r[3], desc: r[4], tag: r[5], price: r[6] * 100, stock: r[7], active: true, image: '/assets/products/leadsgate-' + r[0] + '.webp', builtIn: true, updatedAt: t });
      db.transactions.push({ id: uid('tx_'), at: t, productId: r[0], type: 'opening', qty: r[7], balance: r[7], ref: '', note: 'Demo opening stock', by: 'system' });
    });
    return db;
  }
  var cache = null;
  function load() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY)); } catch (e) { cache = null; }
    if (!cache || cache.version !== 1) { cache = seed(); persist(); }
    return cache;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); }
    catch (e) { var err = new Error('This browser’s storage is full. In the prototype, reset the demo data from Admin › Settings.'); err.code = 'quota'; throw err; }
  }
  global.addEventListener && global.addEventListener('storage', function (e) { if (e.key === KEY) cache = null; });
  function audit(who, action, detail) { var db = load(); db.audit.unshift({ at: now(), who: who || 'admin', action: action, detail: clean(detail, 300) }); db.audit = db.audit.slice(0, 500); }
  function byId(id) { return load().products.filter(function (p) { return p.id === id; })[0]; }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }

  function move(productId, type, qty, ref, note, by) {
    var p = byId(productId); if (!p) throw new Error('Unknown product');
    qty = Math.trunc(qty);
    if (!qty && type !== 'count') throw new Error('Quantity must not be zero');
    var next = type === 'count' ? qty : p.stock + qty;
    if (next < 0) throw new Error('Not enough stock for ' + p.name + ' (on hand: ' + p.stock + ')');
    var delta = type === 'count' ? next - p.stock : qty;
    p.stock = next; p.updatedAt = now();
    var tx = { id: uid('tx_'), at: now(), productId: productId, type: type, qty: delta, balance: next, ref: clean(ref, 40), note: clean(note, 200), by: by || 'admin' };
    load().transactions.unshift(tx);
    return tx;
  }

  function validPhone(s) { var d = String(s).replace(/\D/g, ''); if (d.indexOf('233') === 0) d = '0' + d.slice(3); return /^0(2[0-9]|5[0-9])\d{7}$/.test(d) ? d : null; }

  var API = {
    isDemo: true,
    ROOMS: ROOMS, RANGES: RANGES,
    /* ---- synchronous snapshot for storefront rendering ---- */
    catalogueSync: function () { return copy(load().products.filter(function (p) { return p.active; })); },
    settingsSync: function () { var s = copy(load().settings); delete s.adminHash; delete s.adminSalt; return s; },
    newRef: orderRef,
    money: function (pesewas) { return '₵' + (pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    validPhone: validPhone,

    /* ---- products ---- */
    listProducts: async function () { return copy(load().products); },
    saveProduct: async function (input, by) {
      var db = load(), p = input.id ? byId(input.id) : null, isNew = !p;
      var name = clean(input.name, 90); if (name.length < 2) throw new Error('Name is required');
      if (ROOMS.indexOf(input.room) < 0) throw new Error('Room must be one of: ' + ROOMS.join(', '));
      if (RANGES.indexOf(input.range) < 0) throw new Error('Range must be one of: ' + RANGES.join(', '));
      var price = input.price === '' || input.price == null ? null : Math.round(Number(input.price) * 100);
      if (price != null && (!isFinite(price) || price < 0 || price > 100000000)) throw new Error('Price must be a positive amount in cedis');
      if (isNew) {
        var id = slug(input.sku || name) || uid('p_'); while (byId(id)) id += '-2';
        p = { id: id, builtIn: false, stock: 0, tag: '' }; db.products.push(p);
      }
      p.sku = clean(input.sku, 30) || p.sku || ('LG-' + p.id.toUpperCase().slice(0, 10));
      p.name = name; p.room = input.room; p.range = input.range; p.desc = clean(input.desc, 400); p.price = price;
      p.active = input.active !== false; if (input.image) p.image = input.image; if (!p.image) p.image = '/assets/leadsgate-monogram.png';
      p.updatedAt = now();
      if (isNew && Number(input.stock) > 0) move(p.id, 'opening', Number(input.stock), '', 'Opening stock', by);
      audit(by, isNew ? 'product.create' : 'product.update', p.name); persist();
      return copy(p);
    },
    /* CSV import: header row required. Returns {created, updated, errors[]} and applies only valid rows. */
    parseCSV: function (text) {
      var rows = [], row = [], f = '', q = false;
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
        else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
        else f += c;
      }
      if (f || row.length) { row.push(f); rows.push(row); }
      return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
    },
    previewImport: async function (text) {
      var rows = API.parseCSV(text); if (rows.length < 2) throw new Error('The file needs a header row and at least one product');
      if (rows.length > 1001) throw new Error('Import up to 1,000 products at a time');
      var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
      ['sku', 'name', 'room', 'range', 'price', 'stock'].forEach(function (h) { if (head.indexOf(h) < 0) throw new Error('Missing column: ' + h); });
      var out = [];
      rows.slice(1).forEach(function (r, n) {
        var o = {}; head.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
        // stop spreadsheet formula injection when the data is exported again
        Object.keys(o).forEach(function (k) { if (/^[=+\-@]/.test(o[k]) && k !== 'price' && k !== 'stock') o[k] = "'" + o[k]; });
        var errs = [];
        if (!o.name) errs.push('name missing');
        var room = ROOMS.filter(function (x) { return x.toLowerCase() === (o.room || '').toLowerCase(); })[0]; if (!room) errs.push('room not recognised');
        var range = RANGES.filter(function (x) { return x.toLowerCase() === (o.range || '').toLowerCase(); })[0]; if (!range) errs.push('range not recognised');
        if (o.price !== '' && !(Number(o.price) >= 0)) errs.push('price not a number');
        if (o.stock !== '' && !/^\d+$/.test(o.stock)) errs.push('stock must be a whole number');
        var existing = load().products.filter(function (p) { return p.sku && o.sku && p.sku.toLowerCase() === o.sku.toLowerCase(); })[0];
        out.push({ line: n + 2, data: { sku: o.sku, name: o.name, room: room, range: range, desc: o.description || '', price: o.price, stock: o.stock, image: /^\/assets\/[\w\-./]+\.(webp|png|jpe?g)$/.test(o.image || '') ? o.image : '' }, existing: existing ? existing.id : null, errors: errs });
      });
      return out;
    },
    applyImport: async function (preview, by) {
      var created = 0, updated = 0;
      preview.filter(function (r) { return !r.errors.length; }).forEach(function (r) {
        var d = r.data;
        if (r.existing) {
          var p = byId(r.existing);
          API._save({ id: p.id, sku: d.sku, name: d.name, room: d.room, range: d.range, desc: d.desc || p.desc, price: d.price, image: d.image || p.image, active: p.active }, by);
          if (d.stock !== '' && Number(d.stock) !== p.stock) move(p.id, 'count', Number(d.stock), 'CSV', 'Stock count from catalogue import', by);
          updated++;
        } else { API._save({ sku: d.sku, name: d.name, room: d.room, range: d.range, desc: d.desc, price: d.price, stock: d.stock, image: d.image }, by); created++; }
      });
      audit(by, 'catalogue.import', created + ' created, ' + updated + ' updated'); persist();
      return { created: created, updated: updated };
    },
    exportCSV: async function () {
      var esc = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var lines = ['sku,name,room,range,description,price,stock,image,active'];
      load().products.forEach(function (p) { lines.push([p.sku, p.name, p.room, p.range, p.desc, p.price == null ? '' : (p.price / 100).toFixed(2), p.stock, p.image && p.image.indexOf('data:') === 0 ? '' : p.image, p.active ? 'yes' : 'no'].map(esc).join(',')); });
      return lines.join('\n');
    },

    /* ---- stock ---- */
    stockMove: async function (productId, type, qty, ref, note, by) {
      if (['receive', 'adjust', 'writeoff', 'return', 'count'].indexOf(type) < 0) throw new Error('Unknown movement type');
      if (type === 'writeoff') qty = -Math.abs(qty);
      if (type === 'receive' || type === 'return') qty = Math.abs(qty);
      var tx = move(productId, type, qty, ref, note, by); audit(by, 'stock.' + type, byId(productId).name + ' ' + tx.qty); persist(); return copy(tx);
    },
    listTransactions: async function (productId) { return copy(load().transactions.filter(function (t) { return !productId || t.productId === productId; })); },

    /* ---- orders ---- */
    quote: function (list) {
      var lines = [], total = 0, problems = [];
      Object.keys(list || {}).forEach(function (id) {
        var p = byId(id), qty = Math.min(Math.max(parseInt(list[id], 10) || 0, 0), 99);
        if (!p || !p.active || !qty) return;
        if (p.price == null) problems.push(p.name + ' has no price yet');
        else if (p.stock < qty) problems.push(p.stock ? 'Only ' + p.stock + ' × ' + p.name + ' in stock' : p.name + ' is out of stock');
        var sub = (p.price || 0) * qty; total += sub;
        lines.push({ id: p.id, name: p.name, image: p.image, qty: qty, price: p.price, sub: sub, stock: p.stock });
      });
      return { lines: lines, total: total, problems: problems };
    },
    createOrder: async function (input) {
      var q = API.quote(input.list); // prices always come from the catalogue, never from the page
      if (!q.lines.length) throw new Error('Your list is empty');
      if (q.problems.length) throw new Error(q.problems.join('. '));
      var name = clean(input.name, 80); if (name.length < 2) throw new Error('Enter your full name');
      var phone = validPhone(input.phone); if (!phone) throw new Error('Enter a valid Ghana phone number, for example 024 123 4567');
      var payer = validPhone(input.payerNumber); if (!payer) throw new Error('Enter the MoMo number you paid from');
      var txn = clean(input.txnId, 30).replace(/\s/g, ''); if (!/^[A-Za-z0-9.\-]{6,30}$/.test(txn)) throw new Error('Enter the MoMo transaction ID from your confirmation SMS');
      if (!input.proof || !/^data:image\/(jpeg|png|webp);base64,/.test(input.proof.dataUrl)) throw new Error('Upload a screenshot of your MoMo payment');
      var db = load();
      if (db.orders.some(function (o) { return o.momo.txnId.toLowerCase() === txn.toLowerCase() && o.status !== 'rejected'; })) throw new Error('This transaction ID has already been used on another order. Call us if you think this is a mistake.');
      var ref = /^LG-[A-Z2-9]{6}$/.test(input.ref || '') && !db.orders.some(function (o) { return o.id === input.ref; }) ? input.ref : orderRef(), t = now();
      q.lines.forEach(function (l) { move(l.id, 'reserve', -l.qty, ref, 'Held for order awaiting payment check', 'checkout'); });
      var o = { id: ref, at: t, status: 'awaiting', customer: { name: name, phone: phone, email: clean(input.email, 120), fulfil: input.fulfil === 'delivery' ? 'delivery' : 'collect', area: clean(input.area, 120), note: clean(input.note, 300) },
        items: q.lines.map(function (l) { return { id: l.id, name: l.name, qty: l.qty, price: l.price }; }), total: q.total,
        momo: { network: clean(input.network, 30) || 'MTN MoMo', payerNumber: payer, payerName: clean(input.payerName, 80), txnId: txn, amountPaid: Math.round(Number(input.amountPaid || 0) * 100) },
        proof: { dataUrl: input.proof.dataUrl, name: clean(input.proof.name, 80), size: input.proof.size | 0 },
        history: [{ at: t, status: 'awaiting', by: 'customer', note: 'Order placed with MoMo proof' }] };
      db.orders.unshift(o);
      try { persist(); } catch (e) { db.orders.shift(); q.lines.forEach(function (l) { move(l.id, 'release', l.qty, ref, 'Order could not be saved', 'checkout'); }); cache = null; throw e; }
      return { ref: ref, total: q.total };
    },
    orderStatus: async function (ref, phone) {
      var p = validPhone(phone), o = load().orders.filter(function (x) { return x.id === String(ref).trim().toUpperCase(); })[0];
      if (!o || !p || o.customer.phone !== p) return null; // needs both, so refs can't be guessed alone
      return { id: o.id, at: o.at, status: o.status, total: o.total, items: o.items, reason: o.reason || '' };
    },
    listOrders: async function () { return copy(load().orders); },
    setOrderStatus: async function (ref, status, note, by) {
      var o = load().orders.filter(function (x) { return x.id === ref; })[0]; if (!o) throw new Error('Order not found');
      var allowed = { awaiting: ['approved', 'rejected'], approved: ['ready', 'completed', 'refunded'], ready: ['completed'], rejected: [], completed: [], refunded: [] };
      if ((allowed[o.status] || []).indexOf(status) < 0) throw new Error('Cannot move an order from ' + o.status + ' to ' + status);
      if (status === 'rejected' && !clean(note)) throw new Error('Give the customer a reason');
      if (status === 'rejected' || status === 'refunded') o.items.forEach(function (l) { move(l.id, 'release', l.qty, o.id, status === 'rejected' ? 'Payment not confirmed: stock returned' : 'Refunded: stock returned', by); });
      if (status === 'approved') o.items.forEach(function (l) { var t = load().transactions.filter(function (x) { return x.ref === o.id && x.productId === l.id && x.type === 'reserve'; })[0]; if (t) { t.type = 'sale'; t.note = 'Sold: MoMo payment confirmed'; } });
      o.status = status; if (status === 'rejected') o.reason = clean(note, 300);
      o.history.push({ at: now(), status: status, by: by || 'admin', note: clean(note, 300) });
      audit(by, 'order.' + status, o.id); persist();
      return copy(o);
    },

    /* ---- settings and demo admin lock ---- */
    saveSettings: async function (s, by) {
      var db = load();
      if (s.momoNumber != null) { var d = validPhone(s.momoNumber); if (!d) throw new Error('Enter a valid Ghana MoMo number'); db.settings.momoNumber = d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'); }
      if (s.momoName != null) db.settings.momoName = clean(s.momoName, 80);
      if (s.momoNetwork != null) db.settings.momoNetwork = clean(s.momoNetwork, 30);
      if (s.lowStock != null) db.settings.lowStock = Math.max(0, Math.min(999, parseInt(s.lowStock, 10) || 0));
      audit(by, 'settings.update', 'MoMo and stock settings'); persist(); return API.settingsSync();
    },
    hasAdmin: function () { return !!load().settings.adminHash; },
    _hash: async function (pass, salt) {
      var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pass));
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    },
    setPasscode: async function (pass) {
      if (String(pass).length < 10) throw new Error('Use at least 10 characters');
      var db = load(); db.settings.adminSalt = uid(''); db.settings.adminHash = await API._hash(pass, db.settings.adminSalt);
      audit('admin', 'admin.passcode', 'Passcode set'); persist();
    },
    checkPasscode: async function (pass) { var s = load().settings; return !!s.adminHash && (await API._hash(pass, s.adminSalt)) === s.adminHash; },
    listAudit: async function () { return copy(load().audit); },
    reset: async function () { localStorage.removeItem(KEY); cache = null; load(); }
  };
  API._save = function (input, by) { /* sync helper used by import */
    var p = input.id ? byId(input.id) : null, db = load();
    if (!p) { var id = slug(input.sku || input.name) || uid('p_'); while (byId(id)) id += '-2'; p = { id: id, builtIn: false, stock: 0, tag: '' }; db.products.push(p); if (Number(input.stock) > 0) { p.name = input.name; move(id, 'opening', Number(input.stock), 'CSV', 'Opening stock from import', by); } }
    p.sku = clean(input.sku, 30) || p.sku || ('LG-' + p.id.toUpperCase().slice(0, 10)); p.name = clean(input.name, 90); p.room = input.room; p.range = input.range;
    p.desc = clean(input.desc, 400); p.price = input.price === '' || input.price == null ? null : Math.round(Number(input.price) * 100);
    p.active = input.active !== false; p.image = input.image || p.image || '/assets/leadsgate-monogram.png'; p.updatedAt = now();
  };
  global.LGStore = API;
})(window);
