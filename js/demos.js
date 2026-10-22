/* ============================================================================
   DESIGN SYSTEM — swatches, copy-to-clipboard and the live motion demos.
   Every duration and curve here is the production value from 2026folio or
   applicants (see the skill), only the stage is smaller.
   ============================================================================ */

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Copy + toast ─────────────────────────────────────────────────────── */
const toastEl = document.querySelector('.toast');
let toastTimer = null;
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1600);
}
async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`Copied ${label || text}`);
  } catch (e) {
    toast(text);
  }
}

/* ── Luminance rule from 2026folio: light when .299r+.587g+.114b > 150 ── */
function isLight(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/* ── Swatch rows ──────────────────────────────────────────────────────── */
document.querySelectorAll('[data-swatches]').forEach(row => {
  JSON.parse(row.dataset.swatches).forEach(([token, hex, name]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.setProperty('--c', hex);
    b.setAttribute('aria-label', `${name}, ${token}, ${hex}. Copy value.`);
    b.innerHTML = `<span class="chip"></span><span class="s-name">${name}</span><span class="s-token">${token}</span><span class="s-hex">${hex.toUpperCase()}</span>`;
    b.addEventListener('click', () => copy(hex.toUpperCase()));
    row.appendChild(b);
  });
});


document.querySelectorAll('[data-copyable]').forEach(el => {
  el.addEventListener('click', () => copy(el.innerText.trim(), 'snippet'));
});

/* ── Reduced-motion note ──────────────────────────────────────────────── */
if (RM) { const n = document.querySelector('.rm-note'); if (n) n.hidden = false; }

/* ── Curves ───────────────────────────────────────────────────────────── */
const CURVES = [
  { name: 'Enter',  bez: [.22, 1, .36, 1],  dur: 400, spec: 'cubic-bezier(.22,1,.36,1)', time: '200 to 400ms', use: 'Reveals, hover, drawers opening.' },
  { name: 'Arrive', bez: [.23, 1, .32, 1],  dur: 380, spec: 'cubic-bezier(.23,1,.32,1)', time: '380ms', use: 'Deck media and copy arriving.' },
  { name: 'Exit',   bez: [.4, 0, 1, 1],     dur: 180, spec: 'cubic-bezier(.4,0,1,1)',    time: '150 to 180ms', use: 'Anything leaving. Always shorter.' },
  { name: 'Move',   bez: [.65, 0, .35, 1],  dur: 700, spec: 'cubic-bezier(.65,0,.35,1)', time: '320 to 700ms', use: 'Page color, auto slides, zoom.' },
  { name: 'Settle', bez: [.32, .72, 0, 1],  dur: 400, spec: 'cubic-bezier(.32,.72,0,1)', time: '400ms', use: 'Drag release, manual slides.' },
];
const curveGrid = document.querySelector('[data-curves]');
if (curveGrid) {
  CURVES.forEach(c => {
    const [x1, y1, x2, y2] = c.bez;
    const P = (x, y) => `${x * 100},${100 - y * 100}`;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'curve';
    card.setAttribute('aria-label', `${c.name} curve, ${c.spec}. Play, and copy the curve.`);
    card.innerHTML = `
      <svg viewBox="-4 -10 108 120" aria-hidden="true">
        <rect class="c-grid" x="0" y="0" width="100" height="100" />
        <line class="c-handle" x1="0" y1="100" x2="${x1 * 100}" y2="${100 - y1 * 100}" />
        <line class="c-handle" x1="100" y1="0" x2="${x2 * 100}" y2="${100 - y2 * 100}" />
        <path class="c-path" d="M0,100 C${P(x1, y1)} ${P(x2, y2)} 100,0" />
      </svg>
      <span class="c-track"><span class="c-ball"></span></span>
      <h4>${c.name}</h4>
      <p>${c.spec}<br>${c.time}</p>
      <span class="c-use">${c.use}</span>`;
    const ball = card.querySelector('.c-ball');
    ball.style.setProperty('--dur', `${c.dur}ms`);
    ball.style.setProperty('--ease', `cubic-bezier(${c.bez.join(',')})`);
    card.addEventListener('click', () => {
      ball.classList.remove('is-playing');
      void ball.offsetWidth;
      requestAnimationFrame(() => ball.classList.add('is-playing'));
      copy(c.spec);
    });
    curveGrid.appendChild(card);
  });
}

/* ── Deck transition demo ─────────────────────────────────────────────── */
const DECK = [
  { title: ['Applicant', 'experience'], body: 'Applying for a rental is long, sensitive, mostly completed on a phone, and ends with a payment.', bg: '#FAF7F3', panel: '#DCE6FB' },
  { title: ['Requesting an', 'application'], body: 'Agents often send the same screening package again and again. I collapsed the common path to a few taps.', bg: '#F2E6FB', panel: '#EBD3F0' },
  { title: ['Messaging'], body: 'The conversation lived in personal texts and email. I tied every thread to a property and its people.', bg: '#222222', panel: 'transparent' },
];
(function deckDemo() {
  const box = document.querySelector('.deck-demo');
  if (!box) return;
  const stage = box.querySelector('.dd-stage');
  let index = 0;
  let busy = null;

  function viewFor(p) {
    const v = document.createElement('div');
    v.className = 'dd-view';
    v.innerHTML = `<div class="dd-copy"><p class="dd-title">${p.title.join('<br>')}</p><p class="dd-body">${p.body}</p></div><div class="dd-media" style="--dd-panel:${p.panel}"><div class="dd-phone"><i></i><i></i><i></i><i></i></div></div>`;
    return v;
  }
  function paint(p) {
    const light = isLight(p.bg);
    box.style.setProperty('--dd-bg', p.bg);
    box.style.setProperty('--dd-fg', light ? '#141414' : '#F5F4F1');
    box.style.setProperty('--dd-hdr', light ? '#1C1C1C' : '#F5F4F1');
  }
  paint(DECK[0]);
  stage.appendChild(viewFor(DECK[0]));

  function go(dir) {
    if (busy) return;
    const next = (index + dir + DECK.length) % DECK.length;
    const oldView = stage.querySelector('.dd-view');
    const newView = viewFor(DECK[next]);
    oldView.dataset.direction = newView.dataset.direction = String(dir);
    oldView.classList.add('is-leaving');
    newView.classList.add('is-entering');
    stage.appendChild(newView);
    paint(DECK[next]);
    index = next;
    busy = setTimeout(() => {
      oldView.remove();
      newView.classList.remove('is-entering');
      busy = null;
    }, RM ? 180 : 700);
  }
  document.querySelectorAll('[data-deck]').forEach(b => b.addEventListener('click', () => go(Number(b.dataset.deck))));
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
})();

/* ── Carousel demo ────────────────────────────────────────────────────── */
(function carouselDemo() {
  const root = document.querySelector('.carousel');
  if (!root) return;
  const stage = root.querySelector('.car-stage');
  const track = root.querySelector('.car-track');
  const dotsEl = root.querySelector('.car-dots');
  const ITEMS = [
    { label: 'Applications list', c: '#DCE6FB' },
    { label: 'Checklist', c: '#F2E6FB' },
    { label: 'Household details', c: '#E7EDD8' },
  ];
  const n = ITEMS.length;
  let index = 0;
  let autoTimer = null;
  let inView = false;
  let drag = null;

  const slides = ITEMS.map(item => {
    const s = document.createElement('div');
    s.className = 'car-slide';
    s.innerHTML = `<div class="car-card" style="background:${item.c}">${item.label}</div>`;
    track.appendChild(s);
    return s;
  });
  const dots = ITEMS.map((item, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', `Show example ${i + 1}: ${item.label}`);
    d.addEventListener('click', () => goTo(i, 'manual'));
    dotsEl.appendChild(d);
    return d;
  });

  // Shortest signed distance on a ring, so slides wrap the short way.
  const rel = (i, at) => { let r = i - at; if (r * 2 > n) r -= n; if (r * 2 < -n) r += n; return r; };
  const timing = src => RM ? '120ms linear' : (src === 'auto' ? '700ms cubic-bezier(.65,0,.35,1)' : '400ms cubic-bezier(.32,.72,0,1)');

  function layout(src, first) {
    slides.forEach((s, i) => {
      const o = rel(i, index);
      const prev = Number(s.dataset.o ?? o);
      // A slide that jumps from one side to the other must not visibly fly
      // across the stage: move it with no transition.
      s.style.transition = (first || Math.abs(o - prev) > 1) ? 'none' : `transform ${timing(src)}`;
      s.style.setProperty('--o', o);
      s.dataset.o = o;
      s.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
    });
    dots.forEach((d, i) => { d.classList.toggle('is-active', i === index); d.setAttribute('aria-selected', String(i === index)); });
    root.setAttribute('aria-label', `Example ${index + 1} of ${n}: ${ITEMS[index].label}`);
  }
  function goTo(i, src) { index = ((i % n) + n) % n; layout(src); schedule(); }
  function schedule() {
    clearTimeout(autoTimer);
    if (RM || !inView || drag) return;
    autoTimer = setTimeout(() => goTo(index + 1, 'auto'), 4200);
  }
  layout('auto', true);

  new IntersectionObserver(es => { inView = es[0].isIntersecting; schedule(); }, { threshold: 0.4 }).observe(root);

  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1, 'manual'); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1, 'manual'); }
  });

  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: e.pointerId, x0: e.clientX, lastX: e.clientX, lastT: e.timeStamp, v: 0, dx: 0 };
    clearTimeout(autoTimer);
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging');
    track.style.transition = 'none';
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
    const w = stage.offsetWidth;
    const far = Math.abs(dx) > w * 0.2;
    const flick = Math.abs(v) > 0.45 && Math.sign(v) === Math.sign(dx);
    track.style.transition = `transform ${timing('manual')}`;
    track.style.setProperty('--drag', '0px');
    if (dx !== 0 && (far || flick)) goTo(index + (dx < 0 ? 1 : -1), 'manual');
    else schedule();
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
})();

