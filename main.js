/* ============================================================
   Digi'Tran — main.js
   Interactions & animations, 100 % vanilla (zéro dépendance).
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Préloader ---------- */
  var preloader = document.getElementById('preloader');
  var preloaderDone = false;

  function finishPreloader() {
    if (preloaderDone) return;
    preloaderDone = true;
    document.body.classList.add('is-loaded');
    if (preloader) {
      preloader.classList.add('done');
      setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 900);
    }
    initReveals();
    startWordSwap();
  }

  if (reduced || !preloader) {
    finishPreloader();
  } else {
    window.addEventListener('load', function () { setTimeout(finishPreloader, 1450); });
    setTimeout(finishPreloader, 3500); // garde-fou si le chargement traîne
  }

  /* ---------- Apparitions au scroll ---------- */
  var revealsInited = false;

  function initReveals() {
    if (revealsInited) return;
    revealsInited = true;

    var items = document.querySelectorAll('.reveal');
    var nums = document.querySelectorAll('.num');

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      nums.forEach(function (el) { animateCount(el, true); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });

    var ioNum = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target, false);
          ioNum.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { ioNum.observe(el); });
  }

  /* ---------- Compteurs animés ---------- */
  function animateCount(el, instant) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';

    if (instant || reduced) {
      el.textContent = prefix + target + suffix;
      return;
    }

    var duration = 1500;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Mot rotatif du hero ---------- */
  var swapWords = [
    'vos copier-coller',
    'vos saisies manuelles',
    'vos rapports du vendredi',
    'vos plannings Excel',
    "vos relances d'e-mails",
    'vos mises en page'
  ];

  function startWordSwap() {
    var el = document.getElementById('swap-word');
    if (!el || reduced) return;
    var i = 0;
    setInterval(function () {
      i = (i + 1) % swapWords.length;
      el.classList.add('swap-out');
      setTimeout(function () {
        el.textContent = swapWords[i];
        el.classList.remove('swap-out');
        el.classList.add('swap-prep');
        void el.offsetWidth; // force le reflow pour repartir du bas
        el.classList.remove('swap-prep');
      }, 430);
    }, 2700);
  }

  /* ---------- Header, barre de progression, ligne méthode ---------- */
  var header = document.getElementById('header');
  var progressBar = document.querySelector('.scroll-progress span');
  var methodProgress = document.getElementById('method-progress');
  var methodTrack = document.querySelector('.method-track');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;

    if (header) {
      header.classList.toggle('scrolled', y > 12);
      if (y > 220 && y > lastY + 6 && !docEl.classList.contains('menu-open')) {
        header.classList.add('hidden');
      } else if (y < lastY - 6 || y <= 220) {
        header.classList.remove('hidden');
      }
    }
    lastY = y;

    if (progressBar) {
      var max = docEl.scrollHeight - window.innerHeight;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }

    if (methodProgress && methodTrack) {
      var r = methodTrack.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      methodProgress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobile-menu');

  function closeMenu() {
    docEl.classList.remove('menu-open');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
    }
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true');
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = docEl.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- FAQ (accordéon) ---------- */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        var q = other.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Copier l'adresse e-mail ---------- */
  var copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    var originalLabel = copyBtn.textContent.trim();
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email') || '';
      var done = function () {
        copyBtn.textContent = 'Adresse copiée ✓';
        setTimeout(function () { copyBtn.textContent = originalLabel; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(function () { fallbackCopy(email, done); });
      } else {
        fallbackCopy(email, done);
      }
    });
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* tant pis */ }
    document.body.removeChild(ta);
    cb();
  }

  /* ---------- Parallaxe du hero ---------- */
  var heroVisual = document.querySelector('.hero-visual');
  var hero = document.querySelector('.hero');
  if (hero && heroVisual && finePointer && !reduced) {
    document.querySelectorAll('[data-depth]').forEach(function (el) {
      el.style.setProperty('--d', el.getAttribute('data-depth'));
    });

    var tx = 0, ty = 0, cx = 0, cy = 0, parallaxRaf = null;

    function parallaxLoop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      heroVisual.style.setProperty('--mx', cx.toFixed(4));
      heroVisual.style.setProperty('--my', cy.toFixed(4));
      if (Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008) {
        parallaxRaf = requestAnimationFrame(parallaxLoop);
      } else {
        parallaxRaf = null;
      }
    }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!parallaxRaf) parallaxLoop();
    });
  }

  /* ---------- Inclinaison des cartes ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -4.5;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 4.5;
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Boutons magnétiques ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.22;
        btn.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.translate = '0px 0px';
      });
    });
  }

  /* ---------- Curseur personnalisé ---------- */
  if (finePointer && !reduced) {
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      var mx = -100, my = -100, ringX = -100, ringY = -100, cursorStarted = false;

      var cursorLoop = function () {
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
        ringX += (mx - ringX) * 0.16;
        ringY += (my - ringY) * 0.16;
        ring.style.left = ringX.toFixed(1) + 'px';
        ring.style.top = ringY.toFixed(1) + 'px';
        requestAnimationFrame(cursorLoop);
      };

      document.addEventListener('mousemove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (!cursorStarted) {
          cursorStarted = true;
          ringX = mx;
          ringY = my;
          document.body.classList.add('cursor-on');
          cursorLoop();
        }
      });
      document.addEventListener('mouseleave', function () {
        document.body.classList.remove('cursor-on');
      });
      document.addEventListener('mouseenter', function () {
        if (cursorStarted) document.body.classList.add('cursor-on');
      });

      var hoverSelector = 'a, button, .tilt';
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest(hoverSelector)) document.body.classList.add('cursor-hover');
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest(hoverSelector)) document.body.classList.remove('cursor-hover');
      });
    }
  }
})();
