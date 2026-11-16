/* Found Again · site behavior
   - Guestbook: asks for a first and last name, remembers it in this browser.
   - Episodes: built from assets/config.js.
   - Logging: every sign-in, visit, download and "read in browser" is sent to the
     Google Sheet through the Apps Script web app named in config.js.
   - Lightbox: shows pages from the books. */
(function () {
  'use strict';

  var CFG = window.FOUND_AGAIN_CONFIG || {};
  var STORE_KEY = 'foundAgain.visitor';
  var SESSION_KEY = 'foundAgain.visitLogged';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  /* ---------- remembered visitor ---------- */
  function loadVisitor() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveVisitor(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) {} }
  function forgetVisitor() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  var visitor = loadVisitor();
  if (visitor && !(visitor.first && visitor.last)) visitor = null;

  /* ---------- logging to the Google Sheet ---------- */
  function deviceLabel() {
    var ua = navigator.userAgent || '';
    var os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android'
      : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'Chromebook' : 'Other';
    var browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
      : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
    return os + ' · ' + browser;
  }

  function log(action, episode) {
    if (!visitor) return;
    var payload = {
      key: CFG.siteKey || '',
      first: visitor.first,
      last: visitor.last,
      action: action,
      episode: episode || '',
      visitorId: visitor.id || '',
      device: deviceLabel()
    };
    if (!CFG.logUrl) {
      if (window.console) console.info('[Found Again] logUrl is empty, so this was not sent:', payload);
      return;
    }
    try {
      // no-cors + a plain-text body avoids a CORS preflight, which Apps Script cannot answer.
      // keepalive lets the request finish even if the page is left right away.
      fetch(CFG.logUrl, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify(payload) })
        ['catch'](function () {});
    } catch (e) { /* logging must never break the page */ }
  }

  function logVisitOnce() {
    var done = false;
    try { done = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) {}
    if (done) return;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
    log('visit');
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function tidy(s) { return (s || '').replace(/\s+/g, ' ').trim().slice(0, 60); }
  function makeId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

  /* ---------- guestbook ---------- */
  var formWrap = $('#guestbook-form-wrap');
  var welcomeWrap = $('#guestbook-welcome');
  var form = $('#guestbook-form');
  var formError = $('#form-error');
  var formHint = $('#form-hint');
  var pendingLink = null;

  function renderGuestbook() {
    var signedIn = !!visitor;
    formWrap.hidden = signedIn;
    welcomeWrap.hidden = !signedIn;
    document.body.classList.toggle('is-signed-in', signedIn);
    if (signedIn) $('#welcome-name').textContent = visitor.first;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = tidy(form.elements.first.value);
    var last = tidy(form.elements.last.value);
    if (!first || !last) {
      formError.hidden = false;
      (first ? form.elements.last : form.elements.first).focus();
      return;
    }
    formError.hidden = true;
    formHint.hidden = true;
    visitor = { first: first, last: last, id: makeId(), since: new Date().toISOString() };
    saveVisitor(visitor);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (err) {}
    log('sign-in');
    renderGuestbook();
    $('#guestbook').classList.remove('guestbook--nudge');
    if (pendingLink) {              // they clicked a download first; start it now
      var link = pendingLink;
      pendingLink = null;
      link.click();
    }
  });

  $('#change-name').addEventListener('click', function () {
    forgetVisitor();
    visitor = null;
    form.reset();
    renderGuestbook();
    form.elements.first.focus();
  });

  function nudgeGuestbook() {
    var gb = $('#guestbook');
    gb.classList.add('guestbook--nudge');
    formHint.textContent = 'Please sign the guestbook first. Your download will start as soon as you press Continue.';
    formHint.hidden = false;
    gb.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () {
      try { form.elements.first.focus({ preventScroll: true }); } catch (err) { form.elements.first.focus(); }
    }, 450);
  }

  /* ---------- episodes ---------- */
  function renderEpisodes() {
    var list = $('#episode-list');
    var eps = CFG.episodes || [];
    if (!eps.length) { list.innerHTML = '<p class="muted">No episodes are published yet.</p>'; return; }
    list.innerHTML = eps.map(function (ep, i) {
      var gallery = (ep.gallery || []).map(function (g, j) {
        return '<button type="button" class="gallery__item" data-ep-index="' + i + '" data-page-index="' + j + '"' +
          ' aria-label="Open: ' + esc(g.caption) + '">' +
          '<img src="' + esc(g.thumb || g.src) + '" alt="' + esc(g.caption) + '" loading="lazy"></button>';
      }).join('');
      var attrs = ' data-episode="' + esc(ep.number) + '" data-title="' + esc(ep.title) + '"';
      return '<article class="card episode" id="episode-' + esc(ep.number) + '">' +
        '<div class="episode__cover"><img src="' + esc(ep.cover) + '" alt="Cover of Episode ' + esc(ep.number) + ', ' + esc(ep.title) + '"></div>' +
        '<div class="episode__body">' +
          '<p class="eyebrow">Episode ' + esc(ep.number) + (ep.pages ? ' · ' + esc(ep.pages) + ' pages' : '') + '</p>' +
          '<h3 class="episode__title">' + esc(ep.title) + '</h3>' +
          (ep.subtitle ? '<p class="episode__setting">' + esc(ep.subtitle) + '</p>' : '') +
          (ep.blurb ? '<p class="episode__blurb">' + esc(ep.blurb) + '</p>' : '') +
          '<div class="episode__actions">' +
            '<a class="btn btn--primary" href="' + esc(ep.file) + '" download="' + esc(ep.downloadName || '') + '"' + attrs + ' data-action="download">' +
              'Download the PDF' + (ep.fileSize ? ' <span class="btn__meta">' + esc(ep.fileSize) + '</span>' : '') + '</a>' +
            '<a class="btn btn--ghost" href="' + esc(ep.file) + '" target="_blank" rel="noopener"' + attrs + ' data-action="open">Read in your browser</a>' +
          '</div>' +
          '<p class="episode__lock">Sign the guestbook first and the download will start.</p>' +
          (gallery ? '<div class="gallery" aria-label="Pages from Episode ' + esc(ep.number) + '">' + gallery + '</div>' : '') +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderComing() {
    var items = CFG.comingNext || [];
    var section = $('#coming');
    if (!items.length) { section.hidden = true; return; }
    $('#coming-list').innerHTML = items.map(function (c) {
      return '<div class="card coming__item">' +
        '<p class="eyebrow">Episode ' + esc(c.number) + '</p>' +
        '<h3>' + esc(c.title) + '</h3>' +
        (c.subtitle ? '<p class="episode__setting">' + esc(c.subtitle) + '</p>' : '') +
        (c.status ? '<p class="pill">' + esc(c.status) + '</p>' : '') +
      '</div>';
    }).join('');
  }

  // Download / read clicks: gate on the guestbook, then log.
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-episode]') : null;
    if (!a) return;
    if (!visitor) {
      e.preventDefault();
      pendingLink = a;
      nudgeGuestbook();
      return;
    }
    log(a.getAttribute('data-action') || 'download', 'Ep ' + a.getAttribute('data-episode') + ' · ' + a.getAttribute('data-title'));
  });

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox');
  var lbImg = $('#lightbox-img');
  var lbCap = $('#lightbox-cap');
  var lbCount = $('#lightbox-count');
  var lbEp = 0, lbIdx = 0;

  function showLightboxPage() {
    var g = (CFG.episodes[lbEp] && CFG.episodes[lbEp].gallery) || [];
    var item = g[lbIdx];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.caption || '';
    lbCap.textContent = item.caption || '';
    lbCount.textContent = (lbIdx + 1) + ' / ' + g.length;
  }
  function openLightbox(epIndex, pageIndex) {
    lbEp = epIndex; lbIdx = pageIndex;
    showLightboxPage();
    if (typeof lb.showModal === 'function') { if (!lb.open) lb.showModal(); }
    else { lb.setAttribute('open', ''); }
  }
  function closeLightbox() {
    if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
  }
  function stepLightbox(d) {
    var g = (CFG.episodes[lbEp] && CFG.episodes[lbEp].gallery) || [];
    if (!g.length) return;
    lbIdx = (lbIdx + d + g.length) % g.length;
    showLightboxPage();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.gallery__item') : null;
    if (b) openLightbox(+b.getAttribute('data-ep-index'), +b.getAttribute('data-page-index'));
  });
  $('#lightbox-close').addEventListener('click', closeLightbox);
  $('#lightbox-prev').addEventListener('click', function () { stepLightbox(-1); });
  $('#lightbox-next').addEventListener('click', function () { stepLightbox(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.open) return;
    if (e.key === 'ArrowRight') stepLightbox(1);
    if (e.key === 'ArrowLeft') stepLightbox(-1);
  });

  /* ---------- start ---------- */
  renderGuestbook();
  renderEpisodes();
  renderComing();
  $('#year').textContent = String(new Date().getFullYear());
  if (visitor) logVisitOnce();
})();
