/* ============================================================================
   APPLICANTS — hero scramble. Character-level glyph/color/border burst on
   line hover, built on GSAP SplitText. A signature moment, kept separate
   from the general scroll-reveal guard rail in app.js.

   prefers-reduced-motion: h1s are left unsplit, plain text — no scramble,
   no idle pass, no DOM restructuring at all.
   ============================================================================ */

const HERO_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Glyph pool for substitution. Biased toward digits — a transposed digit is
// the exact failure mode this project is about.
const HERO_DIGITS  = '0123456789'.split('');
const HERO_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
const HERO_SYMBOLS = '@.-/()#'.split('');
const HERO_GLYPH_POOL = [...HERO_DIGITS, ...HERO_DIGITS, ...HERO_DIGITS, ...HERO_LETTERS, ...HERO_SYMBOLS];

// Pulled from --hero-spark-* at call time (not cached at module load) so the
// tokens in css/styles.css stay the single source of truth for this palette.
function heroColorPool() {
  const style = getComputedStyle(document.documentElement);
  return [1, 2, 3, 4, 5].map(n => style.getPropertyValue(`--hero-spark-${n}`).trim());
}

function heroRandomGlyph() {
  return HERO_GLYPH_POOL[Math.floor(Math.random() * HERO_GLYPH_POOL.length)];
}

function heroDebounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function scrambleLine(line, allChars) {
  const charsInLine = allChars.filter(c => line.contains(c));
  const middleIndex = (charsInLine.length - 1) / 2;
  const colorPool = heroColorPool();

  charsInLine.forEach((char, index) => {
    if (!char.dataset.orig) char.dataset.orig = char.textContent;
    const distanceFromCenter = Math.abs(index - middleIndex);

    gsap.fromTo(char, { color: '#F4F1EC' }, {
      color: gsap.utils.random(colorPool),
      ease: 'power3.out',
      duration: 0.3,
      delay: distanceFromCenter * 0.03,
      repeat: 1,
      yoyo: true,
      overwrite: 'auto',
      onStart: () => {
        const swapGlyph = gsap.utils.random(['0', '1']);
        const addDetail = gsap.utils.random(['0', '1', '2']);
        if (swapGlyph === '1') char.textContent = heroRandomGlyph();
        if (addDetail === '1') {
          const detail = document.createElement('span');
          detail.className = 'detail-size';
          detail.textContent = `△x = ${char.clientWidth}px`;
          char.appendChild(detail);
          char.style.border = `1px solid ${gsap.utils.random(colorPool)}`;
        }
      },
      onComplete: () => {
        char.textContent = char.dataset.orig;
        char.style.border = 'none';
      },
    });
  });
}

function setupHero() {
  const titleEl = document.querySelector('.title');
  if (!titleEl) return () => {};

  if (HERO_REDUCED_MOTION || !window.gsap || !window.SplitText) return () => {};

  gsap.registerPlugin(SplitText);

  const isTouch = window.matchMedia('(hover: none)').matches;
  const splits = [];
  const allLines = [];
  const listeners = []; // { el, type, handler } for teardown

  const heroTexts = gsap.utils.toArray(titleEl.querySelectorAll('h1'));

  heroTexts.forEach(txt => {
    // `words` isn't used directly, but keeping it in the split gives each
    // word an atomic wrapper — without it, a word too wide for a narrow
    // viewport can break mid-word (e.g. "purchase f|low") since bare
    // char-level inline-blocks have no built-in word boundary.
    const split = new SplitText(txt, { type: 'lines, words, chars' });
    splits.push(split);
    split.lines.forEach(line => {
      allLines.push(line);
      const handler = () => scrambleLine(line, split.chars);
      line.addEventListener('mouseenter', handler);
      listeners.push({ el: line, type: 'mouseenter', handler });
      if (isTouch) {
        line.addEventListener('touchstart', handler, { passive: true });
        listeners.push({ el: line, type: 'touchstart', handler });
      }
    });
  });

  // Ambient idle pass: after 6s with no pointer movement, scramble one
  // random line every ~4s, so the hero stays alive while it's being
  // talked over rather than presented. Gated on hero visibility — no point
  // (and no CPU) running this while the hero has scrolled out of view.
  let idleTimeout = null;
  let ambientInterval = null;
  let heroVisible = true;

  function stopAmbient() {
    if (ambientInterval) { clearInterval(ambientInterval); ambientInterval = null; }
  }
  function startAmbient() {
    stopAmbient();
    if (!heroVisible) return;
    ambientInterval = setInterval(() => {
      if (!allLines.length) return;
      const line = allLines[Math.floor(Math.random() * allLines.length)];
      const split = splits.find(s => s.lines.includes(line));
      if (split) scrambleLine(line, split.chars);
    }, 4000);
  }
  function resetIdle() {
    stopAmbient();
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(startAmbient, 6000);
  }

  document.addEventListener('mousemove', resetIdle);
  document.addEventListener('touchstart', resetIdle, { passive: true });
  resetIdle();

  const heroSection = titleEl.closest('section') || titleEl;
  const heroVisibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) resetIdle();
      else { stopAmbient(); clearTimeout(idleTimeout); }
    });
  }, { threshold: 0 });
  heroVisibilityObserver.observe(heroSection);

  return function teardown() {
    clearTimeout(idleTimeout);
    stopAmbient();
    heroVisibilityObserver.disconnect();
    document.removeEventListener('mousemove', resetIdle);
    document.removeEventListener('touchstart', resetIdle);
    listeners.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
    splits.forEach(s => s.revert());
  };
}

let heroTeardown = null;
function rebuildHero() {
  if (heroTeardown) heroTeardown();
  heroTeardown = setupHero();
}

// SplitText measures line-wraps from rendered glyph widths, so it has to run
// after the webfont is actually loaded — otherwise it splits against the
// fallback font's metrics and gets the wrong line breaks.
function readyHero() {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(rebuildHero);
  } else {
    rebuildHero();
  }
}

document.addEventListener('DOMContentLoaded', readyHero);
if (!HERO_REDUCED_MOTION) {
  window.addEventListener('resize', heroDebounce(rebuildHero, 250));
}
