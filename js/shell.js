/* ============================================================================
   DESIGN SYSTEM — page shell. Ported from the applicants case study
   (js/shell.js there): section tracking, pill nav + jump list, keyboard nav,
   sticky top bar, reveal-on-scroll. Vanilla JS, no build step.
   Changes from the source: no V1 sheet, the pill hides while the hero is in
   view (the skill's spec), keyboard nav ignores focused controls so Space
   and the arrows still work inside the demos, and the pill + jump list are
   now one morphing chapter menu.
   ============================================================================ */

const SECTIONS = [
  { id: 'hero',         name: 'Hero' },
  { id: 'principles',   name: 'Principles' },
  { id: 'formats',      name: 'Formats' },
  { id: 'color',        name: 'Color' },
  { id: 'type',         name: 'Typography' },
  { id: 'space',        name: 'Space' },
  { id: 'motion',       name: 'Motion' },
  { id: 'components',   name: 'Components' },
  { id: 'layouts',      name: 'Layouts' },
  { id: 'patterns',     name: 'Patterns' },
  { id: 'case-studies', name: 'Case studies' },
  { id: 'voice',        name: 'Voice' },
];

const shellReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentIndex = 0;

function sectionEl(id) { return document.getElementById(id); }

function jumpTo(index) {
  index = Math.max(0, Math.min(SECTIONS.length - 1, index));
  const el = sectionEl(SECTIONS[index].id);
  if (el) el.scrollIntoView({ behavior: shellReducedMotion ? 'auto' : 'smooth', block: 'start' });
}

/* ── Top bar + pill visibility — both stay out of the hero ────────────── */
function wireHeroWatch() {
  const bar = document.querySelector('.top-bar');
  const hero = sectionEl('hero');
  if (!hero) return null;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (bar) bar.classList.toggle('is-visible', !entry.isIntersecting);
      document.body.classList.toggle('at-hero', entry.isIntersecting);
    });
  }, { threshold: 0.15 });
  observer.observe(hero);
  return bar ? bar.querySelector('.top-bar-section') : null;
}

/* ── Active section — drives the pill label and the top bar name ──────── */
function wireSectionTracking(topBarNameEl) {
  const count = document.querySelector('.chapter-nav .cn-count');
  const name = document.querySelector('.chapter-nav .cn-name');
  const pad = n => String(n).padStart(2, '0');
  // Sections here are taller than a viewport, so a fixed threshold never
  // fires for them. Watch a thin band across the middle of the screen
  // instead: whichever section crosses it is the current one.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx = SECTIONS.findIndex(s => s.id === entry.target.id);
      if (idx === -1) return;
      currentIndex = idx;
      if (count) count.textContent = `${pad(idx + 1)} / ${pad(SECTIONS.length)}`;
      if (name) name.textContent = SECTIONS[idx].name;
      if (topBarNameEl) topBarNameEl.textContent = SECTIONS[idx].name;
      document.querySelectorAll('.cn-list button').forEach(btn => {
        const on = btn.dataset.index === String(currentIndex);
        btn.classList.toggle('active', on);
        if (on) btn.setAttribute('aria-current', 'true'); else btn.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  SECTIONS.forEach(s => { const el = sectionEl(s.id); if (el) observer.observe(el); });
}

/* ── Reveal — one fade and rise per section, fires once ───────────────── */
function wireReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (shellReducedMotion) { targets.forEach(t => t.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      // A settled-but-present transform still makes this wrapper the
      // containing block for position:sticky children. Clear it once done.
      el.addEventListener('transitionend', () => { el.style.transform = 'none'; }, { once: true });
      observer.unobserve(el);
    });
  }, { threshold: 0.05 });
  targets.forEach(t => observer.observe(t));
}

/* ── Chapter menu ───────────────────────────────────────────────────────
   One surface, two states. The bar at the bottom right grows into the menu
   and shrinks back into the bar; nothing pops in as a separate layer.
   Open:  the panel grows 420ms on the enter curve while the chapters rise
          in behind it (300ms each, 22ms apart, starting at 140ms).
   Close: content fades 120ms on the exit curve, then the panel shrinks
          320ms on the move curve. Closing is the quicker of the two.
   The Menu/Close label rolls vertically, keyed off aria-expanded. */