/* ── Overview zoom demo (FLIP, Web Animations API) ────────────────────── */
(function zoomDemo() {
  const box = document.querySelector('.zoom-box');
  if (!box) return;
  const grid = box.querySelector('.zoom-grid');
  const CARDS = [
    { name: 'Applicant experience', bg: '#FAF7F3' },
    { name: 'Requesting', bg: '#F2E6FB' },
    { name: 'Messaging', bg: '#222222' },
    { name: 'Rental Assistant', bg: '#FFFFFF' },
  ];
  const ZOOM = { duration: RM ? 150 : 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' };
  let open = null;

  const cards = CARDS.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'zoom-card';
    b.style.setProperty('--bg', c.bg);
    b.style.setProperty('--fg', isLight(c.bg) ? '#141414' : '#F5F4F1');
    b.setAttribute('aria-label', `Open ${c.name}`);
    b.innerHTML = `<span class="zc-inner"><b>${c.name}</b><span></span></span>`;
    b.addEventListener('click', () => zoomIn(i));
    grid.appendChild(b);
    return b;
  });

  function rectIn(el) {
    const a = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    return { left: a.left - b.left, top: a.top - b.top, width: a.width };
  }
  function others(i, keyframes, ms) {
    cards.forEach((c, j) => { if (j !== i) c.animate(keyframes, { duration: RM ? 100 : ms, easing: 'ease', fill: 'both' }); });
  }

  function zoomIn(i) {
    if (open) return;
    const c = CARDS[i];
    const r = rectIn(cards[i]);
    const s = r.width / box.clientWidth;
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'zoom-view';
    view.setAttribute('aria-label', `Close ${c.name}`);
    view.style.cssText = `width:${box.clientWidth}px;height:${box.clientHeight}px;transform-origin:top left;--bg:${c.bg};--fg:${isLight(c.bg) ? '#141414' : '#F5F4F1'}`;
    view.innerHTML = cards[i].innerHTML;
    box.appendChild(view);
    others(i, [{ opacity: 1 }, { opacity: 0.15 }], 200);
    const frames = RM
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ transform: `translate(${r.left}px, ${r.top}px) scale(${s})` }, { transform: 'none' }];
    view.animate(frames, ZOOM);
    view.addEventListener('click', zoomOut);
    view.focus({ preventScroll: true });
    open = { i, view };
  }
  function zoomOut() {
    if (!open) return;
    const { i, view } = open;
    const r = rectIn(cards[i]);
    const s = r.width / box.clientWidth;
    const frames = RM
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ transform: 'none' }, { transform: `translate(${r.left}px, ${r.top}px) scale(${s})` }];
    const anim = view.animate(frames, ZOOM);
    others(i, [{ opacity: 0.15 }, { opacity: 1 }], 300);
    open = null;
    anim.finished.then(() => { view.remove(); cards[i].focus({ preventScroll: true }); }).catch(() => view.remove());
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) zoomOut(); });
})();

