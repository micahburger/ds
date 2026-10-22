/* ============================================================================
   DESIGN SYSTEM — portfolio patterns: featured project rotator, table index
   preview, text index,
   before/after, scroll-lit statement, cursor labels. Vanilla JS.
   Ideas from Semplice's Advanced Portfolio Grids, timings from this system.
   ============================================================================ */

(function () {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Pointer position, shared by the preview and the cursor pill ────── */
  let px = -9999, py = -9999;
  window.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });

  /* ── Featured project rotator ───────────────────────────────────────────
     Four frames: the brand logo, then three UI highlights, 2s each (the
     live homepage uses GIFs with hard cuts; here they cross-fade 400ms on
     the move curve). Each card starts on its logo when it scrolls in and
     stops when it leaves, so rows never run in lockstep. Reduced motion
     holds on the logo frame. */
  document.querySelectorAll('.fp-card').forEach(card => {
    const frames = [...card.querySelectorAll('img')];
    if (frames.length < 2 || RM) return;
    const HOLD = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--home-frame-hold')) || 2000;
    let i = 0, timer = null, inView = false;
    const show = n => { frames[i].classList.remove('is-on'); i = n; frames[i].classList.add('is-on'); };
    const start = () => { if (!timer) timer = setInterval(() => show((i + 1) % frames.length), HOLD); };
    const stop = () => { clearInterval(timer); timer = null; };
    // Warm the next frames so the first cut is not a blank.
    frames.forEach(f => { f.loading = 'eager'; });
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) { show(0); start(); } else stop();
    }, { threshold: 0.5 }).observe(card);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (inView) start(); });
  });

  /* ── Table index: row hover + lagging preview ──────────────────────── */
  const table = document.querySelector('.table-grid');
  const preview = document.querySelector('.tg-preview');
  if (table && preview && FINE) {
    const img = preview.querySelector('img');
    let on = false, x = -9999, y = -9999, raf = null;
    // 0.18 per frame reads as "follows" without feeling attached. With
    // reduced motion the preview sits exactly at the pointer instead.
    const EASE = RM ? 1 : 0.18;
    // Portrait 4:5 thumbnails, 240px wide: sit to the right of the
    // pointer and centered on it vertically.
    const OFFSET_X = 28, OFFSET_Y = -150;
    // Keep the whole thumbnail on screen near the top and bottom edges.
    const clampY = v => Math.max(16, Math.min(v, window.innerHeight - preview.offsetHeight - 16));
    function tick() {
      x += (px + OFFSET_X - x) * EASE;
      y += (clampY(py + OFFSET_Y) - y) * EASE;
      preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = on || Math.abs(px + OFFSET_X - x) > 0.5 ? requestAnimationFrame(tick) : null;
    }
    table.querySelectorAll('.tg-row').forEach(row => {
      const src = row.dataset.img;
      if (src) { const pre = new Image(); pre.src = src; } // warm the cache so the swap is instant
      row.addEventListener('pointerenter', () => {
        // A row without a thumbnail still fills, it just shows no preview.
        if (!src) { on = false; preview.classList.remove('is-on'); return; }
        if (!on) { x = px + OFFSET_X; y = clampY(py + OFFSET_Y); }
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        on = true;
        preview.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(tick);
      });
    });
    table.addEventListener('pointerleave', () => { on = false; preview.classList.remove('is-on'); });
  }

  /* ── Text index: dim the others, raise this one's screen ───────────── */
  const tgrid = document.querySelector('.text-grid');
  if (tgrid) {
    const imgs = tgrid.querySelectorAll('.txg-stage img');
    const links = tgrid.querySelectorAll('.txg-list a');
    const show = key => {
      tgrid.classList.toggle('is-hovering', key !== null);
      links.forEach(a => a.classList.toggle('is-on', a.dataset.key === key));
      imgs.forEach(i => i.classList.toggle('is-on', i.dataset.key === key));
    };
    links.forEach(a => {
      a.addEventListener('pointerenter', () => show(a.dataset.key));
      a.addEventListener('focus', () => show(a.dataset.key));
      a.addEventListener('blur', () => show(null));
    });
    tgrid.querySelector('.txg-list').addEventListener('pointerleave', () => show(null));
  }

  /* ── Gallery slider ────────────────────────────────────────────────── */
  document.querySelectorAll('.gallery-slider').forEach(root => {
    const stage = root.querySelector('.gs-stage');
    const track = root.querySelector('.gs-track');
    const slides = [...root.querySelectorAll('.gs-slide')];
    const caption = root.querySelector('.gs-caption');
    const count = root.querySelector('.gs-count');
    const bar = root.querySelector('.gs-progress');
    const n = slides.length;
    let index = 0, timer = null, inView = false, hovering = false, drag = null;
    const pad = v => String(v).padStart(2, '0');
    // Shortest signed distance on the ring, so slides wrap the short way.
    const rel = (i, at) => { let r = i - at; if (r * 2 > n) r -= n; if (r * 2 < -n) r += n; return r; };
    const timing = src => RM ? '120ms linear' : (src === 'auto' ? '700ms cubic-bezier(.65,0,.35,1)' : '400ms cubic-bezier(.32,.72,0,1)');

    // With an even count, the slide exactly half a ring away has no "short
    // way". Send it out on the side opposite travel (matters most for two
    // slides, where every move is that tie).
    function layout(src, first, dir = 1) {
      slides.forEach((s, i) => {
        let o = rel(i, index);
        if (n % 2 === 0 && Math.abs(o * 2) === n) o = -dir;
        const prev = Number(s.dataset.o ?? o);
        s.style.transition = (first || Math.abs(o - prev) > 1) ? 'none' : `transform ${timing(src)}`;
        s.style.setProperty('--o', o);
        s.dataset.o = o;
        s.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
      });
      caption.textContent = slides[index].dataset.caption;
      count.textContent = `${pad(index + 1)} / ${pad(n)}`;
    }
    function restartBar() {
      bar.classList.remove('is-running'); void bar.offsetWidth;
      if (!RM && inView && !hovering && !drag) bar.classList.add('is-running');
    }
    function schedule() {
      clearTimeout(timer);
      restartBar();
      if (RM || !inView || hovering || drag) return;
      timer = setTimeout(() => go(index + 1, 'auto'), 4200);
    }
    function go(i, src) {
      const dir = Math.sign(i - index) || 1;
      index = ((i % n) + n) % n;
      // Park the incoming slide on the side it should arrive from, without
      // a transition, so it always enters in the direction of travel.
      const incoming = slides[index];
      if (Number(incoming.dataset.o) !== dir) {
        incoming.style.transition = 'none';
        incoming.style.setProperty('--o', dir);
        incoming.dataset.o = dir;
        void incoming.offsetWidth;
      }
      layout(src, false, dir);
      schedule();
    }

    layout('auto', true);
    new IntersectionObserver(es => { inView = es[0].isIntersecting; schedule(); }, { threshold: 0.5 }).observe(root);
    root.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovering = true; schedule(); } });
    root.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    root.querySelectorAll('.gs-btn').forEach(b => b.addEventListener('click', () => go(index + Number(b.dataset.dir), 'manual')));
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, 'manual'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, 'manual'); }
    });

    stage.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, lastX: e.clientX, lastT: e.timeStamp, v: 0, dx: 0 };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
      track.style.transition = 'none';
      schedule();
      document.querySelector('.cursor-pill')?.classList.add('is-grabbing');
    });
    stage.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.v = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX; drag.lastT = e.timeStamp;
      const w = stage.offsetWidth;
      drag.dx = Math.max(-w, Math.min(w, e.clientX - drag.x0));
      track.style.setProperty('--drag', `${drag.dx}px`);
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const { dx, v } = drag;
      drag = null;
      stage.classList.remove('is-dragging');
      document.querySelector('.cursor-pill')?.classList.remove('is-grabbing');
      const far = Math.abs(dx) > stage.offsetWidth * 0.2;
      const flick = Math.abs(v) > 0.45 && Math.sign(v) === Math.sign(dx);
      track.style.transition = `transform ${timing('manual')}`;
      track.style.setProperty('--drag', '0px');
      if (dx !== 0 && (far || flick)) go(index + (dx < 0 ? 1 : -1), 'manual');
      else schedule();
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
  });

  /* ── Before and after ──────────────────────────────────────────────── */
  document.querySelectorAll('.compare').forEach(fig => {
    const range = fig.querySelector('.cmp-range');
    let dragging = false, downX = 0, settleTimer = null;
    const set = v => { fig.style.setProperty('--pos', `${v}%`); range.value = String(Math.round(v)); };
    const fromEvent = e => {
      const r = fig.getBoundingClientRect();
      return Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    };
    // The range input carries keyboard and screen reader support. Pointer
    // input is handled here so a drag tracks 1:1 and a click settles.
    range.addEventListener('input', () => set(Number(range.value)));
    fig.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; downX = e.clientX;
      fig.setPointerCapture(e.pointerId);
      clearTimeout(settleTimer);
      fig.classList.toggle('is-settling', !RM);
      set(fromEvent(e));
      settleTimer = setTimeout(() => fig.classList.remove('is-settling'), 400);
      document.querySelector('.cursor-pill')?.classList.add('is-grabbing');
      e.preventDefault();
    });
    fig.addEventListener('pointermove', e => {
      if (!dragging) return;
      if (Math.abs(e.clientX - downX) > 3) { clearTimeout(settleTimer); fig.classList.remove('is-settling'); }
      set(fromEvent(e));
    });
    const end = () => { dragging = false; document.querySelector('.cursor-pill')?.classList.remove('is-grabbing'); };
    fig.addEventListener('pointerup', end);
    fig.addEventListener('pointercancel', end);
  });

  /* ── Scroll-lit statement ──────────────────────────────────────────── */
  document.querySelectorAll('[data-lit]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    el.setAttribute('aria-label', words.join(' '));
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
    if (RM) { spans.forEach(s => s.classList.add('is-lit')); return; }
    let active = false, raf = null;
    function update() {
      raf = null;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Fully dark when the top of the line is at 85% of the viewport,
      // fully lit when its bottom reaches 45%. Middle of the screen is
      // where people read, so that's where the last word should land.
      const start = vh * 0.85, end = vh * 0.45;
      const t = Math.max(0, Math.min(1, (start - r.top) / (start - end + r.height)));
      const n = Math.round(t * spans.length);
      spans.forEach((s, i) => s.classList.toggle('is-lit', i < n));
    }
    const onScroll = () => { if (active && !raf) raf = requestAnimationFrame(update); };
    new IntersectionObserver(es => { active = es[0].isIntersecting; if (active) update(); }).observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  });

  /* ── Cursor labels ─────────────────────────────────────────────────── */
  const pill = document.querySelector('.cursor-pill');
  if (pill && FINE) {
    const label = pill.querySelector('span');
    document.documentElement.classList.add('has-cursor-pill');
    window.addEventListener('pointermove', e => {
      pill.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const host = e.target.closest && e.target.closest('[data-cursor]');
      if (host) {
        if (label.textContent !== host.dataset.cursor) label.textContent = host.dataset.cursor;
        pill.classList.add('is-on');
      } else {
        pill.classList.remove('is-on');
      }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => pill.classList.remove('is-on'));
  }
})();
