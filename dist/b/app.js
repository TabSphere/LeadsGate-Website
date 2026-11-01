(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Same catalogue as Design A. Names and descriptions come from the supplied product
     images; specifications, prices and stock are confirmed by LeadsGate on enquiry. */
  var A = '../assets/';
  var catalogue = [
    ['cookware-steel', 'Stainless steel cookware set', 'Kitchen', 'Utensils', 'Two frying pans, a stockpot, a saucepan and a sauté pan, with matching lids.', 'Set'],
    ['saucepan', 'Colour-pop saucepan', 'Kitchen', 'Utensils', 'Cream saucepan with a glass lid and a coral silicone rim, knob and handle.'],
    ['saute-pan', 'Everyday sauté pan', 'Kitchen', 'Utensils', 'Wide, deep pan with a glass lid and gold-tone handles.'],
    ['casserole', 'Covered casserole pot', 'Kitchen', 'Utensils', 'Two-handled pot with a glass lid and soft-grip handles and knob.'],
    ['utensils', 'Kitchen utensil set', 'Kitchen', 'Utensils', 'Spoons, turners, whisk, tongs, ladle and more in a ribbed holder.', 'Set'],
    ['nesting-bowls', 'Nesting kitchen bowls', 'Kitchen', 'Utensils', 'Mixing bowls, colander and measuring cups that stack into one.'],
    ['toaster', 'Two-slice toaster', 'Kitchen', 'Kitchen Appliances', 'Two-slot toaster with cancel, reheat and defrost buttons.'],
    ['dinnerware', 'Gather-round dinnerware', 'Dining', 'Utensils', 'White textured set with bowls, plates, cups and saucers, and two platters.', 'Set'],
    ['cutlery', 'Table-ready cutlery set', 'Dining', 'Utensils', 'Stainless steel knives, forks, spoons and teaspoons in a gift box.'],
    ['food-carriers', 'Food carrier set', 'Storage', 'Utensils', 'Insulated carriers with stainless steel inner pots and locking lids, in several sizes.'],
    ['storage-rect', 'Rectangular food containers', 'Storage', 'Utensils', 'Clear containers with four clip locks, in three sizes.'],
    ['storage-square', 'Square food containers', 'Storage', 'Utensils', 'Square clear containers with four clip locks, in three sizes.'],
    ['dish-rack', 'Two-tier dish rack', 'Cleaning', 'Home essentials', 'Folding rack for plates, bowls and mugs, with a drip tray.'],
    ['sink-caddy', 'Sink organiser & soap dispenser', 'Cleaning', 'Home essentials', 'Soap pump, sponge tray and cloth rail in one unit.'],
    ['microfibre', 'Microfibre cleaning cloths', 'Cleaning', 'Home essentials', 'Reusable cloths on a roll. Pack shows 50 per roll, 25 × 25 cm.']
  ];
  var products = catalogue.map(function (c) {
    return { id: c[0], name: c[1], room: c[2], range: c[3], desc: c[4], tag: c[5] || '',
      cutout: A + 'products/leadsgate-' + c[0] + '.webp',
      studio: A + 'products/leadsgate-' + c[0] + '-studio.webp',
      home: A + 'products/leadsgate-' + c[0] + '-home.webp' };
  });
  /* Prototype: catalogue, demo prices and stock come from the shared data layer (lg-store.js),
     which the admin dashboard edits. Without it the static catalogue above is used. */
  var STORE = window.LGStore || null;
  if (STORE) {
    products = STORE.catalogueSync().map(function (r) {
      var builtIn = r.builtIn, img = r.image.charAt(0) === '/' ? '..' + r.image : r.image;
      return { id: r.id, name: r.name, room: r.room, range: r.range, desc: r.desc, tag: r.tag || '', price: r.price, stock: r.stock,
        cutout: img, studio: builtIn ? A + 'products/leadsgate-' + r.id + '-studio.webp' : img, home: builtIn ? A + 'products/leadsgate-' + r.id + '-home.webp' : img };
    });
  }
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  /* Prices in Ghana cedis. Add a product only once LeadsGate confirms its price.
     Example: 'cookware-steel': { price: 1299, was: 1499 } */
  var PRICES = {};
  if (STORE) products.forEach(function (p) { if (p.price != null) PRICES[p.id] = { price: p.price / 100 }; });
  var LOW = STORE ? STORE.settingsSync().lowStock : 0;
  function stockNote(p) { if (!STORE || p.stock == null) return ''; return p.stock <= 0 ? '<span class="stock out">Out of stock</span>' : p.stock <= LOW ? '<span class="stock low">Only ' + p.stock + ' left</span>' : '<span class="stock in">In stock</span>'; }
  function money(n) { return '₵' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function priceHtml(id) {
    var pr = PRICES[id];
    if (!pr || typeof pr.price !== 'number') return 'Price on enquiry';
    return money(pr.price) + (STORE ? ' <small class="demo">demo</small>' : '') + (typeof pr.was === 'number' && pr.was > pr.price ? '<s><span class="sr-only">Was </span>' + money(pr.was) + '</s>' : '');
  }

  var GIFTS = ['dinnerware', 'cutlery', 'toaster', 'cookware-steel', 'food-carriers', 'saucepan', 'utensils'];
  var RAILS = {
    christmas: GIFTS,
    Kitchen: products.filter(function (p) { return p.room === 'Kitchen'; }).map(function (p) { return p.id; }),
    table: products.filter(function (p) { return p.room === 'Dining' || p.room === 'Storage'; }).map(function (p) { return p.id; }),
    Cleaning: products.filter(function (p) { return p.room === 'Cleaning'; }).map(function (p) { return p.id; })
  };
  var CIRCLES = [
    { label: 'Kitchen', img: 'products/leadsgate-cookware-steel.webp', room: 'Kitchen' },
    { label: 'Dining', img: 'products/leadsgate-dinnerware.webp', room: 'Dining' },
    { label: 'Storage', img: 'products/leadsgate-storage-square.webp', room: 'Storage' },
    { label: 'Cleaning', img: 'products/leadsgate-sink-caddy.webp', room: 'Cleaning' },
    { label: 'Appliances', img: 'icon-kitchen-appliances.png', range: 'Kitchen Appliances' },
    { label: 'Utensils', img: 'icon-utensils.png', range: 'Utensils' },
    { label: 'Home decor', img: 'icon-home-decor.png', room: 'Living' },
    { label: 'Furniture', img: 'icon-furniture.png', room: 'Living' }
  ];
  var KITS = [
    { id: 'first-kitchen', name: 'First kitchen', forWho: 'For a new home or first flat', items: ['cookware-steel', 'utensils', 'nesting-bowls', 'dinnerware', 'cutlery'] },
    { id: 'sink', name: 'Clean and tidy sink', forWho: 'For a quick kitchen refresh', items: ['sink-caddy', 'dish-rack', 'microfibre'] },
    { id: 'pantry', name: 'Pantry reset', forWho: 'For organised shelves and leftovers', items: ['storage-rect', 'storage-square', 'food-carriers'] }
  ];
  var SLIDES = [
    { cls: 'xmas', kicker: 'Afehyia pa!', title: 'Christmas at home starts here.', text: 'Gift-ready dinnerware, cookware and cutlery for the festive table. Build your list and we’ll confirm prices.', img: 'dinnerware', cta: ['Shop Christmas picks', '#christmas'], cta2: ['Visit the showroom', '#visit'], snow: true },
    { cls: 'kit', kicker: 'Home kits', title: 'Moving in? One order sets up the kitchen.', text: 'Choose a ready-made kit, remove what you already own, and get one quote for the lot.', img: 'cookware-steel', cta: ['Build a home kit', '#kits'], cta2: ['See all essentials', '#all'] },
    { cls: 'store', kicker: 'Storage', title: 'Everything in its place.', text: 'Clip-lock containers and insulated food carriers keep leftovers fresh and lunches ready.', img: 'storage-rect', cta: ['Shop storage', 'room:Storage'], cta2: ['Shop cleaning', 'room:Cleaning'] }
  ];
  var EMAIL = 'leadsgateofficial@gmail.com';
  var PROMO_END = Date.UTC(2027, 0, 8); /* Christmas content hides from 8 January 2027 */
  var XMAS = Date.UTC(2026, 11, 25); /* Ghana is on GMT all year */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var state = { list: {}, saved: {}, filter: 'All' };
  try {
    var l = JSON.parse(localStorage.getItem('lgb-list') || '{}');
    var s = JSON.parse(localStorage.getItem('lgb-saved') || '[]');
    products.forEach(function (p) { if (Number.isInteger(l[p.id]) && l[p.id] > 0) state.list[p.id] = Math.min(l[p.id], 99); });
    if (Array.isArray(s)) s.forEach(function (id) { if (byId[id]) state.saved[id] = true; });
  } catch (e) {}

  var toastTimer;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200); }

  /* ---------- list + saved ---------- */
  function listTotal() { return Object.keys(state.list).reduce(function (a, k) { return a + state.list[k]; }, 0); }
  function persist() {
    try {
      localStorage.setItem('lgb-list', JSON.stringify(state.list));
      localStorage.setItem('lgb-saved', JSON.stringify(Object.keys(state.saved)));
    } catch (e) {}
    var n = listTotal(), sv = Object.keys(state.saved).length;
    $('#list-count').textContent = n; $('#bn-count').textContent = n; $('#tab-list-n').textContent = n;
    $('#saved-count').textContent = sv; $('#tab-saved-n').textContent = sv;
    $('#list-btn').setAttribute('aria-label', 'Home list, ' + n + (n === 1 ? ' item' : ' items'));
    $('#saved-btn').setAttribute('aria-label', 'Saved items, ' + sv);
    renderDrawer(); syncCards();
  }
  function add(id, n, quiet) {
    if (!byId[id]) return;
    if (STORE && (state.list[id] || 0) + (n || 1) > byId[id].stock) { toast(byId[id].stock ? 'Only ' + byId[id].stock + ' available' : byId[id].name + ' is out of stock'); return; }
    state.list[id] = Math.min((state.list[id] || 0) + (n || 1), 99);
    persist();
    var b = $('#list-btn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    if (!quiet) toast(byId[id].name + ' added to your home list');
  }
  function change(id, d) {
    if (!state.list[id]) return;
    if (d > 0 && STORE && state.list[id] + d > byId[id].stock) { toast('Only ' + byId[id].stock + ' available'); return; }
    state.list[id] += d;
    if (state.list[id] <= 0) delete state.list[id];
    persist();
  }
  function toggleSave(id) {
    if (state.saved[id]) { delete state.saved[id]; toast('Removed from saved'); }
    else { state.saved[id] = true; toast(byId[id].name + ' saved'); }
    persist();
  }

  /* ---------- cards ---------- */
  var HEART = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg>';
  function card(id, gift) {
    var p = byId[id]; if (!p) return '';
    return '<article class="card" data-card="' + id + '">' +
      '<div class="card-media">' + (gift ? '<span class="tag gift">Gift idea</span>' : p.tag ? '<span class="tag">' + p.tag + '</span>' : '') +
      '<button class="heart" type="button" data-save="' + id + '" aria-pressed="false" aria-label="Save ' + esc(p.name) + '">' + HEART + '</button>' +
      '<button type="button" data-view="' + id + '" aria-label="Quick view: ' + esc(p.name) + '" tabindex="-1"><img src="' + p.cutout + '" alt="" loading="lazy" width="400" height="400"></button></div>' +
      '<div class="card-body"><p class="card-room">' + p.room + '</p><h3><button class="card-name" type="button" data-view="' + id + '">' + esc(p.name) + '</button></h3>' +
      '<p class="card-price">' + priceHtml(id) + '</p>' + stockNote(p) +
      '<button class="card-add" type="button" data-add="' + id + '"' + (STORE && p.stock <= 0 ? ' disabled' : '') + '>Add to list</button></div></article>';
  }
  function syncCards() {
    $$('[data-card]').forEach(function (c) {
      var id = c.getAttribute('data-card'), n = state.list[id] || 0, b = $('.card-add', c), h = $('.heart', c);
      b.classList.toggle('in', n > 0);
      var out = STORE && byId[id].stock <= 0, max = STORE && n >= byId[id].stock;
      b.disabled = !!(out || max);
      b.textContent = out ? 'Out of stock' : max ? 'In list (' + n + ') · max available' : n ? 'In list (' + n + ') · add one more' : 'Add to list';
      h.setAttribute('aria-pressed', String(!!state.saved[id]));
      h.setAttribute('aria-label', (state.saved[id] ? 'Unsave ' : 'Save ') + byId[id].name);
    });
  }

  var ARROW_L = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>';
  var ARROW_R = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  function renderRails() {
    $$('[data-rail]').forEach(function (r) {
      var key = r.getAttribute('data-rail'), ids = RAILS[key] || [];
      r.innerHTML = '<div class="rail-wrap"><button class="rail-btn prev" type="button" aria-label="Scroll back">' + ARROW_L + '</button>' +
        '<div class="rail-track" tabindex="0" role="region" aria-label="Products, scroll sideways">' + ids.map(function (id) { return card(id, key === 'christmas'); }).join('') + '</div>' +
        '<button class="rail-btn next" type="button" aria-label="Scroll forward">' + ARROW_R + '</button></div>';
      var track = $('.rail-track', r), prev = $('.prev', r), next = $('.next', r);
      function upd() { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
      prev.addEventListener('click', function () { track.scrollBy({ left: -track.clientWidth * 0.9, behavior: reduceMotion ? 'auto' : 'smooth' }); });
      next.addEventListener('click', function () { track.scrollBy({ left: track.clientWidth * 0.9, behavior: reduceMotion ? 'auto' : 'smooth' }); });
      track.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    });
  }

  /* ---------- categories ---------- */
  function countFor(c) { return products.filter(function (p) { return c.range ? p.range === c.range : p.room === c.room; }).length; }
  function renderCategories() {
    $('#circles').innerHTML = CIRCLES.map(function (c, i) {
      var n = countFor(c);
      return '<button class="circle" type="button" data-circle="' + i + '"><span class="c-img"><img src="' + A + c.img + '" alt="" loading="lazy"></span><span>' + c.label + '<small>' + (n ? n + (n === 1 ? ' item' : ' items') : 'Ask us') + '</small></span></button>';
    }).join('');
    $('#mega-grid').innerHTML = CIRCLES.slice(0, 6).map(function (c, i) {
      var n = countFor(c);
      return '<button class="mega-item" type="button" data-circle="' + i + '"><img src="' + A + c.img + '" alt=""><span>' + c.label + '<small>' + (n ? n + (n === 1 ? ' item' : ' items') : 'Ask us') + '</small></span></button>';
    }).join('');
    var bar = '<a class="hot" href="#christmas">★ Christmas picks</a>' +
      ['Kitchen', 'Dining', 'Storage', 'Cleaning'].map(function (r) { return '<button type="button" data-filter="' + r + '">' + r + '</button>'; }).join('') +
      '<button type="button" data-filter="range:Kitchen Appliances">Appliances</button><a href="#kits">Home kits</a><button type="button" data-filter="Living">Decor &amp; furniture</button><a href="#visit">Visit us</a>';
    $('#catbar').innerHTML = bar;
  }

  /* ---------- all grid ---------- */
  var FILTERS = ['All', 'Kitchen', 'Dining', 'Storage', 'Cleaning', 'range:Kitchen Appliances', 'Living'];
  function fLabel(f) { return f === 'range:Kitchen Appliances' ? 'Appliances' : f === 'Living' ? 'Decor & furniture' : f; }
  function renderGrid() {
    $('#chips').innerHTML = FILTERS.map(function (f) { return '<button class="chip" type="button" data-filter="' + f + '" aria-pressed="' + (state.filter === f) + '">' + esc(fLabel(f)) + '</button>'; }).join('');
    var f = state.filter, list;
    if (f === 'Living') {
      $('#grid').innerHTML = '<div class="empty"><h3>Decor and furniture, coming together.</h3><p>Ask us about the Home Decor and Furniture ranges. Product photos and details are being confirmed.</p><a class="btn btn-primary" href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Home decor and furniture enquiry') + '">Ask about this range</a></div>';
      $('#all-count').textContent = '';
      return;
    }
    list = products.filter(function (p) { return f === 'All' || (f.indexOf('range:') === 0 ? p.range === f.slice(6) : p.room === f); });
    $('#all-count').textContent = list.length + (list.length === 1 ? ' product' : ' products');
    $('#grid').innerHTML = list.map(function (p) { return card(p.id); }).join('');
    syncCards();
  }
  function showFilter(f) {
    state.filter = f; renderGrid();
    $('#all').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------- kits ---------- */
  function renderKits() {
    $('#kit-cards').innerHTML = KITS.map(function (k) {
      return '<article class="kit-card"><div class="kit-imgs">' + k.items.filter(function (id) { return byId[id]; }).slice(0, 4).map(function (id) { return '<img src="' + byId[id].cutout + '" alt="" loading="lazy">'; }).join('') + '</div>' +
        '<h3>' + k.name + '</h3><p class="for">' + k.forWho + '</p><p class="count">' + k.items.length + ' essentials</p>' +
        '<button class="btn btn-primary" type="button" data-kit="' + k.id + '">View kit</button></article>';
    }).join('');
  }
  function openKit(id) {
    var k = KITS.filter(function (x) { return x.id === id; })[0]; if (!k) return;
    show('<div class="panel"><p class="kicker">Home kit</p><h2>' + k.name + '</h2><p class="muted">' + k.forWho + '. Untick anything you already have.</p>' +
      '<div>' + k.items.filter(function (iid) { return byId[iid]; }).map(function (iid) { var p = byId[iid]; return '<label class="line" style="grid-template-columns:24px 56px 1fr;align-items:center"><input type="checkbox" checked value="' + iid + '"><img src="' + p.cutout + '" alt="" style="width:56px;height:56px"><span><span class="line-name">' + esc(p.name) + '</span><br><span class="fine">Price on enquiry</span></span></label>'; }).join('') + '</div>' +
      '<div class="panel-actions"><button class="btn btn-primary" type="button" id="kit-add">Add selected to list</button></div></div>', k.name);
    $('#kit-add').addEventListener('click', function () {
      var picked = $$('#modal-content input:checked').map(function (i) { return i.value; });
      if (!picked.length) { toast('Pick at least one item'); return; }
      picked.forEach(function (iid) { add(iid, 1, true); });
      modal.close(); toast(picked.length + ' items from ' + k.name + ' added');
    });
  }

  /* ---------- carousel ---------- */
  var slideIdx = 0, slideTimer = null, paused = reduceMotion;
  function renderSlides() {
    $('#slides').innerHTML = SLIDES.map(function (s, i) {
      var H = i === 0 ? 'h1' : 'h2';
      function cta(c, cls) { return c[1].indexOf('room:') === 0 ? '<button class="btn ' + cls + '" type="button" data-filter="' + c[1].slice(5) + '">' + c[0] + '</button>' : '<a class="btn ' + cls + '" href="' + c[1] + '">' + c[0] + '</a>'; }
      return '<div class="slide ' + s.cls + (i === 0 ? ' on' : '') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + SLIDES.length + '"' + (i ? ' aria-hidden="true"' : '') + '>' +
        (s.snow ? '<div class="snow" aria-hidden="true"></div>' : '') +
        '<div class="slide-copy"><p class="kicker">' + s.kicker + '</p><' + H + '>' + s.title + '</' + H + '><p>' + s.text + '</p><div class="btns">' + cta(s.cta, 'btn-gold') + cta(s.cta2, 'btn-line') + '</div></div>' +
        '<div class="slide-art"><img src="' + (byId[s.img] ? byId[s.img].home : A + 'home.jpg') + '" alt="" ' + (i ? 'loading="lazy"' : 'fetchpriority="high"') + '></div></div>';
    }).join('');
    $('#car-dots').innerHTML = SLIDES.map(function (s, i) { return '<button type="button" aria-label="Slide ' + (i + 1) + ': ' + esc(s.kicker) + '"' + (i === 0 ? ' aria-current="true"' : '') + ' data-dot="' + i + '"></button>'; }).join('');
    setInert();
  }
  function setInert() {
    $$('.slide').forEach(function (el, i) {
      var on = i === slideIdx;
      el.classList.toggle('on', on);
      if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
      $$('a,button', el).forEach(function (b) { if (on) b.removeAttribute('tabindex'); else b.setAttribute('tabindex', '-1'); });
    });
    $$('[data-dot]').forEach(function (d, i) { if (i === slideIdx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  }
  function go(i) { slideIdx = (i + SLIDES.length) % SLIDES.length; setInert(); }
  function startAuto() { stopAuto(); if (!paused) slideTimer = setInterval(function () { go(slideIdx + 1); }, 6500); }
  function stopAuto() { clearInterval(slideTimer); slideTimer = null; }
  function setPaused(p) {
    paused = p;
    var b = $('#car-pause');
    b.setAttribute('aria-label', p ? 'Play slides' : 'Pause slides');
    b.innerHTML = p ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    startAuto();
  }

  /* ---------- christmas ---------- */
  function setupChristmas() {
    var now = Date.now();
    if (now >= PROMO_END) {
      $('#xmas-strip').hidden = true; $('#christmas').hidden = true;
      SLIDES.shift(); return;
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var d = XMAS - Date.now();
      if (d <= 0) { $('.countdown').innerHTML = '<span class="cd-label">Merry Christmas from LeadsGate</span>'; return false; }
      var s = Math.floor(d / 1000);
      $('#cd-d').textContent = pad(Math.floor(s / 86400)); $('#cd-h').textContent = pad(Math.floor(s % 86400 / 3600));
      $('#cd-m').textContent = pad(Math.floor(s % 3600 / 60)); $('#cd-s').textContent = pad(s % 60);
      return true;
    }
    if (tick()) { var t = setInterval(function () { if (!tick()) clearInterval(t); }, 1000); }
  }

  /* ---------- search ---------- */
  var sugIdx = -1;
  function matches(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    var words = q.split(/\s+/);
    return products.filter(function (p) {
      var hay = (p.name + ' ' + p.room + ' ' + p.range + ' ' + p.desc).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) > -1 || hay.indexOf(w.replace(/s$/, '')) > -1; });
    });
  }
  function renderSuggest() {
    var q = $('#q').value, box = $('#suggest'), m = matches(q);
    sugIdx = -1;
    if (!q.trim()) { box.hidden = true; $('#q').setAttribute('aria-expanded', 'false'); return; }
    box.innerHTML = m.length ? m.slice(0, 6).map(function (p, i) { return '<button type="button" role="option" id="sug-' + i + '" data-view="' + p.id + '"><img src="' + p.cutout + '" alt=""><span>' + esc(p.name) + '<small>' + p.room + ' · Price on enquiry</small></span></button>'; }).join('')
      : '<p class="none">No matches for “' + esc(q) + '”. Try “pan”, “storage” or “cloths”, or call 024 375 5765.</p>';
    box.hidden = false; $('#q').setAttribute('aria-expanded', 'true');
  }
  function closeSuggest() { $('#suggest').hidden = true; $('#q').setAttribute('aria-expanded', 'false'); }

  /* ---------- modal ---------- */
  var modal = $('#modal');
  function show(html, label) {
    $('#modal-content').innerHTML = html;
    modal.setAttribute('aria-label', label || 'Details');
    if (!modal.open) modal.showModal();
  }
  function view(id) {
    var p = byId[id]; if (!p) return;
    var imgs = [[p.cutout, 'Product'], [p.studio, 'Studio'], [p.home, 'At home']];
    show('<div class="qv"><div class="qv-media"><div class="qv-main"><img id="qv-img" src="' + p.cutout + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="qv-thumbs" role="group" aria-label="Image views">' + imgs.map(function (im, i) { return '<button type="button" data-img="' + im[0] + '" data-cover="' + (i === 2) + '" aria-pressed="' + (i === 0) + '" aria-label="' + im[1] + ' view"><img src="' + im[0] + '" alt=""></button>'; }).join('') + '</div></div>' +
      '<div class="qv-info"><p class="kicker">' + p.room + ' · ' + p.range + '</p><h2>' + esc(p.name) + '</h2><p class="price">' + priceHtml(id) + '</p><p class="muted">' + esc(p.desc) + '</p>' +
      '<ul><li>Collect from our Westlands showroom</li><li>Price and availability confirmed before you pay</li></ul>' +
      '<div class="qv-actions"><button class="btn btn-primary" type="button" data-add="' + id + '"' + (STORE && p.stock <= 0 ? ' disabled' : '') + '>Add to list</button><button class="btn btn-ghost" type="button" data-save="' + id + '">' + (state.saved[id] ? 'Saved' : 'Save for later') + '</button></div>' +
      '<p class="fine">Product shown from supplied photos. Details confirmed by LeadsGate on enquiry.</p></div></div>', p.name);
  }

  /* ---------- drawer ---------- */
  var lastFocus = null;
  function openDrawer(tab) {
    lastFocus = document.activeElement;
    $('#overlay').hidden = false; $('#drawer').hidden = false;
    document.body.style.overflow = 'hidden';
    selectTab(tab || 'list');
    $('#drawer-close').focus();
  }
  function closeDrawer() {
    $('#overlay').hidden = true; $('#drawer').hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function selectTab(t) {
    $('#tab-list').setAttribute('aria-selected', String(t === 'list'));
    $('#tab-saved').setAttribute('aria-selected', String(t === 'saved'));
    $('#panel-list').hidden = t !== 'list'; $('#panel-saved').hidden = t !== 'saved';
    $('.drawer-foot').hidden = t !== 'list';
  }
  function renderDrawer() {
    var ids = Object.keys(state.list);
    $('#panel-list').innerHTML = ids.length ? ids.map(function (id) {
      var p = byId[id]; if (!p) return '';
      return '<div class="line"><img src="' + p.cutout + '" alt=""><div><p class="line-name">' + esc(p.name) + '</p><p class="fine">' + priceHtml(id) + '</p><div class="line-row"><div class="qty"><button type="button" data-minus="' + id + '" aria-label="Remove one ' + esc(p.name) + '">−</button><span>' + state.list[id] + '</span><button type="button" data-plus="' + id + '" aria-label="Add one ' + esc(p.name) + '">+</button></div><button class="link-btn" type="button" data-remove="' + id + '">Remove</button></div></div></div>';
    }).join('') : '<div class="drawer-empty"><strong>Your list is empty.</strong><span>Add essentials or a home kit to get started.</span></div>';
    $('#enquire').disabled = !ids.length;
    var co = $('#checkout'); if (co) { co.hidden = !ids.length; var q = STORE ? STORE.quote(state.list) : null; $('#list-total').textContent = q && ids.length ? 'Total ' + STORE.money(q.total) + ' (demo prices)' : ''; }
    var sv = Object.keys(state.saved);
    $('#panel-saved').innerHTML = sv.length ? sv.map(function (id) {
      var p = byId[id]; if (!p) return '';
      return '<div class="line"><img src="' + p.cutout + '" alt=""><div><p class="line-name">' + esc(p.name) + '</p><div class="line-row"><button class="link-btn" type="button" data-move="' + id + '">Move to list</button><button class="link-btn" type="button" data-save="' + id + '">Remove</button></div></div></div>';
    }).join('') : '<div class="drawer-empty"><strong>Nothing saved yet.</strong><span>Tap the heart on any product to keep it for later.</span></div>';
  }
  function enquire() {
    var ids = Object.keys(state.list);
    var msg = 'Hello LeadsGate,\n\nPlease confirm prices and availability for:\n\n' + ids.map(function (id) { return '• ' + byId[id].name + ' × ' + state.list[id]; }).join('\n') + '\n\nName:\nPhone:\nCollect or delivery area:\n\nThank you.';
    closeDrawer();
    show('<div class="panel"><p class="kicker">Your enquiry</p><h2>Nearly there.</h2><p class="muted">Check your list, then open an email draft or copy it. Nothing is sent automatically.</p>' +
      '<label class="sr-only" for="message">Your enquiry message</label><textarea id="message">' + esc(msg) + '</textarea>' +
      '<div class="panel-actions"><a class="btn btn-primary" id="email-enquiry" href="#">Open email draft</a><button class="btn btn-ghost" type="button" id="copy">Copy enquiry</button></div>' +
      '<p class="fine">Prefer to call? <a href="tel:+233243755765">024 375 5765</a> · <a href="tel:+233543077702">054 307 7702</a></p></div>', 'Your enquiry');
    var setHref = function () { $('#email-enquiry').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('My LeadsGate home list') + '&body=' + encodeURIComponent($('#message').value); };
    setHref(); $('#message').addEventListener('input', setHref);
    $('#copy').addEventListener('click', function () {
      var t = $('#message');
      var fallback = function () { t.select(); toast('Select and copy your enquiry'); };
      try { navigator.clipboard.writeText(t.value).then(function () { toast('Enquiry copied'); }, fallback); } catch (err) { fallback(); }
    });
  }

  /* ---------- mega menu ---------- */
  function setMega(open) {
    $('#mega').hidden = !open; $('#cat-btn').setAttribute('aria-expanded', String(open));
  }

  /* ---------- theme ---------- */
  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function labelTheme() {
    var dark = currentTheme() === 'dark', b = $('#theme-btn');
    b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    b.innerHTML = dark ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a'); if (!t) {
      if (!e.target.closest('#mega, #cat-btn')) setMega(false);
      if (!e.target.closest('#search-form')) closeSuggest();
      return;
    }
    var d = t.dataset;
    if (!t.closest('#search-form')) closeSuggest();
    if (!t.closest('#mega') && t.id !== 'cat-btn') setMega(false);
    if (d.add) { add(d.add); return; }
    if (d.save) { toggleSave(d.save); if (modal.open && t.closest('.qv-actions')) t.textContent = state.saved[d.save] ? 'Saved' : 'Save for later'; return; }
    if (d.view) { closeSuggest(); view(d.view); return; }
    if (d.plus) { change(d.plus, 1); return; }
    if (d.minus) { change(d.minus, -1); return; }
    if (d.remove) { delete state.list[d.remove]; persist(); return; }
    if (d.move) { delete state.saved[d.move]; add(d.move, 1, true); toast('Moved to your home list'); return; }
    if (d.kit) { openKit(d.kit); return; }
    if (d.img) {
      var im = $('#qv-img'); im.src = d.img; im.classList.toggle('cover', d.cover === 'true');
      $$('.qv-thumbs button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); return;
    }
    if (d.filter) { setMega(false); showFilter(d.filter); return; }
    if (d.show) { showFilter(d.show); return; }
    if (d.circle) {
      var c = CIRCLES[+d.circle]; setMega(false);
      showFilter(c.range ? 'range:' + c.range : c.room); return;
    }
    if (d.dot) { go(+d.dot); startAuto(); return; }
    if (t.closest('dialog') && t.classList.contains('close')) { modal.close(); return; }
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });

  $('#cat-btn').addEventListener('click', function () { setMega($('#mega').hidden); });
  $('#bn-cats').addEventListener('click', function () { $('#circles').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); });
  $('#bn-search').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); setTimeout(function () { $('#q').focus(); }, reduceMotion ? 0 : 350); });
  $('#store-btn').addEventListener('click', function () { $('#visit').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); });
  $('#list-btn').addEventListener('click', function () { openDrawer('list'); });
  $('#bn-list').addEventListener('click', function () { openDrawer('list'); });
  $('#saved-btn').addEventListener('click', function () { openDrawer('saved'); });
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#overlay').addEventListener('click', closeDrawer);
  $('#tab-list').addEventListener('click', function () { selectTab('list'); });
  $('#tab-saved').addEventListener('click', function () { selectTab('saved'); });
  $('#enquire').addEventListener('click', enquire);
  $('#car-prev').addEventListener('click', function () { go(slideIdx - 1); startAuto(); });
  $('#car-next').addEventListener('click', function () { go(slideIdx + 1); startAuto(); });
  $('#car-pause').addEventListener('click', function () { setPaused(!paused); });
  var car = $('#carousel');
  car.addEventListener('mouseenter', stopAuto); car.addEventListener('mouseleave', startAuto);
  car.addEventListener('focusin', stopAuto); car.addEventListener('focusout', startAuto);

  $('#q').addEventListener('input', renderSuggest);
  $('#q').addEventListener('keydown', function (e) {
    var opts = $$('#suggest [role=option]');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!opts.length) return; e.preventDefault();
      sugIdx = (sugIdx + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach(function (o, i) { o.setAttribute('aria-selected', String(i === sugIdx)); });
      $('#q').setAttribute('aria-activedescendant', opts[sugIdx].id);
    } else if (e.key === 'Escape') closeSuggest();
  });
  $('#search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var opts = $$('#suggest [role=option]');
    if (sugIdx > -1 && opts[sugIdx]) { view(opts[sugIdx].dataset.view); closeSuggest(); return; }
    var m = matches($('#q').value);
    if (m.length === 1) { view(m[0].id); closeSuggest(); return; }
    closeSuggest();
    state.filter = 'All'; renderGrid();
    if (m.length) {
      $('#grid').innerHTML = m.map(function (p) { return card(p.id); }).join(''); syncCards();
      $('#all-count').textContent = m.length + ' results for “' + $('#q').value.trim() + '”';
      $$('#chips .chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    }
    $('#all').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!$('#drawer').hidden) closeDrawer();
      if (!$('#mega').hidden) { setMega(false); $('#cat-btn').focus(); }
    }
    if (e.key === 'Tab' && !$('#drawer').hidden) {
      var f = $$('#drawer button:not([disabled]), #drawer a[href], #drawer [tabindex]:not([tabindex="-1"])').filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  $('#theme-btn').addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('lgb-theme', next); } catch (e) {}
    labelTheme();
  });

  /* ---------- init ---------- */
  setupChristmas();
  renderSlides();
  renderCategories();
  renderRails();
  renderKits();
  renderGrid();
  persist();
  labelTheme();
  setPaused(paused);
  $('#year').textContent = new Date().getFullYear();

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.section .wrap > *, .trust-row > div').forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }
})();
