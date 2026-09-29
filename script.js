// ============================================================
// SOHN PATRA — interactions
// ============================================================

(function () {
  'use strict';

  // Tells the head script we arrived, so it keeps the motion layer on.
  window.SP_MOTION = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- VIDEO HERO ---------------- */
  var heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    }
    // <source media> is only evaluated on load, so re-pick the cut when a device rotates.
    window.matchMedia('(orientation: portrait)').addEventListener('change', function () {
      heroVideo.load();
    });
  }

  /* ---------------- EDIT FILM ---------------- */
  var editFilm = document.getElementById('editFilm');
  if (editFilm) {
    if (reduceMotion) {
      // No autoplay; the visitor can start it themselves.
      editFilm.controls = true;
      editFilm.preload = 'metadata';
    } else if ('IntersectionObserver' in window) {
      // Loads on approach and only runs while it's on screen.
      editFilm.muted = true;
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          var playing = editFilm.play();
          if (playing && playing.catch) playing.catch(function () {});
        } else {
          editFilm.pause();
        }
      }, { rootMargin: '300px 0px' }).observe(editFilm);
    }
  }

  /* ---------------- NAV ---------------- */
  var nav = document.getElementById('siteNav');
  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');

  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------------- SCROLL CHOREOGRAPHY ----------------
     Type and imagery arrive as they enter view; a few set pieces (hero exit,
     arch unveil, lit statement, flavour ribbon) are scrubbed to the scroll. */
  var root = document.documentElement;
  var motion = root.classList.contains('motion') && !reduceMotion && 'IntersectionObserver' in window;

  if (motion) {
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var q = function (sel) { return document.querySelector(sel); };
    var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };

    // Wrap every word in its own span, leaving <br> and script accents intact. Returns the word count.
    var splitWords = function (el, masked) {
      var count = 0;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            // Split on ordinary whitespace only, so &nbsp; keeps its words together.
            child.nodeValue.split(/([ \t\n\r]+)/).forEach(function (part) {
              if (!part) return;
              if (!/[^ \t\n\r]/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var word = document.createElement('span');
              word.textContent = part;
              if (masked) {
                word.style.setProperty('--i', count);
                var mask = document.createElement('span');
                mask.className = 'w';
                mask.appendChild(word);
                frag.appendChild(mask);
              } else {
                word.className = 'sw';
                frag.appendChild(word);
              }
              count++;
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.classList.contains('swash')) {
            child.style.setProperty('--i', count++);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      };
      walk(el);
      return count;
    };

    // Cards animate as one unit, so their children are left to the card.
    var tag = function (sel, cls) {
      each(sel, function (el) {
        var card = el.closest('.a-cascade');
        if (!card || card === el) el.classList.add(cls);
      });
    };
    tag('.product, .tier, .journal-card', 'a-cascade');
    tag('#main h2:not(.statement-title), #main h3, .video-hero-caption p, .video-hero-tag', 'a-split');
    tag('.kicker', 'a-track');
    tag('.lede, .flavour-caption, .pricing-line .pl-item, .bespoke-list li, #bespoke .link, .contact-list li, .icon-item, .form, .footer-col, .footer-copy, .footer-hallmarks li, .video-hero-desc, .video-hero-scroll', 'a-rise');
    tag('.bespoke-media, .gallery-strip img', 'a-unveil');
    tag('.flavour-stage, .collage-inset, .video-hero-mark', 'a-pop');
    tag('.collage-arch', 'a-unveil');
    tag('.collage-note', 'a-rise');
    tag('.mission-copy .sign, .footer-tagline', 'a-ink');
    tag('.footer-mark', 'a-stamp');

    each('.video-hero .a-split', function (el) { el.classList.add('soft'); });
    each('.a-split', function (el) { el.dataset.words = splitWords(el, true); });
    each('.a-cascade', function (card) {
      Array.prototype.forEach.call(card.children, function (child, i) { child.style.setProperty('--n', i); });
    });

    var hero = document.getElementById('top');
    var ANIMATED = '.a-split, .a-track, .a-rise, .a-unveil, .a-pop, .a-ink, .a-cascade, .a-stamp';
    // Whatever arrives together is sequenced, so a heading lands before its paragraph.
    var reveal = function (batch) {
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      var t = 0;
      batch.forEach(function (el) {
        var base = hero && hero.contains(el) ? 450 : 0;
        el.style.setProperty('--d', base + Math.min(t, 1200) + 'ms');
        el.classList.add('in');
        io.unobserve(el);
        t += el.classList.contains('a-split') ? 80 + Math.min(+el.dataset.words, 10) * 40 : 120;
      });
    };
    var io = new IntersectionObserver(function (entries) {
      var batch = [];
      entries.forEach(function (entry) { if (entry.isIntersecting) batch.push(entry.target); });
      reveal(batch);
    }, { rootMargin: '0px 0px -8% 0px' });
    each(ANIMATED, function (el) { io.observe(el); });
    // The last few lines of the page can never cross the trigger line, so release them at the end.
    var sweepEnd = function () {
      var batch = [];
      each(ANIMATED, function (el) {
        if (!el.classList.contains('in') && el.getBoundingClientRect().top < window.innerHeight) batch.push(el);
      });
      reveal(batch);
    };

    /* ---- scrubbed set pieces ---- */
    var progress = q('.nav-progress');
    var heroShade = q('.video-hero-shade');
    var heroCaption = q('.video-hero-caption');
    var heroContent = q('.video-hero-content');
    var heroCue = q('.video-hero-scroll');
    var banner = q('.edit-film');
    var bannerImg = banner && banner.querySelector('video');
    var collage = q('.collage');
    var tiles = collage ? collage.querySelectorAll('figure') : [];
    var bespoke = q('.bespoke-media');
    var bespokeImg = bespoke && bespoke.querySelector('img');
    var statement = q('.statement');
    var statWords = [];
    var statSwash = null;
    var statBg = q('.statement-bg');
    var statGlow = q('.statement-glow');
    var statBtn = statement && statement.querySelector('.btn-outline');
    if (statement) {
      var statTitle = statement.querySelector('.statement-title');
      splitWords(statTitle, false);
      statWords = statTitle.querySelectorAll('.sw');
      statSwash = statTitle.querySelector('.swash');
    }
    var marquee = q('#marquee');
    var marqueeOn = false;
    var rows = [];
    each('#marquee .marquee-track', function (track, i) {
      // The fine line drifts right, the grand names drift left.
      rows.push({ track: track, x: 0, w: 0, origin: 0, names: [], dir: i === 0 ? 1 : -1, speed: i === 0 ? 0.03 : 0.045 });
    });

    var vw = 0;
    var vh = 0;
    var maxScroll = 1;
    var geo = {};
    var docTop = function (el) { return el.getBoundingClientRect().top + window.scrollY; };

    var measure = function () {
      vw = root.clientWidth;
      vh = window.innerHeight;
      maxScroll = Math.max(1, root.scrollHeight - vh);
      if (hero) geo.heroH = hero.offsetHeight;
      if (banner) { geo.bTop = docTop(banner); geo.bH = banner.offsetHeight; geo.bW = banner.offsetWidth; geo.bLast = -1; }
      if (collage) { geo.cTop = docTop(collage); geo.cH = collage.offsetHeight; }
      if (bespoke) { geo.eTop = docTop(bespoke); geo.eH = bespoke.offsetHeight; }
      if (statement) { geo.sTop = docTop(statement); geo.sH = statement.offsetHeight; }
      rows.forEach(function (r) {
        var copy = r.track.firstElementChild;
        if (!copy.offsetWidth) return;
        // Each copy must be wider than the screen, or the loop would show a gap.
        var grew = false;
        while (copy.offsetWidth < vw + 200) { copy.innerHTML += copy.innerHTML; grew = true; }
        if (r.track.children.length < 2 || grew) {
          if (r.track.children[1]) r.track.removeChild(r.track.children[1]);
          r.track.appendChild(copy.cloneNode(true));
        }
        r.w = copy.offsetWidth;
        var box = r.track.getBoundingClientRect();
        r.origin = box.left - r.x;
        r.names = Array.prototype.map.call(r.track.querySelectorAll('.mq-name'), function (el) {
          var b = el.getBoundingClientRect();
          return { el: el, c: b.left - box.left + b.width / 2 };
        });
      });
    };

    var render = function (y, dy, dt) {
      if (progress) progress.style.transform = 'scaleX(' + clamp(y / maxScroll).toFixed(4) + ')';

      // Hero: the film sinks and dims while its captions lift away.
      if (hero && heroVideo && y < geo.heroH * 1.2) {
        var hp = clamp(y / geo.heroH);
        heroVideo.style.transform = 'translate3d(0,' + (hp * geo.heroH * 0.35).toFixed(1) + 'px,0) scale(' + (1 + hp * 0.12).toFixed(4) + ')';
        heroShade.style.opacity = (hp * 0.9).toFixed(3);
        heroCaption.style.transform = 'translate3d(0,' + (-hp * geo.heroH * 0.22).toFixed(1) + 'px,0)';
        heroCaption.style.opacity = clamp(1 - hp * 2.4).toFixed(3);
        heroContent.style.transform = 'translate3d(0,' + (-hp * geo.heroH * 0.14).toFixed(1) + 'px,0)';
        heroContent.style.opacity = clamp(1 - hp * 2).toFixed(3);
        heroCue.style.opacity = (0.8 * clamp(1 - hp * 6)).toFixed(3);
      }

      // The Edit film opens from a Mughal arch to full bleed.
      if (banner) {
        var bp = clamp((y + vh - geo.bTop) / (vh * 0.55 + geo.bH * 0.5));
        if (bp !== geo.bLast) {
          geo.bLast = bp;
          var e = 1 - Math.pow(1 - bp, 3);
          // Snap the last sliver open so no hairline of page shows at the screen edges.
          if (e > 0.995) e = 1;
          var inv = 1 - e;
          var side = inv * geo.bW * 0.2;
          var top = inv * geo.bH * 0.1;
          var r = (geo.bW - 2 * side) / 2 * inv;
          banner.style.clipPath = e === 1 ? 'none' : 'inset(' + top.toFixed(1) + 'px ' + side.toFixed(1) + 'px 0px round ' + r.toFixed(1) + 'px ' + r.toFixed(1) + 'px 0px 0px)';
          if (bannerImg) bannerImg.style.scale = (1.2 - 0.2 * e).toFixed(4);
        }
      }

      // Collage and atelier photographs drift at different depths.
      if (tiles.length === 2) {
        var cp = (y + vh - geo.cTop) / (vh + geo.cH);
        if (cp > -0.2 && cp < 1.2) {
          var c = cp * 2 - 1;
          tiles[0].style.translate = '0 ' + (c * -12).toFixed(1) + 'px';
          tiles[1].style.translate = '0 ' + (c * -46).toFixed(1) + 'px';
        }
      }
      if (bespokeImg) {
        var ep = (y + vh - geo.eTop) / (vh + geo.eH);
        if (ep > -0.2 && ep < 1.2) bespokeImg.style.translate = '0 ' + ((ep * 2 - 1) * -geo.eH * 0.045).toFixed(1) + 'px';
      }

      // Statement: pinned while each word lights, then "quiet luxury." is written in gold.
      if (statWords.length) {
        var sp = (y - geo.sTop) / Math.max(1, geo.sH - vh);
        if (sp > -1.2 && sp < 1.4) {
          var n = statWords.length;
          var lit = clamp((sp + 0.1) / 0.62) * (n + 1.4);
          for (var i = 0; i < n; i++) statWords[i].style.opacity = (0.14 + 0.86 * clamp(lit - i)).toFixed(3);
          if (statSwash) {
            var ink = clamp((lit - n) / 1.2);
            var pos = ((1 - ink) * 100).toFixed(2) + '% 0';
            statSwash.style.webkitMaskPosition = pos;
            statSwash.style.maskPosition = pos;
            statSwash.classList.toggle('glint', ink >= 1);
          }
          if (statBg) statBg.style.transform = 'scale(' + (1.22 - 0.22 * clamp(sp)).toFixed(4) + ')';
          if (statGlow) statGlow.style.opacity = clamp(lit / (n + 1.4)).toFixed(3);
          if (statBtn) statBtn.classList.toggle('show', sp > 0.6);
        }
      }

      // Flavour ribbon: a slow drift that scrolling pushes along (or back);
      // whichever name passes the centre catches the light.
      if (marqueeOn) {
        rows.forEach(function (row) {
          if (!row.w) return;
          row.x += row.dir * (row.speed * dt + dy * 0.5);
          row.x = ((row.x % row.w) + row.w) % row.w - row.w;
          row.track.style.transform = 'translate3d(' + row.x.toFixed(2) + 'px,0,0)';
          var mid = vw / 2;
          var reach = vw * 0.34;
          row.names.forEach(function (nm) {
            var d = Math.abs(row.origin + row.x + nm.c - mid) / reach;
            var s = d >= 1 ? 0 : 1 - d;
            nm.el.style.opacity = (0.16 + 0.84 * s * s * (3 - 2 * s)).toFixed(3);
          });
        });
      }
    };

    // One rAF loop, eased toward the real scroll position for a softer glide.
    var smoothY = window.scrollY;
    var lastT = 0;
    var running = false;
    var frame = function (now) {
      var dt = lastT ? Math.min(now - lastT, 50) : 16.7;
      lastT = now;
      var y = window.scrollY;
      var prev = smoothY;
      smoothY += (y - smoothY) * (1 - Math.pow(0.82, dt / 16.7));
      if (Math.abs(y - smoothY) < 0.25) smoothY = y;
      render(smoothY, smoothY - prev, dt);
      if (y >= maxScroll - 2) sweepEnd();
      if (smoothY !== y || marqueeOn) requestAnimationFrame(frame);
      else { running = false; lastT = 0; }
    };
    var kick = function () {
      if (!running) { running = true; requestAnimationFrame(frame); }
    };
    var remeasure = function () { measure(); kick(); };

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
    if (document.fonts) document.fonts.ready.then(remeasure);
    if (marquee) {
      new IntersectionObserver(function (entries) {
        marqueeOn = entries[0].isIntersecting;
        if (marqueeOn) kick();
      }).observe(marquee);
    }

    measure();
    render(smoothY, 0, 16.7);
    root.classList.add('ready');
  }

  /* ---------------- FLAVOUR CYCLE ---------------- */
  var cycle = document.getElementById('flavourCycle');
  if (cycle && !reduceMotion) {
    var plates = cycle.querySelectorAll('.flavour-stage img');
    var nameEl = document.getElementById('flavourName');
    var current = 0;
    var timer = null;
    var hovered = false;
    var onscreen = false;

    var schedule = function () {
      clearTimeout(timer);
      if (!hovered && onscreen && !document.hidden) timer = setTimeout(advance, 2000);
    };

    var advance = function () {
      var next = (current + 1) % plates.length;
      var wait = new Promise(function (resolve) { setTimeout(resolve, 1500); });
      Promise.race([plates[next].decode(), wait]).catch(function () {}).then(function () {
        if (hovered || !onscreen || document.hidden) return;
        serve(next);
      });
    };

    var serve = function (next) {
      var prev = plates[current];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      setTimeout(function () { prev.classList.remove('is-leaving'); }, 1400);
      plates[next].classList.add('is-active');
      current = next;
      nameEl.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)' }],
        { duration: 350, easing: 'ease-in', fill: 'forwards' }
      ).onfinish = function () {
        nameEl.textContent = plates[current].dataset.name;
        nameEl.animate(
          [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }],
          { duration: 600, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' }
        );
      };
      schedule();
    };

    // Hover-pause only on devices that can hover; on touch a tap would otherwise freeze it.
    if (window.matchMedia('(hover: hover)').matches) {
      cycle.addEventListener('mouseenter', function () { hovered = true; schedule(); });
      cycle.addEventListener('mouseleave', function () { hovered = false; schedule(); });
    }

    new IntersectionObserver(function (entries) {
      onscreen = entries[0].isIntersecting;
      schedule();
    }).observe(cycle);

    // Hidden tabs keep timers running but freeze animations, which would desync plate and name.
    document.addEventListener('visibilitychange', schedule);
  }

  /* ---------------- ENQUIRY FORM (mailto) ---------------- */
  var form = document.getElementById('enquiryForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var occasion = form.occasion.value;
    var message = form.message.value.trim();
    var subject = encodeURIComponent('Gold Experience Enquiry — ' + occasion);
    var body = encodeURIComponent(
      'Name: ' + name + '\nOccasion: ' + occasion + '\n\n' + message
    );
    window.location.href = 'mailto:arushi@sohnpatra.com?subject=' + subject + '&body=' + body;
  });

})();
