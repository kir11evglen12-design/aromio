/* ==========================================================================
   AROMIO — search overlay (debounced live search)
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  const RECENT_KEY = "aromio.recentSearches.v1";
  const FAMILY_TAGS = Object.keys(Aromio.FAMILY_LABELS);

  function haystack(product) {
    return [
      product.name,
      product.shortName,
      product.brand,
      Aromio.FAMILY_LABELS[product.family],
      Aromio.CATEGORY_LABELS[product.category],
      product.notes.top.join(" "),
      product.notes.heart.join(" "),
      product.notes.base.join(" "),
    ]
      .join(" ")
      .toLowerCase();
  }

  function search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Aromio.PRODUCTS.filter((p) => haystack(p).indexOf(q) > -1).slice(0, 8);
  }

  function getRecent() {
    return utils.getJSON(RECENT_KEY, []);
  }

  function pushRecent(query) {
    const q = query.trim();
    if (q.length < 2) return;
    let recent = getRecent().filter((r) => r.toLowerCase() !== q.toLowerCase());
    recent.unshift(q);
    recent = recent.slice(0, 5);
    utils.setJSON(RECENT_KEY, recent);
  }

  function suggestionsHtml() {
    const recent = getRecent();
    let html = "";

    if (recent.length) {
      html +=
        '<div class="search-group"><h4>Недавние запросы</h4><div class="chip-row">' +
        recent.map((r) => '<button type="button" class="chip" data-query="' + utils.escapeHtml(r) + '">' + utils.escapeHtml(r) + "</button>").join("") +
        "</div></div>";
    }

    html +=
      '<div class="search-group"><h4>Популярные категории</h4><div class="chip-row">' +
      FAMILY_TAGS.map((f) => '<button type="button" class="chip" data-family="' + f + '">' + Aromio.FAMILY_LABELS[f] + "</button>").join("") +
      '<button type="button" class="chip" data-badge="sale">Скидки</button>' +
      '<button type="button" class="chip" data-badge="new">Новинки</button>' +
      "</div></div>";

    return html;
  }

  function emptyResultsHtml() {
    return (
      '<div class="empty-state">' +
      '<div class="empty-state-icon">⌕</div>' +
      "<p>Ничего не найдено</p>" +
      '<button type="button" class="btn btn--outline" data-open="quizModal">Пройти подбор аромата</button>' +
      "</div>"
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    const drawer = document.getElementById("searchDrawer");
    if (!drawer) return;

    const input = document.getElementById("searchInput");
    const suggestionsEl = document.getElementById("searchSuggestions");
    const resultsEl = document.getElementById("searchResults");

    function showSuggestions() {
      suggestionsEl.hidden = false;
      resultsEl.hidden = true;
      suggestionsEl.innerHTML = suggestionsHtml();
    }

    function showResults(query) {
      const matches = search(query);
      suggestionsEl.hidden = true;
      resultsEl.hidden = false;
      resultsEl.innerHTML = matches.length
        ? '<div class="row-card-list">' + matches.map(Aromio.Card.renderRow).join("") + "</div>"
        : emptyResultsHtml();
    }

    function runQuery(value) {
      input.value = value;
      if (value.trim()) {
        showResults(value);
        pushRecent(value);
      } else {
        showSuggestions();
      }
    }

    const debouncedSearch = utils.debounce((value) => {
      if (value.trim()) {
        showResults(value);
        pushRecent(value);
      } else {
        showSuggestions();
      }
    }, 180);

    input.addEventListener("input", () => debouncedSearch(input.value));

    suggestionsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;

      if (chip.dataset.query) {
        runQuery(chip.dataset.query);
        return;
      }

      let matches;
      let label;
      if (chip.dataset.family) {
        matches = Aromio.PRODUCTS.filter((p) => p.family === chip.dataset.family).slice(0, 8);
        label = Aromio.FAMILY_LABELS[chip.dataset.family];
      } else {
        matches = Aromio.PRODUCTS.filter((p) => p.badges.indexOf(chip.dataset.badge) > -1).slice(0, 8);
        label = Aromio.BADGE_LABELS[chip.dataset.badge];
      }

      suggestionsEl.hidden = true;
      resultsEl.hidden = false;
      resultsEl.innerHTML =
        '<p class="search-result-label">Результаты: ' + label + "</p>" +
        (matches.length
          ? '<div class="row-card-list">' + matches.map(Aromio.Card.renderRow).join("") + "</div>"
          : emptyResultsHtml());
    });

    drawer.addEventListener("transitionend", (e) => {
      if (e.target === drawer && !drawer.classList.contains("open")) {
        input.value = "";
        showSuggestions();
      }
    });

    showSuggestions();
  });
})(window.Aromio);
