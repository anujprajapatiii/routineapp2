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
  const TAP = 8;                 // px of movement that turns a tap into a drag
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* -------------------------------------------------------------------
     makeInteractive(el)
     Every element gets: 3D tilt on hover, a squishy fling on drag that
     springs back, a press-dip on tap. A real drag (>TAP px) cancels the
     click that follows, so an element's onclick only fires on a true tap.
     ------------------------------------------------------------------- */
  function makeInteractive(el) {
    if (el._glassInteractive) return el;
    el._glassInteractive = true;

    let drag = null;
    const fast = 'transform 0.12s ease, background 0.25s, box-shadow 0.25s';
    const spring = 'transform 0.6s var(--spring), background 0.25s, box-shadow 0.25s';

    el.addEventListener('pointerenter', () => { if (!drag) el.style.transition = fast; });

    el.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      el._noClick = false;                  // clear stale suppression from a prior drag
      el.setPointerCapture(e.pointerId);
      el.style.transition = 'none';
      el.style.zIndex = '5';
      el.style.transform = 'scale(0.96)';   // press dip until a drag begins
    });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
        const stretch = Math.min(drag.moved / 220, 0.18);
        el.style.transform =
          `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg) scale(${1.06 + stretch})`;
      } else {
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          `perspective(520px) rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateZ(6px)`;
      }
    });

    const settle = () => {
      el.style.transition = spring;
      el.style.transform = '';
      setTimeout(() => { el.style.zIndex = ''; }, 600);
    };

    el.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved; drag = null;
      if (moved >= TAP) el._noClick = true;  // it was a drag → swallow the click
      settle();
    });
    el.addEventListener('pointercancel', () => { if (drag) { drag = null; settle(); } });
    el.addEventListener('pointerleave', () => { if (!drag) settle(); });

    // capture phase: cancel the click that follows a drag, before the action runs
    el.addEventListener('click', (e) => {
      if (el._noClick) { e.preventDefault(); e.stopImmediatePropagation(); el._noClick = false; }
    }, true);

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