function wireChapterNav() {
  const nav = document.querySelector('.chapter-nav');
  if (!nav) return;
  const panel = nav.querySelector('.cn-panel');
  const list = nav.querySelector('.cn-list');
  const toggle = nav.querySelector('.cn-toggle');
  const bar = nav.querySelector('.cn-bar');
  const pad = n => String(n).padStart(2, '0');
  let open = false;
  let anim = null;

  SECTIONS.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'cn-in';
    li.style.setProperty('--i', String(i + 1));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.index = String(i);
    btn.innerHTML = `<i>${pad(i + 1)}</i><span>${s.name}</span>`;
    btn.addEventListener('click', () => { closeNav(false); jumpTo(i); });
    li.appendChild(btn);
    list.appendChild(li);
  });

  const size = () => { const r = panel.getBoundingClientRect(); return { w: r.width, h: r.height }; };

  function openNav() {
    if (open) return;
    open = true;
    const from = size();
    if (anim) anim.cancel();
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    const to = size();
    if (!shellReducedMotion) {
      anim = panel.animate([
        { width: `${from.w}px`, height: `${from.h}px`, borderRadius: '26px' },
        { width: `${to.w}px`, height: `${to.h}px`, borderRadius: '22px' },
      ], { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }
    requestAnimationFrame(() => nav.classList.add('is-revealed'));
    const active = list.querySelector('.active') || list.querySelector('button');
    setTimeout(() => { if (open && active) active.focus({ preventScroll: true }); }, 60);
  }

  function closeNav(returnFocus) {
    if (!open) return;
    open = false;
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-revealed');
    const from = size();
    if (anim) anim.cancel();
    // Measure the collapsed bar, then keep the open layout during the
    // shrink so the content stays put while the edges close over it.
    nav.classList.remove('is-open');
    const to = size();
    if (shellReducedMotion) { if (returnFocus) toggle.focus(); return; }
    nav.classList.add('is-open');
    anim = panel.animate([
      { width: `${from.w}px`, height: `${from.h}px`, borderRadius: '22px' },
      { width: `${to.w}px`, height: `${to.h}px`, borderRadius: '26px' },
    ], { duration: 320, delay: 90, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'both' });
    const shrink = anim;
    shrink.finished.then(() => {
      if (open || anim !== shrink) return;
      nav.classList.remove('is-open');
      shrink.cancel();
      anim = null;
    }).catch(() => {});
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  // Arrows move through the grid: up/down within a column, left/right across.
  list.addEventListener('keydown', e => {
    const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: 6, ArrowLeft: -6 }[e.key];
    if (step === undefined) return;
    const btns = [...list.querySelectorAll('button')];
    const at = btns.indexOf(document.activeElement);
    const next = btns[at + step];
    if (next) { e.preventDefault(); next.focus(); }
  });

  const top = nav.querySelector('.cn-top');
  if (top) top.addEventListener('click', e => { e.preventDefault(); closeNav(false); jumpTo(0); });

  toggle.addEventListener('click', e => { e.stopPropagation(); open ? closeNav(true) : openNav(); });
  bar.addEventListener('click', e => { if (!toggle.contains(e.target)) open ? closeNav(false) : openNav(); });
  document.addEventListener('click', e => { if (open && !nav.contains(e.target)) closeNav(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeNav(true); });
  // Never leave it open over the hero, where the bar itself is hidden.
  new MutationObserver(() => { if (document.body.classList.contains('at-hero')) closeNav(false); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // The dot from the video becomes a small ring that fills with the page.
  let raf = null;
  const progress = () => {
    raf = null;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.style.setProperty('--p', String(max > 0 ? Math.min(1, scrollY / max) : 0));
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(progress); }, { passive: true });
  progress();
}

/* ── Keyboard nav — arrows and number keys jump between sections ─────── */
function wireKeyboardNav() {
  document.addEventListener('keydown', e => {
    const t = e.target;
    const tag = (t.tagName || '').toLowerCase();
    // Leave the keyboard alone when a control or a demo has focus.
    if (['input', 'textarea', 'select', 'button', 'a'].includes(tag) || t.isContentEditable) return;
    if (t.closest && t.closest('[tabindex], .chapter-nav')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': e.preventDefault(); jumpTo(currentIndex + 1); break;
      case 'ArrowUp': case 'ArrowLeft': e.preventDefault(); jumpTo(currentIndex - 1); break;
      case 'Home': e.preventDefault(); jumpTo(0); break;
      case 'End': e.preventDefault(); jumpTo(SECTIONS.length - 1); break;
    }
  });
}

function initShell() {
  const topBarNameEl = wireHeroWatch();
  wireSectionTracking(topBarNameEl);
  wireReveal();
  wireChapterNav();
  wireKeyboardNav();
}

document.addEventListener('DOMContentLoaded', initShell);