/* ── Reveal replay ────────────────────────────────────────────────────── */
(function revealDemo() {
  const box = document.querySelector('.reveal-box');
  const btn = document.querySelector('[data-replay-reveal]');
  if (!box || !btn) return;
  const play = () => { box.classList.remove('is-visible'); void box.offsetWidth; requestAnimationFrame(() => box.classList.add('is-visible')); };
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { play(); o.disconnect(); } }, { threshold: 0.6 }).observe(box);
  btn.addEventListener('click', play);
})();

/* ── Drawer ───────────────────────────────────────────────────────────── */
(function drawerDemo() {
  const btn = document.querySelector('[data-drawer]');
  const drawer = document.querySelector('.drawer');
  if (!btn || !drawer) return;
  btn.addEventListener('click', () => {
    const isOpen = !drawer.hidden && !drawer.classList.contains('is-closing');
    if (isOpen) {
      drawer.classList.add('is-closing');
      btn.textContent = 'Open drawer';
      btn.setAttribute('aria-expanded', 'false');
      setTimeout(() => { drawer.hidden = true; drawer.classList.remove('is-closing'); }, RM ? 0 : 180);
    } else {
      drawer.hidden = false;
      btn.textContent = 'Close drawer';
      btn.setAttribute('aria-expanded', 'true');
    }
  });
})();

