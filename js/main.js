/* Kosmetický salon K.F. – chování webu */
(function () {
  'use strict';

  /* ---------- mobilní menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.main-nav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }

  /* ---------- zvýraznění aktuální stránky ---------- */
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.main-nav a').forEach(function (a) {
    if ((a.getAttribute('href') || '').toLowerCase() === page) a.classList.add('active');
  });

  /* ---------- záložky ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = group.querySelectorAll('.tab');
    function show(id, updateHash) {
      var found = false;
      tabs.forEach(function (t) {
        var on = t.dataset.tab === id;
        if (on) found = true;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (!found) return false;
      group.parentNode.querySelectorAll('[data-panel]').forEach(function (p) {
        p.classList.toggle('active', p.dataset.panel === id);
      });
      if (updateHash && history.replaceState) history.replaceState(null, '', '#' + id);
      return true;
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.dataset.tab, true); });
    });
    var initial = location.hash.slice(1);
    if (!initial || !show(initial, false)) show(tabs[0].dataset.tab, false);
    window.addEventListener('hashchange', function () { show(location.hash.slice(1), false); });
  });

  /* ---------- galerie: filtr + lightbox ---------- */
  var gallery = document.querySelector('.gallery');
  if (gallery) {
    var items = Array.prototype.slice.call(gallery.querySelectorAll('button'));
    document.querySelectorAll('[data-filter]').forEach(function (f) {
      f.addEventListener('click', function () {
        document.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('active', x === f); });
        var cat = f.dataset.filter;
        items.forEach(function (b) { b.hidden = !(cat === 'vse' || b.dataset.cat === cat); });
      });
    });

    var lb = document.querySelector('.lightbox');
    var lbImg = lb.querySelector('img');
    var current = 0;
    function visible() { return items.filter(function (b) { return !b.hidden; }); }
    function open(btn) {
      var v = visible(); current = v.indexOf(btn);
      var img = btn.querySelector('img');
      lbImg.src = img.src; lbImg.alt = img.alt;
      lb.classList.add('open'); document.body.style.overflow = 'hidden';
    }
    function step(d) {
      var v = visible(); current = (current + d + v.length) % v.length;
      var img = v[current].querySelector('img'); lbImg.src = img.src; lbImg.alt = img.alt;
    }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    items.forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }

  /* ---------- mapa až po kliknutí (bez odesílání IP Googlu předem) ---------- */
  document.querySelectorAll(".map-load").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = btn.dataset.src; f.title = "Mapa – Tyršova 138, Klášterec nad Ohří";
      f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      btn.replaceWith(f);
    });
  });

  /* ---------- pruh recenzí: jede zleva doprava, jde chytit myší i prstem ---------- */
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.rs-track').forEach(function (track) {
    if (reduceMotion) return;
    Array.prototype.slice.call(track.children).forEach(function (card) {
      var c = card.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
    });
    var vp = track.parentElement;
    vp.classList.add('is-looping');
    var SPEED = 35; // px za sekundu
    var half = track.scrollWidth / 2, x = -half, vel = 0, last = 0;
    var hover = false, drag = null, moved = false;
    function wrap() { while (x >= 0) x -= half; while (x < -half) x += half; }
    window.addEventListener('resize', function () { half = track.scrollWidth / 2; wrap(); });
    function frame(t) {
      var dt = last ? Math.min((t - last) / 1000, .05) : 0;
      last = t;
      if (!drag) {
        if (Math.abs(vel) > 5) { x += vel * dt; vel *= Math.pow(.05, dt); }
        else { vel = 0; if (!hover) x += SPEED * dt; }
      }
      wrap();
      track.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    vp.addEventListener('mouseenter', function () { hover = true; });
    vp.addEventListener('mouseleave', function () { hover = false; });
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });
    vp.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.pointerType === 'mouse') e.preventDefault(); // jinak se začne označovat text
      drag = { id: e.pointerId, startX: e.clientX, lastX: e.clientX, lastT: e.timeStamp };
      moved = false; vel = 0;
    });
    vp.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.lastX;
      if (!moved && Math.abs(e.clientX - drag.startX) > 6) {
        moved = true;
        vp.classList.add('is-dragging');
        vp.setPointerCapture(e.pointerId);
      }
      if (moved) {
        vel = vel * .6 + (dx / Math.max(e.timeStamp - drag.lastT, 1) * 1000) * .4;
        x += dx;
      }
      drag.lastX = e.clientX; drag.lastT = e.timeStamp;
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      vp.classList.remove('is-dragging');
      if (e.type === 'pointercancel') vel = 0;
    }
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
  });

  /* ---------- rok v patičce ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
