(function () {
  'use strict';
  var S = window.LGStore;
  var $ = function (s) { return document.querySelector(s); };
  var params = new URLSearchParams(location.search);
  var from = params.get('from') === 'b' ? 'b' : 'a';
  var LIST_KEY = from === 'b' ? 'lgb-list' : 'leadsgate-list-v2';
  var SHOP = from === 'b' ? 'b/' : './';
  $('#back-link').href = SHOP; $('#edit-list').href = SHOP; $('#done-back').href = SHOP; $('#empty-back').href = SHOP;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var toastT;
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2200); }

  var list = {};
  try { list = JSON.parse(localStorage.getItem(LIST_KEY) || '{}') || {}; } catch (e) {}
  var ref = S.newRef(), quote;

  function render() {
    quote = S.quote(list);
    var box = $('#lines');
    $('#empty-co').hidden = !!quote.lines.length; $('#co-form').hidden = !quote.lines.length; $('.steps').hidden = !quote.lines.length;
    if (!quote.lines.length) {
      box.innerHTML = '<p class="empty-list">Your list is empty. Add essentials in the shop first.</p>';
    } else {
      box.innerHTML = quote.lines.map(function (l) {
        var bad = l.price == null || l.stock < l.qty;
        return '<div class="line' + (bad ? ' bad' : '') + '"><img src="' + esc(l.image) + '" alt=""><div><strong>' + esc(l.name) + '</strong><small>' +
          (l.price == null ? 'No price yet' : l.stock < l.qty ? (l.stock ? 'Only ' + l.stock + ' in stock' : 'Out of stock') : l.qty + ' × ' + S.money(l.price) + ' <em>(demo price)</em>') +
          '</small></div><span class="amt">' + (l.price == null ? '—' : S.money(l.sub)) + '</span></div>';
      }).join('') + '<div class="total-row"><span>Total</span><span>' + S.money(quote.total) + '</span></div>';
    }
    var pr = $('#problems');
    pr.hidden = !quote.problems.length; pr.textContent = quote.problems.length ? quote.problems.join('. ') + '. Update your list before paying.' : '';
    var st = S.settingsSync();
    $('#pay-amount').textContent = S.money(quote.total);
    $('#momo-number').textContent = st.momoNumber || 'To be confirmed';
    $('#momo-name').innerHTML = st.momoName ? esc(st.momoName) : '<span class="tbc">To be confirmed by LeadsGate</span>';
    $('#momo-network').textContent = st.momoNetwork || 'MoMo';
    $('#pay-ref').textContent = ref;
    $('#paid').value = (quote.total / 100).toFixed(2);
    $('#submit').disabled = !quote.lines.length || !!quote.problems.length;
  }
  render();

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var v = $('#' + b.getAttribute('data-copy')).textContent.trim();
    try { navigator.clipboard.writeText(v).then(function () { toast('Copied ' + v); }); } catch (err) { toast(v); }
  });
  document.querySelectorAll('input[name=fulfil]').forEach(function (r) { r.addEventListener('change', function () { $('#area-f').hidden = $('input[name=fulfil]:checked').value !== 'delivery'; }); });

  /* proof upload: images only, max 8 MB, re-encoded in the browser so metadata (like GPS) is dropped */
  var proof = null;
  function setFile(f) {
    if (!f) return;
    if (['image/png', 'image/jpeg', 'image/webp'].indexOf(f.type) < 0) { showErr('Upload a PNG, JPG or WebP screenshot.'); return; }
    if (f.size > 8 * 1024 * 1024) { showErr('That file is over 8 MB. Take a screenshot instead of a photo of the screen.'); return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var max = 1400, k = Math.min(1, max / Math.max(img.width, img.height));
      var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      var data = c.toDataURL('image/jpeg', 0.72);
      proof = { dataUrl: data, name: f.name, size: Math.round(data.length * 0.75) };
      $('#proof-img').src = data; $('#proof-name').textContent = f.name;
      $('#proof-size').textContent = Math.round(proof.size / 1024) + ' KB after compression';
      $('#drop-empty').hidden = true; $('#drop-full').hidden = false; showErr('');
    };
    img.onerror = function () { URL.revokeObjectURL(url); showErr('We couldn’t read that image. Try another screenshot.'); };
    img.src = url;
  }
  $('#proof').addEventListener('change', function (e) { setFile(e.target.files[0]); });
  var drop = $('#drop');
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });

  function showErr(m) { var e = $('#form-err'); e.hidden = !m; e.textContent = m; }
  function mark(id, bad) { $(id).setAttribute('aria-invalid', bad ? 'true' : 'false'); }

  $('#co-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errs = [];
    var name = $('#name').value.trim(); mark('#name', name.length < 2); if (name.length < 2) errs.push('your name');
    mark('#phone', !S.validPhone($('#phone').value)); if (!S.validPhone($('#phone').value)) errs.push('a valid phone number');
    var del = $('input[name=fulfil]:checked').value === 'delivery';
    mark('#area', del && !$('#area').value.trim()); if (del && !$('#area').value.trim()) errs.push('your delivery area');
    mark('#payer', !S.validPhone($('#payer').value)); if (!S.validPhone($('#payer').value)) errs.push('the MoMo number you paid from');
    var txOk = /^[A-Za-z0-9.\-]{6,30}$/.test($('#txn').value.replace(/\s/g, '')); mark('#txn', !txOk); if (!txOk) errs.push('the transaction ID');
    var paid = Math.round(Number($('#paid').value) * 100); mark('#paid', !(paid > 0)); if (!(paid > 0)) errs.push('the amount you sent');
    if (!proof) errs.push('a screenshot of your payment');
    var agree = $('#agree').checked;
    if (errs.length || !agree) { showErr((errs.length ? 'Please add ' + errs.join(', ') + '.' : '') + (agree ? '' : (errs.length ? ' Then tick' : 'Please tick') + ' the confirmation box.')); var first = document.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
    if (paid !== quote.total) { showErr('The amount you sent (' + S.money(paid) + ') doesn’t match the total (' + S.money(quote.total) + '). Send the exact amount, or call us.'); $('#paid').focus(); return; }
    var btn = $('#submit'); btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      var r = await S.createOrder({ ref: ref, list: list, name: name, phone: $('#phone').value, email: $('#email').value, fulfil: del ? 'delivery' : 'collect', area: $('#area').value, note: $('#note').value,
        network: S.settingsSync().momoNetwork, payerNumber: $('#payer').value, payerName: $('#payer-name').value, txnId: $('#txn').value, amountPaid: $('#paid').value, proof: proof });
      try { localStorage.removeItem(LIST_KEY); } catch (err) {}
      $('#checkout-view').hidden = true; $('#done-view').hidden = false; $('#done-ref').textContent = r.ref;
      $('#t-ref').value = r.ref; $('#t-phone').value = $('#phone').value;
      $('#done-view').focus(); window.scrollTo(0, 0);
    } catch (err) {
      showErr(err.message); btn.disabled = false; btn.textContent = 'Submit order and proof'; render();
    }
  });

  var LABEL = { awaiting: 'Checking payment', approved: 'Payment confirmed', ready: 'Ready for collection or delivery', completed: 'Completed', rejected: 'Payment not confirmed', refunded: 'Refunded' };
  $('#track-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var o = await S.orderStatus($('#t-ref').value, $('#t-phone').value), out = $('#track-out');
    if (!o) { out.textContent = 'We couldn’t find an order with that reference and phone number.'; return; }
    out.innerHTML = '<p><strong>' + esc(o.id) + '</strong> · <span class="status st-' + o.status + '">' + LABEL[o.status] + '</span></p><p>' + o.items.map(function (i) { return esc(i.name) + ' × ' + i.qty; }).join(', ') + ' · ' + S.money(o.total) + '</p>' + (o.reason ? '<p><strong>Reason:</strong> ' + esc(o.reason) + '</p>' : '');
  });
})();
