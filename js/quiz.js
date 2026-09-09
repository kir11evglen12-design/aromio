/* ==========================================================================
   AROMIO — fragrance finder quiz
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  const QUESTIONS = Aromio.QUIZ_QUESTIONS;

  let stepIndex = 0;
  let answers = {};

  function scoreProduct(p) {
    let score = 0;

    if (answers.gender && answers.gender !== "any") {
      score += p.gender === answers.gender ? 3 : 0;
    } else {
      score += 1;
    }

    if (answers.family) score += p.family === answers.family ? 4 : 0;
    if (answers.time === "day" && p.intensity <= 3) score += 2;
    if (answers.time === "evening" && p.intensity >= 3) score += 2;
    if (answers.occasion && p.occasions.indexOf(answers.occasion) > -1) score += 2;

    return score + p.rating / 10;
  }

  function topMatches() {
    return Aromio.PRODUCTS.slice()
      .sort((a, b) => scoreProduct(b) - scoreProduct(a))
      .slice(0, 3);
  }

  function questionHtml(question, index) {
    return (
      '<div class="quiz-step">' +
      '<p class="quiz-step-label">Шаг ' + (index + 1) + " из " + QUESTIONS.length + "</p>" +
      "<h3>" + question.question + "</h3>" +
      '<div class="quiz-options">' +
      question.options
        .map((o) => '<button type="button" class="quiz-option" data-value="' + o.value + '">' + o.label + "</button>")
        .join("") +
      "</div>" +
      (index > 0 ? '<button type="button" class="quiz-back" data-back>← Назад</button>' : "") +
      "</div>"
    );
  }

  function resultHtml() {
    const matches = topMatches();
    return (
      '<div class="quiz-result">' +
      '<p class="quiz-step-label">Ваш подбор готов</p>' +
      "<h3>Вам подойдёт</h3>" +
      '<div class="product-grid product-grid--compact">' + matches.map(Aromio.Card.renderGrid).join("") + "</div>" +
      '<button type="button" class="btn btn--outline" data-restart>Пройти заново</button>' +
      "</div>"
    );
  }

  function progress() {
    return stepIndex >= QUESTIONS.length ? 100 : Math.round((stepIndex / QUESTIONS.length) * 100);
  }

  function render(bodyEl, progressEl) {
    progressEl.style.setProperty("--step-progress", progress() + "%");
    bodyEl.classList.remove("is-entering");

    if (stepIndex >= QUESTIONS.length) {
      bodyEl.innerHTML = resultHtml();
    } else {
      bodyEl.innerHTML = questionHtml(QUESTIONS[stepIndex], stepIndex);
    }

    requestAnimationFrame(() => bodyEl.classList.add("is-entering"));
  }

  function reset() {
    stepIndex = 0;
    answers = {};
  }

  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("quizModal");
    if (!modal) return;

    const bodyEl = document.getElementById("quizBody");
    const progressEl = document.getElementById("quizProgress");

    bodyEl.addEventListener("click", (e) => {
      const option = e.target.closest(".quiz-option");
      if (option) {
        answers[QUESTIONS[stepIndex].id] = option.dataset.value;
        stepIndex += 1;
        setTimeout(() => render(bodyEl, progressEl), 200);
        return;
      }

      if (e.target.closest("[data-back]")) {
        stepIndex = Math.max(0, stepIndex - 1);
        render(bodyEl, progressEl);
        return;
      }

      if (e.target.closest("[data-restart]")) {
        reset();
        render(bodyEl, progressEl);
      }
    });

    modal.addEventListener("transitionend", (e) => {
      if (e.target === modal && !modal.classList.contains("open")) {
        reset();
        render(bodyEl, progressEl);
      }
    });

    render(bodyEl, progressEl);
  });
})(window.Aromio);
