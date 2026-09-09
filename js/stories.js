/* ==========================================================================
   AROMIO — stories rail (real perfumery history, not brand fluff)
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  const SEEN_KEY = "aromio.storiesSeen.v1";

  const STORIES = [
    {
      id: "cologne",
      icon: "🌊",
      label: "1709 год",
      slides: [
        {
          icon: "🌊",
          title: "Рождение одеколона",
          text: "В 1709 году итальянский парфюмер Джованни Мария Фарина, переехавший в Кёльн, создал воду, напомнившую ему «весеннее утро в Италии». Так появился первый одеколон — Eau de Cologne.",
        },
      ],
    },
    {
      id: "grasse",
      icon: "🌺",
      label: "Грас",
      slides: [
        {
          icon: "🌺",
          title: "Столица ароматов",
          text: "Городок Грас на юге Франции с XVI века выращивает розу, жасмин и туберозу для парфюмерии — и до сих пор считается мировой столицей ароматного сырья.",
        },
      ],
    },
    {
      id: "florence",
      icon: "⚱️",
      label: "Флоренция",
      slides: [
        {
          icon: "⚱️",
          title: "Старейшая аптека мира",
          text: "Аптека-парфюмерия Santa Maria Novella во Флоренции работает с 1221 года — монахи-доминиканцы делали там ароматные воды задолго до современной парфюмерии.",
        },
        {
          icon: "🕯️",
          title: "Жива до сих пор",
          text: "Santa Maria Novella работает и сегодня — один из старейших действующих парфюмерных домов в мире.",
        },
      ],
    },
    {
      id: "medici",
      icon: "👑",
      label: "Медичи",
      slides: [
        {
          icon: "👑",
          title: "Итальянский след во Франции",
          text: "В 1533 году Екатерина Медичи привезла из Флоренции во Францию личного парфюмера Рене ле Флорентина — считается, что именно так началось становление французской парфюмерной школы.",
        },
      ],
    },
    {
      id: "pyramid",
      icon: "🔺",
      label: "Пирамида",
      slides: [
        {
          icon: "🔺",
          title: "Пирамида аромата",
          text: "Верхние ноты раскрываются в первые 15 минут, сердце звучит следующие несколько часов, а базовые ноты — мускус, дерево, смолы — держатся дольше всего и формируют шлейф.",
        },
      ],
    },
  ];

  let currentStory = null;
  let slideIndex = 0;
  let timer = null;

  function getSeen() {
    return utils.getJSON(SEEN_KEY, []);
  }

  function markSeen(id) {
    const seen = getSeen();
    if (seen.indexOf(id) === -1) {
      seen.push(id);
      utils.setJSON(SEEN_KEY, seen);
    }
  }

  function renderBubbles() {
    const track = document.getElementById("storiesTrack");
    if (!track) return;
    const seen = getSeen();
    track.innerHTML = STORIES.map(
      (s) =>
        '<button type="button" class="story-bubble' + (seen.indexOf(s.id) > -1 ? " is-seen" : "") + '" data-story="' + s.id + '">' +
        '<span class="story-ring"><span class="story-ring-inner">' + s.icon + "</span></span>" +
        "<span>" + s.label + "</span>" +
        "</button>"
    ).join("");
  }

  function renderProgress() {
    const row = document.getElementById("storyProgressRow");
    row.innerHTML = currentStory.slides
      .map((_, i) => '<span class="' + (i < slideIndex ? "is-done" : i === slideIndex ? "is-active" : "") + '"><b></b></span>')
      .join("");
  }

  function renderSlide() {
    const slide = currentStory.slides[slideIndex];
    document.getElementById("storySlideBody").innerHTML =
      '<div class="story-icon">' + slide.icon + "</div>" +
      "<h3>" + slide.title + "</h3>" +
      "<p>" + slide.text + "</p>";
    renderProgress();
    clearTimeout(timer);
    timer = setTimeout(advance, 5000);
  }

  function advance() {
    slideIndex += 1;
    if (slideIndex >= currentStory.slides.length) {
      utils.closePanels();
      return;
    }
    renderSlide();
  }

  function back() {
    slideIndex = Math.max(0, slideIndex - 1);
    renderSlide();
  }

  function open(id) {
    const story = STORIES.find((s) => s.id === id);
    if (!story) return;
    currentStory = story;
    slideIndex = 0;
    markSeen(id);
    renderBubbles();
    renderSlide();
    utils.openPanel(document.getElementById("storyModal"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById("storiesTrack");
    const modal = document.getElementById("storyModal");
    if (!track || !modal) return;

    renderBubbles();

    track.addEventListener("click", (e) => {
      const bubble = e.target.closest("[data-story]");
      if (bubble) open(bubble.dataset.story);
    });

    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-story-next]")) advance();
      else if (e.target.closest("[data-story-prev]")) back();
    });

    modal.addEventListener("transitionend", (e) => {
      if (e.target === modal && !modal.classList.contains("open")) clearTimeout(timer);
    });
  });
})(window.Aromio);
