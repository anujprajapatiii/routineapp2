/* =====================================================================
   Liquid Glass UI Kit  ·  v1.0
   The interactive "sauce": springy drag/fling physics, hover 3D-tilt,
   press-dip, drag-cancels-click, randomised idle float, and a
   localStorage-backed day/night theme manager.

   No dependencies. Exposes a global `GlassKit` (also works as an ES
   module — see the export at the bottom).

   Quick start:
     <script src="liquid-glass.js"></script>
     <script>GlassKit.init();</script>

   Markup hooks that init() wires up automatically:
     [data-glass]         → interactive (tilt / drag-fling / press)
     [data-float]         → gentle idle float
     [data-theme-toggle]  → flips light/dark + persists the choice

   Tip: to avoid a flash of the wrong theme, run GlassKit.applyStoredTheme()
   from an inline <script> in <head> BEFORE first paint (see README).
   ===================================================================== */
(function (root, factory) {
  const api = factory();
  root.GlassKit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : {}), function () {
  'use strict';

  const STORAGE_KEY = 'glasskit-theme';
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* -------------------------------------------------------------------
     makeInteractive(el)
     Restrained, click-safe feedback: 3D tilt that follows the cursor on
     hover, a press-dip on pointer-down, and a springy wobble back to rest
     on release. No drag/fling and no pointer-capture, so clicks, links,
     and form submits always fire normally.
     ------------------------------------------------------------------- */
  function makeInteractive(el) {
    if (el._glassInteractive) return el;
    el._glassInteractive = true;

    let pressed = false;
    const fast = 'transform 0.12s ease, background 0.25s, box-shadow 0.25s';
    const spring = 'transform 0.6s var(--spring), background 0.25s, box-shadow 0.25s';

    el.addEventListener('pointerenter', () => { el.style.transition = fast; });

    el.addEventListener('pointermove', (e) => {
      if (pressed) return;                       // hold the press-dip while pressed
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform =
        `perspective(520px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) translateZ(6px)`;
    });

    el.addEventListener('pointerdown', () => {
      pressed = true;
      el.style.transition = fast;
      el.style.transform = 'scale(0.95)';        // press dip
    });

    const release = () => {
      pressed = false;
      el.style.transition = spring;              // springy wobble back to rest
      el.style.transform = '';
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);

    return el;
  }

  /* -------------------------------------------------------------------
     makeFloat(el)
     Randomised amplitudes / periods / negative start-delays so no two
     elements drift in sync — the motion reads as organic, not mechanical.
     ------------------------------------------------------------------- */
  function makeFloat(el) {
    el.style.setProperty('--fx', rnd(3, 6).toFixed(1) + 'px');
    el.style.setProperty('--fy', rnd(4, 7).toFixed(1) + 'px');
    el.style.setProperty('--fr', rnd(0.5, 1.3).toFixed(2) + 'deg');
    el.style.setProperty('--fd', rnd(6, 9).toFixed(1) + 's');      // drift period
    el.style.setProperty('--ft', rnd(7.5, 11).toFixed(1) + 's');   // tilt period (≠ drift → no loop point)
    el.style.setProperty('--fdx', '-' + rnd(0, 9).toFixed(1) + 's');
    el.style.setProperty('--fdr', '-' + rnd(0, 9).toFixed(1) + 's');
    el.classList.add('floating');
    return el;
  }

  /* -------------------------------------------------------------------
     Theme manager
     ------------------------------------------------------------------- */
  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function storedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
  // Resolve & apply the theme (call from <head> before paint to avoid a flash).
  function applyStoredTheme() {
    const stored = storedTheme();
    const dark = stored ? stored === 'dark' : prefersDark();
    setTheme(dark ? 'dark' : 'light', { persist: false });
    return currentTheme();
  }
  function setTheme(name, opts) {
    document.documentElement.setAttribute('data-theme', name);
    if (!opts || opts.persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, name); } catch (e) {}
    }
    onThemeChange.forEach((fn) => { try { fn(name); } catch (e) {} });
    return name;
  }
  function toggleTheme() {
    return setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }
  const onThemeChange = [];
  function subscribeTheme(fn) { onThemeChange.push(fn); return () => {
    const i = onThemeChange.indexOf(fn); if (i > -1) onThemeChange.splice(i, 1);
  }; }

  /* -------------------------------------------------------------------
     init(root) — wire up declarative hooks inside `root` (default: document)
     ------------------------------------------------------------------- */
  function init(scope) {
    const r = scope || document;
    r.querySelectorAll('[data-glass]').forEach(makeInteractive);
    r.querySelectorAll('[data-float]').forEach(makeFloat);
    r.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      if (btn._glassThemeBound) return;
      btn._glassThemeBound = true;
      btn.addEventListener('click', () => toggleTheme());
    });
    return GlassKit;
  }

  const GlassKit = {
    init,
    makeInteractive,
    makeFloat,
    theme: {
      apply: applyStoredTheme,
      applyStoredTheme,
      set: setTheme,
      toggle: toggleTheme,
      current: currentTheme,
      subscribe: subscribeTheme,
    },
  };
  return GlassKit;
});
