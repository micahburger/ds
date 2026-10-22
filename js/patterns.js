/* ============================================================================
   DESIGN SYSTEM — portfolio patterns: table index preview, text index,
   before/after, scroll-lit statement, cursor labels. Vanilla JS.
   Ideas from Semplice's Advanced Portfolio Grids, timings from this system.
   ============================================================================ */

(function () {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Pointer position, shared by the preview and the cursor pill ────── */
  let px = -9999, py = -9999;
  window.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });

  /* ── Table index: row hover + lagging preview ──────────────────────── */
  const table = document.querySelector('.table-grid');
  const preview = document.querySelector('.tg-preview');
  if (table && preview && FINE) {
    const img = preview.querySelector('img');
    let on = false, x = -9999, y = -9999, raf = null;
    // 0.18 per frame reads as "follows" without feeling attached. With
    // reduced motion the preview sits exactly at the pointer instead.
    const EASE = RM ? 1 : 0.18;
    const OFFSET_X = 28, OFFSET_Y = -120;
    function tick() {
      x += (px + OFFSET_X - x) * EASE;
      y += (py + OFFSET_Y - y) * EASE;
      preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = on || Math.abs(px + OFFSET_X - x) > 0.5 ? requestAnimationFrame(tick) : null;
    }
    table.querySelectorAll('.tg-row').forEach(row => {
      const src = row.dataset.img;
      const pre = new Image(); pre.src = src; // warm the cache so the swap is instant
      row.addEventListener('pointerenter', () => {
        if (!on) { x = px + OFFSET_X; y = py + OFFSET_Y; }
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
