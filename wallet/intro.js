/**
 * The opening sequence.
 *
 * Same grammar as the reference: a wireframe tunnel in perspective, the mark
 * drawn stroke by stroke, huge type flying past the camera, a wall of panels
 * sweeping by, an RGB split on the seam. Scroll drives the camera, exactly
 * as it does there — the page is a timeline, not a slideshow.
 *
 * No libraries. Scrolling writes five progress values onto the stage as CSS
 * variables, and every layer is a transform expressed in terms of them, so
 * the whole scene animates on the compositor.
 */
(function (global) {
  "use strict";

  var UI = global.UI;
  var h = UI.h, icon = UI.icon;

  /* Where each beat lives on the scroll, 0 to 1. */
  var BEATS = {
    mark:  [0.00, 0.18],
    type:  [0.14, 0.44],
    wall:  [0.38, 0.76],
    flash: [0.74, 0.84],
    end:   [0.82, 1.00]
  };

  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var seg = function (p, range) { return clamp01((p - range[0]) / (range[1] - range[0])); };

  function reducedMotion() {
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* The mark, drawn rather than placed: every stroke is dashed so the scroll
     can pull it into existence. */
  var MARK = '' +
    '<svg class="intro__mark" viewBox="0 0 120 120" aria-hidden="true">' +
      '<g fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round">' +
        '<circle class="draw" cx="60" cy="60" r="46" pathLength="1"/>' +
        '<ellipse class="draw" cx="60" cy="60" rx="34" ry="46" pathLength="1"/>' +
        '<ellipse class="draw" cx="60" cy="60" rx="15" ry="46" pathLength="1"/>' +
        '<path class="draw" d="M14 60h92" pathLength="1"/>' +
        '<path class="draw" d="M22 38h76" pathLength="1"/>' +
        '<path class="draw" d="M22 82h76" pathLength="1"/>' +
      "</g>" +
      '<path class="draw meridian" d="M60 8v104" fill="none" stroke="#9cbbff" stroke-width="3" stroke-linecap="round" pathLength="1"/>' +
    "</svg>";

  /** Six panels flying past, carrying the product rather than placeholders. */
  var PANELS = [
    { x: -104, y: -132, tilt:  20, label: "БАЛАНС",   body: '<span class="p__big">19 606,37 $</span><span class="p__up">+2,25 %</span>' },
    { x:  108, y:  -96, tilt: -20, label: "ГРАФИК",   body: '<svg viewBox="0 0 120 46" class="p__chart"><path d="M2 38 18 30 30 34 44 18 58 24 72 10 88 16 104 6 118 12" fill="none" stroke="#24d6a0" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>' },
    { x: -118, y:   34, tilt:  22, label: "КУПИТЬ",   body: '<span class="p__btn">КУПИТЬ</span>' },
    { x:  114, y:   62, tilt: -22, label: "СТЕЙКИНГ", body: '<span class="p__big">8,4 %</span><span class="p__dim">годовых</span>' },
    { x:  -96, y:  158, tilt:  18, label: "НА БИРЖУ", body: '<span class="p__mono">0x8f3A…B2c3</span><span class="p__dim">Ethereum</span>' },
    { x:  102, y: -212, tilt: -18, label: "АДРЕСА",   body: '<span class="p__mono">9ELRvD…Eey1</span><span class="p__dim">счёт № 0</span>' }
  ];

  /**
   * Builds the intro. `onDone` runs when the visitor leaves it, either by
   * scrolling to the end and choosing an action, or by skipping.
   */
  function screen(actions) {
    var stage = h("div", { class: "intro__stage" });

    /* --- the tunnel: four planes making a corridor --- */
    var tunnel = h("div", { class: "tunnel" }, ["floor", "ceil", "left", "right"].map(function (side) {
      return h("div", { class: "tunnel__plane tunnel__plane--" + side });
    }));

    /* --- beats --- */
    var mark = h("div", { class: "intro__beat intro__beat--mark", html: MARK });

    var type = h("div", { class: "intro__beat intro__beat--type" }, [
      h("span", { class: "intro__word intro__word--ghost", text: "MERIDIAN" }),
      h("span", { class: "intro__word intro__word--solid", text: "MERIDIAN" }),
      h("span", { class: "intro__word intro__word--echo", text: "MERIDIAN" })
    ]);

    var wall = h("div", { class: "intro__beat intro__beat--wall" }, PANELS.map(function (panel, i) {
      var node = h("div", {
        class: "panel",
        html: '<span class="p__label">' + panel.label + "</span>" +
              '<span class="p__body">' + panel.body + "</span>"
      });
      node.style.setProperty("--x", panel.x + "px");
      node.style.setProperty("--y", panel.y + "px");
      node.style.setProperty("--tilt", panel.tilt);
      node.style.setProperty("--i", i);
      return node;
    }));

    var scene = h("div", { class: "intro__scene" }, [tunnel, mark, type, wall]);
    var glow = h("div", { class: "intro__glow" });
    var flash = h("div", { class: "intro__flash", "data-text": "MERIDIAN" });

    stage.appendChild(glow);
    stage.appendChild(scene);
    stage.appendChild(flash);

    /* --- the end card, and the scroller that drives everything --- */
    var end = h("div", { class: "intro__end" }, [
      h("div", { class: "intro__title", text: "Meridian" }),
      h("div", { class: "intro__sub", text: "Кошелёк с большими кнопками «Купить» и «Продать». Симулятор: настоящих денег и настоящей сети здесь нет." }),
      h("div", { class: "intro__actions" }, [
        h("button", {
          class: "btn btn--primary", html: icon("plus") + "<span>Создать кошелёк</span>",
          onclick: actions.create
        }),
        h("button", {
          class: "btn btn--ghost", html: icon("key") + "<span>У меня уже есть фраза</span>",
          onclick: actions.restore
        })
      ])
    ]);

    var cue = h("div", { class: "intro__cue", html: icon("chevron-down") + "<span>листайте</span>" });

    var scroller = h("div", { class: "scroll intro__scroll" }, [
      h("div", { class: "intro__runway" }),
      end
    ]);

    var skip = h("button", {
      class: "intro__skip", text: "Пропустить",
      onclick: function () { finish(); }
    });

    var root = h("div", { class: "screen intro" }, [stage, scroller, cue, skip]);

    /* --- driving it --- */
    function paint() {
      var max = scroller.scrollHeight - scroller.clientHeight;
      var p = max > 0 ? clamp01(scroller.scrollTop / max) : 1;
      stage.style.setProperty("--p", p.toFixed(4));
      stage.style.setProperty("--mark", seg(p, BEATS.mark).toFixed(4));
      stage.style.setProperty("--type", seg(p, BEATS.type).toFixed(4));
      stage.style.setProperty("--wall", seg(p, BEATS.wall).toFixed(4));
      stage.style.setProperty("--flash", seg(p, BEATS.flash).toFixed(4));
      stage.style.setProperty("--end", seg(p, BEATS.end).toFixed(4));
      cue.style.opacity = p > 0.04 ? "0" : "";
      skip.style.opacity = p > 0.9 ? "0" : "";
      skip.style.pointerEvents = p > 0.9 ? "none" : "";
    }

    var ticking = false;
    scroller.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { paint(); ticking = false; });
    }, { passive: true });

    function finish() {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
    }

    /* Nobody should have to scroll through a title sequence to reach a
       wallet they have already seen — or at all, if motion is unwelcome. */
    if (reducedMotion() || actions.instant) {
      root.classList.add("intro--still");
      setTimeout(function () { scroller.scrollTop = scroller.scrollHeight; paint(); }, 0);
    } else {
      setTimeout(paint, 0);
    }

    root.__tick = null;
    return root;
  }

  global.Intro = { screen: screen, BEATS: BEATS };
})(typeof window !== "undefined" ? window : globalThis);
