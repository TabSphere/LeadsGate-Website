(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Catalogue: names and descriptions are based on the supplied product images.
     Exact specifications, prices and stock are confirmed by LeadsGate on enquiry. */
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
      studio: 'assets/products/leadsgate-' + c[0] + '-studio.webp',
      cutout: 'assets/products/leadsgate-' + c[0] + '.webp',
      home: 'assets/products/leadsgate-' + c[0] + '-home.webp' };
  });
  /* Prices in Ghana cedis. Leave a product out until LeadsGate confirms its price:
     cards then show "Price on enquiry". Example: 'cookware-steel': { price: 1299, was: 1499 } */
  var PRICES = {};
  function money(n) { return '₵' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function priceHtml(id) {
    var pr = PRICES[id];
    if (!pr || typeof pr.price !== 'number') return null;
    return money(pr.price) + (typeof pr.was === 'number' && pr.was > pr.price ? '<s><span class="sr-only">Was </span>' + money(pr.was) + '</s>' : '');
  }

  var CATS = [
    { id: 'Kitchen Appliances', img: 'assets/icon-kitchen-appliances.png', range: 'Kitchen Appliances' },
    { id: 'Utensils', img: 'assets/icon-utensils.png', range: 'Utensils' },
    { id: 'Home essentials', img: 'assets/products/leadsgate-microfibre.webp', range: 'Home essentials' },
    { id: 'Home Decor', img: 'assets/icon-home-decor.png', room: 'Living' },
    { id: 'Furniture', img: 'assets/icon-furniture.png', room: 'Living' },
    { id: 'Home kits', img: 'assets/products/leadsgate-cookware-steel.webp', anchor: '#kits' }
  ];

  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  var ROOMS = [
    { id: 'Kitchen', hero: 'cookware-steel', line: 'Cook something good' },
    { id: 'Dining', hero: 'dinnerware', line: 'Make room for everyone' },
    { id: 'Cleaning', hero: 'sink-caddy', line: 'A fresh start daily' },
    { id: 'Storage', hero: 'storage-square', line: 'Everything in its place' }
  ];
  var KITS = [
    { id: 'first-kitchen', name: 'First kitchen', forWho: 'For a new home or first flat', desc: 'Everything to cook and serve a meal from day one.', items: ['cookware-steel', 'utensils', 'nesting-bowls', 'dinnerware', 'cutlery'] },
    { id: 'sink', name: 'Clean and tidy sink', forWho: 'For a quick kitchen refresh', desc: 'Keep the sink area clear and the dishes drying.', items: ['sink-caddy', 'dish-rack', 'microfibre'] },
    { id: 'pantry', name: 'Pantry reset', forWho: 'For organised shelves and leftovers', desc: 'See what you have and keep food fresh and portable.', items: ['storage-rect', 'storage-square', 'food-carriers'] }
  ];
  var EMAIL = 'leadsgateofficial@gmail.com';

  var $ = function (s) { return document.querySelector(s); };
  var modal = $('#modal');
  var state = { room: 'All', range: '', query: '', kit: 'first-kitchen', kitOff: {}, basket: {} };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function count(room) { return products.filter(function (p) { return room === 'All' || p.room === room; }).length; }

  try {
    var saved = JSON.parse(localStorage.getItem('leadsgate-list-v2') || '{}');
    products.forEach(function (p) { if (Number.isInteger(saved[p.id]) && saved[p.id] > 0) state.basket[p.id] = Math.min(saved[p.id], 99); });
  } catch (e) {}

  /* toast */
  var toastTimer;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200); }

  /* basket */
  function total() { return Object.keys(state.basket).reduce(function (a, k) { return a + state.basket[k]; }, 0); }
  function save() {
    try { localStorage.setItem('leadsgate-list-v2', JSON.stringify(state.basket)); } catch (e) {}
    $('#count').textContent = total(); $('#mobile-count').textContent = total();
    renderBasket();
  }
  function add(id, n, quiet) {
    if (!byId[id]) return;
    state.basket[id] = Math.min((state.basket[id] || 0) + (n || 1), 99);
    save(); renderGrid();
    var b = $('#bag'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    if (!quiet) toast(byId[id].name + ' added to your home list');
  }
  function change(id, d) {
    if (!state.basket[id]) return;
    state.basket[id] += d;
    if (state.basket[id] <= 0) delete state.basket[id];
    save(); renderGrid();
  }
  function renderBasket() {
    var box = $('#basket-items'), ids = Object.keys(state.basket);
    if (!ids.length) {
      box.innerHTML = '<div class="drawer-empty"><strong>Your list is waiting.</strong><span>Pick a room or a home kit to get started.</span></div>';
      $('#enquire').disabled = true; return;
    }
    $('#enquire').disabled = false;
    box.innerHTML = ids.map(function (id) {
      var p = byId[id];
      return '<div class="line"><img src="' + p.cutout + '" alt=""><div><p class="line-name">' + esc(p.name) + '</p><p class="fine">Price on enquiry</p>' +
        '<div class="line-row"><div class="qty"><button type="button" data-minus="' + id + '" aria-label="Remove one ' + esc(p.name) + '">−</button><span>' + state.basket[id] + '</span><button type="button" data-plus="' + id + '" aria-label="Add one ' + esc(p.name) + '">+</button></div>' +
        '<button class="remove" type="button" data-remove="' + id + '">Remove</button></div></div></div>';
    }).join('');
  }

  /* rooms */
  function renderRooms() {
    $('#room-tiles').innerHTML = ROOMS.map(function (r) {
      return '<button class="room-chip" type="button" data-room="' + r.id + '" aria-pressed="' + (state.room === r.id) + '">' +
        '<img src="' + byId[r.hero].cutout + '" alt="" loading="eager"><span><strong>' + r.id + '</strong><small>' + count(r.id) + (count(r.id) === 1 ? ' item' : ' items') + '</small></span></button>';
    }).join('');
  }

  /* shop grid */
  function renderCats() {
    $('#cats-row').innerHTML = CATS.map(function (c, i) {
      var active = (c.range && state.range === c.range) || (c.room && !state.range && state.room === c.room);
      var n = c.range ? products.filter(function (p) { return p.range === c.range; }).length : 0;
      return '<button class="cat" type="button" data-cat="' + i + '" aria-pressed="' + active + '"><span class="cat-img"><img src="' + c.img + '" alt="" loading="lazy"></span><span>' + c.id + (c.range ? '<small>' + n + (n === 1 ? ' item' : ' items') + '</small>' : c.anchor ? '<small>3 ready-made</small>' : '<small>Ask us</small>') + '</span></button>';
    }).join('');
  }
  function setRoom(room, scroll) {
    state.room = room; state.range = '';
    renderRooms(); renderCats(); renderGrid();
    if (scroll) $('#shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function renderFilters() {
    var rooms = ['All'].concat(ROOMS.map(function (r) { return r.id; })).concat(['Living']);
    $('#filters').innerHTML = rooms.map(function (r) {
      var label = r === 'All' ? 'All' : r === 'Living' ? 'Decor & furniture' : r;
      var n = r === 'Living' ? '' : '<span class="n">' + count(r) + '</span>';
      return '<button class="chip" type="button" data-filter="' + r + '" aria-pressed="' + (!state.range && state.room === r) + '">' + label + n + '</button>';
    }).join('');
  }
  function renderGrid() {
    renderFilters();
    var q = state.query.trim().toLowerCase();
    var list = products.filter(function (p) {
      return (state.room === 'All' || p.room === state.room) && (!state.range || p.range === state.range) && (p.name + ' ' + p.range + ' ' + p.room + ' ' + p.desc).toLowerCase().indexOf(q) !== -1;
    });
    $('#shop-title').textContent = state.range ? state.range + '.' : state.room === 'All' ? 'Every room, every essential.' : state.room === 'Living' ? 'Home Decor and Furniture.' : 'For the ' + state.room.toLowerCase() + '.';
    $('#result-count').textContent = state.room === 'Living' ? '' : list.length + (list.length === 1 ? ' essential' : ' essentials') + (q ? ' matching “' + state.query.trim() + '”' : '');
    if (state.room === 'Living') {
      $('#grid').innerHTML = '<div class="empty"><div class="icons"><img src="assets/icon-home-decor.png" alt=""><img src="assets/icon-furniture.png" alt=""></div><h3>Decor and furniture, coming together.</h3><p>Ask us about the Home Decor and Furniture ranges. Product photos and details are being confirmed.</p><a class="btn btn-primary" href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Home decor and furniture enquiry') + '">Ask about this range</a><p class="fine">Or call <a class="text-link" href="tel:+233243755765">024 375 5765</a></p></div>';
      return;
    }
    if (!list.length) {
      $('#grid').innerHTML = '<div class="empty"><h3>No essentials found.</h3><p>Try another word or room.</p><button class="btn btn-ghost" type="button" id="reset">Show all essentials</button></div>';
      return;
    }
    $('#grid').innerHTML = list.map(function (p, i) {
      var inList = state.basket[p.id];
      return '<article class="card" style="animation-delay:' + Math.min(i * 40, 400) + 'ms"><div class="card-top">' +
        '<button class="card-media" type="button" data-view="' + p.id + '" aria-label="View ' + esc(p.name) + '">' +
          '<img class="img-cut" src="' + p.cutout + '" alt="" loading="lazy">' +
          '<img class="img-home" src="' + p.home + '" alt="" loading="lazy"></button>' +
        (p.tag ? '<span class="card-tag">' + p.tag + '</span>' : '') +
        '<button class="card-add' + (inList ? ' added' : '') + '" type="button" data-add="' + p.id + '" aria-label="' + (inList ? 'Add another ' : 'Add ') + esc(p.name) + ' to your home list">' +
          (inList ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>') +
        '</button></div>' +
        '<div class="card-body"><p class="card-room">' + p.room + '</p><h3><button class="card-name" type="button" data-view="' + p.id + '">' + esc(p.name) + '</button></h3>' + (priceHtml(p.id) ? '<p class="card-price has-price">' + priceHtml(p.id) + '</p>' : '<p class="card-price">Price on enquiry</p>') + (inList ? '<p class="card-price">In your list (' + inList + ')</p>' : '') + '</div></article>';
    }).join('');
  }

  /* dialogs */
  function show(html, label) {
    $('#modal-content').innerHTML = html;
    modal.setAttribute('aria-label', label || 'Details');
    if (!modal.open) modal.showModal();
  }
  function detail(id) {
    var p = byId[id]; if (!p) return;
    show('<div class="detail"><div class="detail-media"><img id="detail-image" src="' + p.studio + '" alt="' + esc(p.name) + '">' +
      '<div class="views" role="group" aria-label="Photo style"><button type="button" data-image="' + p.studio + '" aria-pressed="true">Studio</button><button type="button" data-image="' + p.home + '" aria-pressed="false">In the home</button><button type="button" data-image="' + p.cutout + '" aria-pressed="false">Product only</button></div></div>' +
      '<div class="detail-body"><p class="eyebrow">' + p.room + ' · ' + p.range + '</p><h2>' + esc(p.name) + '</h2><p>' + esc(p.desc) + '</p>' +
      (priceHtml(p.id) ? '<p class="card-price has-price">' + priceHtml(p.id) + '</p>' : '') + '<p class="fine">' + (priceHtml(p.id) ? 'Exact model, size, colour and stock' : 'Price, exact model, size and colour') + ' are confirmed by LeadsGate when you enquire.</p>' +
      '<div class="detail-actions"><button class="btn btn-primary" type="button" data-add="' + p.id + '" data-close="1">Add to home list</button><button class="btn btn-ghost" type="button" id="detail-list">View home list</button></div></div></div>', p.name);
  }
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
  $('#modal .close').addEventListener('click', function () { modal.close(); });

  /* drawer */
  var lastFocus;
  function openBag() {
    lastFocus = document.activeElement;
    if (modal.open) modal.close();
    $('#drawer').hidden = false; $('#overlay').hidden = false;
    $('#drawer').setAttribute('role', 'dialog'); $('#drawer').setAttribute('aria-modal', 'true');
    document.body.style.overflow = 'hidden';
    $('#close-bag').focus();
  }
  function closeBag() {
    if ($('#drawer').hidden) return;
    $('#drawer').hidden = true; $('#overlay').hidden = true; document.body.style.overflow = '';
    (lastFocus || $('#bag')).focus();
  }
  $('#bag').addEventListener('click', openBag);
  $('#close-bag').addEventListener('click', closeBag);
  $('#overlay').addEventListener('click', closeBag);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeBag();
    if (e.key === 'Tab' && !$('#drawer').hidden) {
      var nodes = Array.prototype.slice.call($('#drawer').querySelectorAll('button:not(:disabled), a[href], input'));
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* enquiry */
  $('#enquire').addEventListener('click', function () {
    var lines = Object.keys(state.basket).map(function (id) { return state.basket[id] + ' × ' + byId[id].name; });
    var message = 'Hello LeadsGate,\n\nPlease confirm prices and availability for my home list:\n\n' + lines.join('\n') + '\n\nPlease also confirm the exact product details and delivery or collection options.\n\nName:\nPhone:\nArea:\n\nThank you.';
    closeBag();
    show('<div class="panel"><p class="eyebrow">Your enquiry</p><h2>A little closer to home.</h2><p>Check your list, then open an email draft or copy it. Nothing is sent automatically.</p>' +
      '<label class="sr-only" for="message">Your enquiry message</label><textarea id="message"></textarea>' +
      '<div class="panel-actions"><a class="btn btn-primary" id="email-enquiry" href="#">Open email draft</a><button class="btn btn-ghost" type="button" id="copy">Copy enquiry</button></div>' +
      '<p class="fine">Prefer to call? <a href="tel:+233243755765">024 375 5765</a> · <a href="tel:+233543077702">054 307 7702</a></p></div>', 'Your enquiry');
    $('#message').value = message;
    var setHref = function () { $('#email-enquiry').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('My LeadsGate home list') + '&body=' + encodeURIComponent($('#message').value); };
    setHref(); $('#message').addEventListener('input', setHref);
    $('#copy').addEventListener('click', function () {
      var t = $('#message');
      var fallback = function () { t.select(); toast('Select and copy your enquiry'); };
      try { navigator.clipboard.writeText(t.value).then(function () { toast('Enquiry copied'); }, fallback); } catch (err) { fallback(); }
    });
  });

  /* kits */
  function currentKit() { return KITS.filter(function (k) { return k.id === state.kit; })[0]; }
  function kitSelection() { var k = currentKit(); return k.items.filter(function (id) { return !state.kitOff[id]; }); }
  function renderKits() {
    $('#kit-tabs').innerHTML = KITS.map(function (k) {
      return '<button class="kit-tab" type="button" data-kit="' + k.id + '" aria-pressed="' + (k.id === state.kit) + '"><strong>' + k.name + '</strong><span class="k-n">' + k.items.length + ' items</span><small>' + k.forWho + '</small></button>';
    }).join('');
    var k = currentKit();
    $('#kit-name').textContent = k.name;
    $('#kit-desc').textContent = k.desc;
    $('#kit-items').innerHTML = k.items.map(function (id) {
      var off = !!state.kitOff[id];
      return '<li><label class="' + (off ? 'off' : '') + '"><input type="checkbox" id="kit-' + id + '" data-kit-item="' + id + '"' + (off ? '' : ' checked') + '><img src="' + byId[id].cutout + '" alt="" loading="lazy"><span>' + esc(byId[id].name) + '</span></label></li>';
    }).join('');
    var n = kitSelection().length;
    $('#kit-count').textContent = n;
    $('#kit-add').disabled = !n;
  }
  $('#kit-items').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-kit-item'); if (!id) return;
    state.kitOff[id] = !e.target.checked; renderKits();
    var again = document.getElementById('kit-' + id); if (again) again.focus();
  });
  $('#kit-add').addEventListener('click', function () {
    var ids = kitSelection();
    ids.forEach(function (id) { add(id, 1, true); });
    toast(ids.length + ' items from ' + currentKit().name + ' added');
    openBag();
  });

  /* search */
  $('#search').addEventListener('input', function (e) { state.query = e.target.value; if (state.query.trim() && (state.room !== 'All' || state.range)) { state.room = 'All'; state.range = ''; renderRooms(); renderCats(); } renderGrid(); });
  function runSearch(q) {
    state.query = q; state.room = 'All'; state.range = '';
    $('#search').value = q; renderRooms(); renderCats(); renderGrid();
    $('#shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  $('#hero-search').addEventListener('submit', function (e) { e.preventDefault(); runSearch($('#hero-q').value); });
  $('#header-search').addEventListener('submit', function (e) { e.preventDefault(); runSearch($('#header-q').value); });
  $('#mobile-search').addEventListener('click', function () { $('#search-jump').click(); });
  $('#mobile-list').addEventListener('click', openBag);
  $('#to-top').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); $('.brand').focus(); });
  $('#search-jump').addEventListener('click', function () {
    $('#shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(function () { $('#search').focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
  });

  /* one click handler */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.add) { add(d.add); if (d.close && modal.open) modal.close(); return; }
    if (d.view) { detail(d.view); return; }
    if (d.cat) {
      var c = CATS[Number(d.cat)];
      if (c.anchor) { $(c.anchor).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
      if (c.range) { state.room = 'All'; state.range = state.range === c.range ? '' : c.range; renderRooms(); renderCats(); renderGrid(); }
      else setRoom(c.room, false);
      $('#shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    if (d.filter) { setRoom(d.filter, false); return; }
    if (d.room) { setRoom(state.room === d.room ? 'All' : d.room, true); return; }
    if (d.kit) { state.kit = d.kit; state.kitOff = {}; renderKits(); return; }
    if (d.plus) { change(d.plus, 1); return; }
    if (d.minus) { change(d.minus, -1); return; }
    if (d.remove) { delete state.basket[d.remove]; save(); renderGrid(); return; }
    if (d.image) {
      $('#detail-image').src = d.image;
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      return;
    }
    if (b.id === 'detail-list') { openBag(); return; }
    if (b.id === 'reset') { state.query = ''; $('#search').value = ''; $('#header-q').value = ''; $('#hero-q').value = ''; setRoom('All', false); }
  });

  /* credits */
  $('#credits').addEventListener('click', function () {
    show('<div class="panel"><p class="eyebrow">Photography</p><h2>Photo credits</h2><p>Product images come from the supplied LeadsGate product pack, shown on studio and home-style backgrounds. Lifestyle photography is illustrative, from Pexels, and does not show LeadsGate premises or stock.</p>' +
      '<p><a target="_blank" rel="noopener" href="https://www.pexels.com/photo/interior-of-modern-kitchen-with-dining-table-5825363/">Kitchen · Charlotte May</a></p>' +
      '<p><a target="_blank" rel="noopener" href="https://www.pexels.com/photo/table-with-chairs-in-kitchen-6297088/">Dining · Max Vakhtbovych</a></p>' +
      '<p><a target="_blank" rel="noopener" href="https://www.pexels.com/photo/modern-kitchen-interior-with-furniture-and-dining-zone-6186826/">Home · Max Vakhtbovych</a></p></div>', 'Photo credits');
  });

  /* header shadow on scroll */
  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); $('#to-top').hidden = window.scrollY < 900; };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* gentle reveal for section heads */
  var reveals = document.querySelectorAll('.section-head, .bento-card, .steps li, .kit-panel, .contact-card');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) {
      el.classList.add('reveal');
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); else io.observe(el);
    });
  }

  /* Christmas promotion banner.
     Edit the messages here. The banner hides itself after "until" and when a visitor closes it.
     Do not add discounts or prices until LeadsGate confirms them. */
  var PROMO = {
    id: 'christmas-2026',
    until: '2027-01-07',
    messages: [
      'Christmas at LeadsGate · Afehyia pa!',
      'Gift a home kit this Christmas: cookware, dinnerware and storage',
      'Ask about our Christmas offers: call 024 375 5765',
      'Visit the showroom at Adjamanale Bu Ave, Westlands',
      'Build your Christmas list and we’ll confirm prices and stock'
    ]
  };
  (function setupPromo() {
    var dismissed = false;
    try { dismissed = localStorage.getItem('lg-promo-hidden') === PROMO.id; } catch (e) {}
    if (new Date() > new Date(PROMO.until + 'T23:59:59')) return;
    document.documentElement.classList.add('promo-on');
    if (dismissed) return;
    var star = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z"/></svg>';
    var group = function (hidden) {
      return '<div class="promo-group"' + (hidden ? ' aria-hidden="true"' : '') + '>' + PROMO.messages.map(function (m) { return '<span class="promo-item">' + star + esc(m) + '</span>'; }).join('') + '</div>';
    };
    $('#promo-track').innerHTML = group(false) + group(true);
    $('#promo').hidden = false;
    var w = $('#promo-track').scrollWidth / 2;
    $('#promo-track').style.setProperty('--ticker-time', Math.max(20, Math.round(w / 55)) + 's');
    $('#promo-close').addEventListener('click', function () {
      $('#promo').hidden = true;
      try { localStorage.setItem('lg-promo-hidden', PROMO.id); } catch (e) {}
    });
  })();

  /* 3D store: load three.js only when the section is close to the screen */
  (function setupStore3D() {
    var root = $('#store'); if (!root) return;
    var ok = false;
    try { var cv = document.createElement('canvas'); ok = !!(window.WebGLRenderingContext && (cv.getContext('webgl2') || cv.getContext('webgl'))); } catch (e) {}
    if (!ok) { root.classList.add('no-3d'); return; }
    var touch = window.matchMedia('(hover: none)').matches;
    var started = false;
    function label(btn, text) { btn.querySelector('span').textContent = text; }
    function start() {
      if (started) return; started = true;
      import('./store3d.js').then(function (m) {
        return m.init(root, { reduceMotion: reduceMotion, promo: document.documentElement.classList.contains('promo-on') });
      }).then(function (api) {
        api.setInteractive(!touch);
        var night = $('#s3-night'), play = $('#s3-play'), act = $('#s3-activate');
        if (!api.isRunning()) { play.setAttribute('aria-pressed', 'false'); label(play, 'Play'); play.querySelector('svg').innerHTML = '<path d="M7 5v14l12-7z"/>'; }
        night.addEventListener('click', function () { var on = api.toggleNight(); night.setAttribute('aria-pressed', String(on)); label(night, on ? 'Day' : 'Night'); });
        play.addEventListener('click', function () {
          var on = api.togglePlay(); play.setAttribute('aria-pressed', String(on)); label(play, on ? 'Pause' : 'Play');
          play.querySelector('svg').innerHTML = on ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>' : '<path d="M7 5v14l12-7z"/>';
        });
        $('#s3-zoom-in').addEventListener('click', function () { api.zoom(0.8); });
        $('#s3-zoom-out').addEventListener('click', function () { api.zoom(1.22); });
        $('#s3-reset').addEventListener('click', function () { api.reset(); });
        if (touch) {
          act.hidden = false;
          act.addEventListener('click', function () {
            var on = act.getAttribute('aria-pressed') !== 'true';
            act.setAttribute('aria-pressed', String(on)); act.textContent = on ? 'Done exploring' : 'Tap to explore in 3D';
            api.setInteractive(on); root.classList.toggle('exploring', on);
            if (on) api.zoom(0.72); else api.reset();
          });
        }
      }).catch(function (err) { if (window.console) console.warn('3D store unavailable', err); root.classList.add('no-3d'); });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '500px 0px' });
      io.observe(root);
    } else start();
  })();

  $('#year').textContent = new Date().getFullYear();
  renderRooms(); renderCats(); renderGrid(); renderKits(); save();
})();
