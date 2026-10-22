/* ============================================================================
   DESIGN SYSTEM — page shell. Ported from the applicants case study
   (js/shell.js there): section tracking, pill nav + jump list, keyboard nav,
   sticky top bar, reveal-on-scroll. Vanilla JS, no build step.
   Changes from the source: no V1 sheet, the pill hides while the hero is in
   view (the skill's spec), and keyboard nav ignores focused controls so
   Space and the arrows still work inside the demos.
   ============================================================================ */

const SECTIONS = [
  { id: 'hero',         name: 'Hero' },
  { id: 'principles',   name: 'Principles' },
  { id: 'registers',    name: 'Registers' },
  { id: 'color',        name: 'Color' },
  { id: 'type',         name: 'Type' },
  { id: 'space',        name: 'Space' },
  { id: 'motion',       name: 'Motion' },
  { id: 'components',   name: 'Components' },
  { id: 'layouts',      name: 'Layouts' },
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
  const pillCount = document.querySelector('.section-nav .pill-count');
  const pillName = document.querySelector('.section-nav .pill-name');
  // Sections here are taller than a viewport, so a fixed threshold never
  // fires for them. Watch a thin band across the middle of the screen
  // instead: whichever section crosses it is the current one.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx = SECTIONS.findIndex(s => s.id === entry.target.id);
      if (idx === -1) return;
      currentIndex = idx;
      if (pillCount) pillCount.textContent = `${idx + 1} / ${SECTIONS.length}`;
      if (pillName) pillName.textContent = SECTIONS[idx].name;
      if (topBarNameEl) topBarNameEl.textContent = SECTIONS[idx].name;
      document.querySelectorAll('.section-jumplist button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.index === String(currentIndex));
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

/* ── Pill nav — collapsed pill, plain jump list ───────────────────────── */
function wirePillNav() {
  const pill = document.querySelector('.section-nav .section-pill');
  const root = document.querySelector('.section-nav');
  if (!pill || !root) return;
  let open = false;
  let listEl = null;

  function closeList(returnFocus) {
    if (!listEl) return;
    const el = listEl;
    listEl = null;
    open = false;
    pill.setAttribute('aria-expanded', 'false');
    el.classList.add('is-closing');
    setTimeout(() => el.remove(), 150);
    if (returnFocus) pill.focus();
  }

  function openList() {
    open = true;
    pill.setAttribute('aria-expanded', 'true');
    listEl = document.createElement('div');
    listEl.className = 'section-jumplist';
    listEl.setAttribute('role', 'menu');
    SECTIONS.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'menuitem');
      btn.dataset.index = String(i);
      if (i === currentIndex) btn.classList.add('active');
      btn.innerHTML = `<span class="jump-n">${String(i + 1).padStart(2, '0')}</span><span>${s.name}</span>`;
      btn.addEventListener('click', () => { jumpTo(i); closeList(false); });
      listEl.appendChild(btn);
    });
    root.appendChild(listEl);
    const active = listEl.querySelector('.active') || listEl.querySelector('button');
    if (active) active.focus();
  }

  pill.setAttribute('aria-expanded', 'false');
  pill.addEventListener('click', () => { open ? closeList(true) : openList(); });
  document.addEventListener('click', e => { if (open && !root.contains(e.target)) closeList(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeList(true); });
}

/* ── Keyboard nav — arrows and number keys jump between sections ─────── */
function wireKeyboardNav() {
  document.addEventListener('keydown', e => {
    const t = e.target;
    const tag = (t.tagName || '').toLowerCase();
    // Leave the keyboard alone when a control or a demo has focus.
    if (['input', 'textarea', 'select', 'button', 'a'].includes(tag) || t.isContentEditable) return;
    if (t.closest && t.closest('[tabindex], .section-jumplist')) return;
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
  wirePillNav();
  wireKeyboardNav();
}

document.addEventListener('DOMContentLoaded', initShell);
