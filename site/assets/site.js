/* antinode.bio — standing-wave figure and contact form. No dependencies. */
(function () {
  'use strict';

  /* ── standing wave ────────────────────────────────────────────────────
     y(x, t) = A · sin(kx) · cos(ωt): nodes stay fixed, antinodes swing.
     Drawn into the SVG as paths whose strokes use brand roles (site.css). */
  var svg = document.querySelector('[data-wave]');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var W = 1200, H = 220, MID = H / 2, AMP = H * 0.42, LOOPS = 3, STEP = 8;
    var GHOSTS = [-0.6, -0.25, 0.25, 0.6];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function mk(cls) {
      var p = document.createElementNS(NS, 'path');
      if (cls) p.setAttribute('class', cls);
      svg.appendChild(p);
      return p;
    }
    function d(scale) {
      var s = 'M0 ' + MID;
      for (var x = STEP; x <= W; x += STEP) {
        var y = MID - AMP * scale * Math.sin(Math.PI * LOOPS * x / W);
        s += 'L' + x + ' ' + y.toFixed(1);
      }
      return s;
    }

    mk('axis').setAttribute('d', 'M0 ' + MID + 'H' + W);
    GHOSTS.forEach(function (g) { mk().setAttribute('d', d(g)); });
    mk('envelope').setAttribute('d', d(1));
    mk().setAttribute('d', d(-1));
    var live = mk('live');
    live.setAttribute('d', d(0.85));

    if (!reduce) {
      var visible = true, t0 = null, raf = 0;
      var frame = function (t) {
        if (t0 === null) t0 = t;
        live.setAttribute('d', d(Math.cos((t - t0) / 1400) * 0.85));
        raf = visible ? requestAnimationFrame(frame) : 0;
      };
      var start = function () { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; start(); }).observe(svg);
      }
      document.addEventListener('visibilitychange', start);
      start();
    }
  }

  /* ── contact form ─────────────────────────────────────────────────────
     Posts to the form endpoint (Formspree-compatible) with fetch and shows
     the result in place. Without JavaScript the browser posts it normally. */
  var form = document.querySelector('[data-contact-form]');
  if (!form) return;
  var status = form.querySelector('[data-form-status]');
  var button = form.querySelector('button[type="submit"]');

  function say(msg, state) {
    status.textContent = msg;
    if (state) status.setAttribute('data-state', state); else status.removeAttribute('data-state');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (form.elements._gotcha && form.elements._gotcha.value) { form.reset(); return; }

    button.disabled = true;
    say('Sending…');
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.reset();
      form.classList.add('sent');
      say('Thank you — your message has been sent. We will reply by email.', 'ok');
      status.setAttribute('tabindex', '-1');
      status.focus();
    }).catch(function () {
      say('Your message could not be sent. Please check your connection and try again.', 'error');
    }).then(function () {
      button.disabled = false;
    });
  });
})();