/* ── Cursor zone (only for fine pointers, like 2026folio) ─────────────── */
(function cursorDemo() {
  const zone = document.querySelector('.cursor-zone');
  if (!zone || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const dot = zone.querySelector('.cz-dot');
  const INTERACTIVE = 'button, a, .cz-drag';
  zone.classList.add('has-dot');
  zone.addEventListener('pointermove', e => {
    const r = zone.getBoundingClientRect();
    dot.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0)`;
    dot.classList.add('is-visible');
    dot.classList.toggle('is-active', !!e.target.closest(INTERACTIVE));
  });
  zone.addEventListener('pointerdown', e => { if (e.target.closest('.cz-drag')) dot.classList.add('is-grabbing'); });
  window.addEventListener('pointerup', () => dot.classList.remove('is-grabbing'));
  zone.addEventListener('pointerleave', () => dot.classList.remove('is-visible', 'is-active', 'is-grabbing'));
})();

/* ── Scramble link ────────────────────────────────────────────────────── */
document.querySelectorAll('[data-to-hero]').forEach(b => b.addEventListener('click', () => {
  document.getElementById('hero').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
}));

/* ── Register previews: scale the 1440 x 900 compositions to the card ── */
document.querySelectorAll('.rp-canvas').forEach(canvas => {
  const frame = canvas.parentElement;
  const fit = () => canvas.style.setProperty('--s', String(frame.clientWidth / 1440));
  fit();
  new ResizeObserver(fit).observe(frame);
});
