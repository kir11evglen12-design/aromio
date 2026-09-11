/* ==========================================================================
   AROMIO — product & content data
   Single source of truth for products, promo codes and the fragrance quiz.
   ========================================================================== */

(function (Aromio) {
  "use strict";

  /** Derive 2ml / 30ml / 50ml / 100ml prices from a 50ml base price, rounded to a "…90" ending. */
  function round90(n) {
    return Math.round((n - 90) / 100) * 100 + 90;
  }

  // Volumes stay in ascending ml order; index 2 (50ml) is the catalog reference tier.
  function volumesFrom(base50) {
    return [
      { ml: 2, price: round90(base50 * 0.06), sample: true },
      { ml: 30, price: round90(base50 * 0.72) },
      { ml: 50, price: base50 },
      { ml: 100, price: round90(base50 * 1.6) },
    ];
  }

  // category: "women" | "men" | "unisex" | "niche"  (primary catalog tab)
  // gender:   "women" | "men" | "unisex"             (used by the fragrance quiz)
  // family:   "floral" | "woody" | "oriental" | "citrus" | "fougere"
  const RAW_PRODUCTS = [
    {
      id: 1, code: "No. 01", name: "Nocturne", category: "women", gender: "women", family: "floral",
      price50: 4990, oldPrice50: 5990, badges: [], rating: 4.8, reviews: 124,
      intensity: 3, occasions: ["evening", "date"], color: "#b33a4b",
      notes: { top: ["Бергамот", "Розовый перец"], heart: ["Роза", "Пион"], base: ["Мускус", "Сандал"] },
      description: "Тёмно-розовый вечерний аромат: холодный вход бергамота раскрывается в бархатное сердце розы и пиона, а мускусно-сандаловый шлейф остаётся до утра.",
    },
    {
      id: 2, code: "No. 02", name: "Onyx", category: "men", gender: "men", family: "woody",
      price50: 5490, oldPrice50: null, badges: ["bestseller"], rating: 4.7, reviews: 167,
      intensity: 4, occasions: ["evening", "date"], color: "#2f2f2f",
      notes: { top: ["Чёрный перец", "Грейпфрут"], heart: ["Кедр", "Ветивер"], base: ["Пачули", "Кожа"] },
      description: "Плотный древесно-кожаный аромат для вечера: перечная искра сверху, кедрово-ветиверное сердце и обволакивающий шлейф кожи и пачули.",
    },
    {
      id: 3, code: "No. 03", name: "Ombre Neutre", category: "unisex", gender: "unisex", family: "woody",
      price50: 5990, oldPrice50: null, badges: ["bestseller"], rating: 4.8, reviews: 176,
      intensity: 3, occasions: ["office", "casual"], color: "#6d6a5e",
      notes: { top: ["Кардамон", "Бергамот"], heart: ["Кашемировое дерево", "Ирис"], base: ["Мускус", "Амбра"] },
      description: "Универсальный «тёплый минимализм»: пудровый кашемир и ирис на мускусно-амбровой базе, одинаково уместный днём и вечером.",
    },
    {
      id: 4, code: "No. 04", name: "Black Oud", category: "niche", gender: "unisex", family: "oriental",
      price50: 6490, oldPrice50: null, badges: ["bestseller", "limited"], rating: 4.9, reviews: 210,
      intensity: 5, occasions: ["evening", "special"], color: "#1c1414",
      notes: { top: ["Шафран", "Роза"], heart: ["Уд", "Ладан"], base: ["Амбра", "Сандал"] },
      description: "Нишевый уд-аромат максимальной плотности: шафран и роза сгорают в дымном сердце уда и ладана, шлейф держится больше суток.",
    },
    {
      id: 5, code: "No. 05", name: "Velvet Bloom", category: "women", gender: "women", family: "floral",
      price50: 4590, oldPrice50: null, badges: [], rating: 4.6, reviews: 89,
      intensity: 2, occasions: ["office", "casual"], color: "#c96b7c",
      notes: { top: ["Груша", "Розовый перец"], heart: ["Пион", "Ландыш"], base: ["Белый мускус"] },
      description: "Лёгкий дневной букет из груши и пиона на прозрачном мускусном фоне — для офиса и повседневной элегантности.",
    },
    {
      id: 6, code: "No. 06", name: "Cedar & Smoke", category: "men", gender: "men", family: "woody",
      price50: 5290, oldPrice50: 6190, badges: ["sale"], rating: 4.6, reviews: 98,
      intensity: 3, occasions: ["office", "evening"], color: "#4a3b32",
      notes: { top: ["Апельсин", "Кориандр"], heart: ["Кедр", "Табак"], base: ["Ветивер", "Смола"] },
      description: "Дымчатый кедр с нотой табачного листа — уверенный аромат на каждый день, который не боится вечерних встреч.",
    },
    {
      id: 7, code: "No. 07", name: "Skin to Skin", category: "unisex", gender: "unisex", family: "fougere",
      price50: 6990, oldPrice50: null, badges: [], rating: 4.5, reviews: 62,
      intensity: 2, occasions: ["casual", "date"], color: "#a89b8a",
      notes: { top: ["Лаванда", "Бергамот"], heart: ["Гелиотроп", "Миндаль"], base: ["Тонка", "Мускус"] },
      description: "«Вторая кожа»: тёплая миндально-лавандовая фужерная композиция почти без границ — аромат, который кажется естественным.",
    },
    {
      id: 8, code: "No. 08", name: "Santal Rituel", category: "niche", gender: "men", family: "woody",
      price50: 7490, oldPrice50: null, badges: ["bestseller"], rating: 4.8, reviews: 154,
      intensity: 4, occasions: ["evening", "date"], color: "#7a5230",
      notes: { top: ["Кардамон", "Розовый перец"], heart: ["Сандал", "Роза"], base: ["Амбра", "Кедр"] },
      description: "Ритуальный санталовый аромат нишевой линии: маслянистый сандал и роза на амброво-кедровом фундаменте.",
    },
    {
      id: 9, code: "No. 09", name: "Rose Élixir", category: "women", gender: "women", family: "oriental",
      price50: 6290, oldPrice50: 7290, badges: ["sale"], rating: 4.9, reviews: 201,
      intensity: 4, occasions: ["evening", "special"], color: "#8d2635",
      notes: { top: ["Малина", "Сафран"], heart: ["Роза", "Гвоздика"], base: ["Пачули", "Ваниль"] },
      description: "Насыщенный ориентальный эликсир: сочная малина и шафран вокруг бархатной розы, ванильно-пачулиевый шлейф для особых вечеров.",
    },
    {
      id: 10, code: "No. 10", name: "Iron Coast", category: "men", gender: "men", family: "fougere",
      price50: 5790, oldPrice50: null, badges: [], rating: 4.4, reviews: 41,
      intensity: 3, occasions: ["casual", "office"], color: "#35506b",
      notes: { top: ["Морская нота", "Грейпфрут"], heart: ["Лаванда", "Гальбанум"], base: ["Амброксан", "Кедр"] },
      description: "Свежий «прибрежный» фужер: солёная минеральность и грейпфрут сверху, амброксановый чистый шлейф — на каждый день.",
    },
    {
      id: 11, code: "No. 11", name: "Grey Vetiver Mood", category: "unisex", gender: "unisex", family: "woody",
      price50: 5490, oldPrice50: 6490, badges: ["sale"], rating: 4.6, reviews: 88,
      intensity: 3, occasions: ["evening", "casual"], color: "#575a52",
      notes: { top: ["Грейпфрут", "Перец"], heart: ["Ветивер", "Герань"], base: ["Кедр", "Мускус"] },
      description: "Земляной ветивер с перечной свежестью — сдержанный унисекс-аромат для города и вечерних прогулок.",
    },
    {
      id: 12, code: "No. 12", name: "Verde Immortelle", category: "niche", gender: "women", family: "floral",
      price50: 6990, oldPrice50: 7990, badges: ["sale"], rating: 4.7, reviews: 71,
      intensity: 3, occasions: ["special", "casual"], color: "#4f6b4a",
      notes: { top: ["Зелёные листья", "Бергамот"], heart: ["Бессмертник", "Жасмин"], base: ["Мёд", "Мускус"] },
      description: "Зелёно-медовый нишевый букет: горьковатый бессмертник и жасмин, тающие в мускусно-медовом шлейфе.",
    },
    {
      id: 13, code: "No. 13", name: "Lumière", category: "women", gender: "women", family: "citrus",
      price50: 4290, oldPrice50: null, badges: [], rating: 4.5, reviews: 56,
      intensity: 2, occasions: ["casual", "office"], color: "#e0a96d",
      notes: { top: ["Лимон", "Бергамот"], heart: ["Нероли", "Жасмин"], base: ["Белый мускус"] },
      description: "Солнечный цитрусовый всплеск лимона и нероли на лёгкой мускусной базе — аромат для ясных дней.",
    },
    {
      id: 14, code: "No. 14", name: "Amber Noir", category: "men", gender: "men", family: "oriental",
      price50: 6990, oldPrice50: null, badges: [], rating: 4.9, reviews: 143,
      intensity: 5, occasions: ["evening", "special"], color: "#6b3e26",
      notes: { top: ["Корица", "Бергамот"], heart: ["Амбра", "Табак"], base: ["Пачули", "Ваниль"] },
      description: "Плотный амбрено-табачный аромат для холодных вечеров: пряная корица, тёплая амбра и ванильно-пачулиевое дно.",
    },
    {
      id: 15, code: "No. 15", name: "Solstice", category: "unisex", gender: "unisex", family: "citrus",
      price50: 4890, oldPrice50: null, badges: [], rating: 4.3, reviews: 34,
      intensity: 2, occasions: ["casual", "date"], color: "#d9b26a",
      notes: { top: ["Мандарин", "Имбирь"], heart: ["Нероли", "Инжир"], base: ["Кедр", "Мускус"] },
      description: "Тёплый цитрусовый унисекс-аромат — имбирно-мандариновая искра и инжирная мягкость сердца.",
    },
    {
      id: 16, code: "No. 16", name: "Musc Éternel", category: "niche", gender: "unisex", family: "oriental",
      price50: 7990, oldPrice50: null, badges: ["limited"], rating: 4.9, reviews: 97,
      intensity: 4, occasions: ["evening", "special"], color: "#3a2e35",
      notes: { top: ["Инжир", "Розовый перец"], heart: ["Ирис", "Мускус"], base: ["Амбра", "Кашемировое дерево"] },
      description: "Коллекционный мускусный аромат: инжирная свежесть, пудровый ирис и бесконечный тёплый мускусно-амбровый след.",
    },
    {
      id: 17, code: "No. 17", name: "Iris Nocturne", category: "women", gender: "women", family: "floral",
      price50: 5690, oldPrice50: null, badges: [], rating: 4.4, reviews: 29,
      intensity: 3, occasions: ["evening", "office"], color: "#a8577a",
      notes: { top: ["Бергамот", "Малина"], heart: ["Ирис", "Фиалка"], base: ["Мускус", "Ветивер"] },
      description: "Пудровый ирис на малиново-бергамотовой искре — сдержанный вечерний аромат для города.",
    },
    {
      id: 18, code: "No. 18", name: "Bianco Fiore", category: "women", gender: "women", family: "floral",
      price50: 3990, oldPrice50: null, badges: ["new"], rating: 4.2, reviews: 18,
      intensity: 1, occasions: ["day", "casual"], color: "#eddce0",
      notes: { top: ["Лимон", "Пион"], heart: ["Жасмин", "Ландыш"], base: ["Белый мускус"] },
      description: "Лёгкий белый букет пиона и ландыша — простой и свежий аромат на каждый день.",
    },
    {
      id: 19, code: "No. 19", name: "Ambra Dolce", category: "women", gender: "women", family: "oriental",
      price50: 8990, oldPrice50: null, badges: ["bestseller"], rating: 4.8, reviews: 167,
      intensity: 4, occasions: ["evening", "special"], color: "#7a3b2e",
      notes: { top: ["Мандарин", "Гвоздика"], heart: ["Амбра", "Роза"], base: ["Ваниль", "Сандал"] },
      description: "Сладкая амбра с пряной гвоздикой и ванильно-сандаловым дном — для холодных вечеров.",
    },
    {
      id: 20, code: "No. 20", name: "Fico di Sole", category: "women", gender: "women", family: "citrus",
      price50: 4490, oldPrice50: 5290, badges: ["sale"], rating: 4.5, reviews: 64,
      intensity: 2, occasions: ["day", "casual"], color: "#d8b25c",
      notes: { top: ["Инжир", "Бергамот"], heart: ["Жасмин", "Зелёный лист"], base: ["Кедр", "Мускус"] },
      description: "Солнечный инжир и зелёный жасмин на лёгкой кедровой базе — аромат итальянского полдня.",
    },
    {
      id: 21, code: "No. 21", name: "Rosa Segreta", category: "women", gender: "women", family: "floral",
      price50: 6990, oldPrice50: null, badges: ["limited"], rating: 4.9, reviews: 88,
      intensity: 3, occasions: ["date", "special"], color: "#c23f56",
      notes: { top: ["Розовый перец", "Личи"], heart: ["Дамасская роза", "Пион"], base: ["Мускус", "Кашемировое дерево"] },
      description: "Лимитированная роза: сочный личи сверху, бархатное сердце дамасской розы, тёплый мускусный шлейф.",
    },
    {
      id: 22, code: "No. 22", name: "Notte Blu", category: "women", gender: "women", family: "oriental",
      price50: 9990, oldPrice50: null, badges: ["bestseller", "limited"], rating: 4.9, reviews: 211,
      intensity: 5, occasions: ["evening", "special"], color: "#1c2a4a",
      notes: { top: ["Бергамот", "Кардамон"], heart: ["Ирис", "Фиалка"], base: ["Амбра", "Ветивер"] },
      description: "Ночной флагман линии: холодный ирис и тёплая амбра сталкиваются в глубокой, почти чёрной композиции.",
    },
    {
      id: 23, code: "No. 23", name: "Cuoio Nero", category: "men", gender: "men", family: "woody",
      price50: 6490, oldPrice50: null, badges: [], rating: 4.7, reviews: 132,
      intensity: 4, occasions: ["evening", "office"], color: "#3a2a20",
      notes: { top: ["Бергамот", "Чёрный перец"], heart: ["Кожа", "Табак"], base: ["Пачули", "Ветивер"] },
      description: "Плотная чёрная кожа с табачным сердцем — уверенный аромат для вечерних переговоров.",
    },
    {
      id: 24, code: "No. 24", name: "Marina Blu", category: "men", gender: "men", family: "citrus",
      price50: 4290, oldPrice50: null, badges: ["new"], rating: 4.3, reviews: 22,
      intensity: 1, occasions: ["day", "casual"], color: "#4778a6",
      notes: { top: ["Лимон", "Морская нота"], heart: ["Розмарин", "Лаванда"], base: ["Мускус", "Амброксан"] },
      description: "Лёгкий средиземноморский всплеск лимона и розмарина — на каждый жаркий день.",
    },
    {
      id: 25, code: "No. 25", name: "Fumo di Quercia", category: "men", gender: "men", family: "woody",
      price50: 7290, oldPrice50: 8290, badges: ["sale"], rating: 4.6, reviews: 57,
      intensity: 4, occasions: ["evening", "special"], color: "#4e3a2a",
      notes: { top: ["Дымная нота", "Грейпфрут"], heart: ["Дуб", "Кедр"], base: ["Ветивер", "Смола"] },
      description: "Дымный дуб и смолистый ветивер — аромат старой библиотеки и вечернего камина.",
    },
    {
      id: 26, code: "No. 26", name: "Ferro e Vetiver", category: "men", gender: "men", family: "fougere",
      price50: 5990, oldPrice50: null, badges: [], rating: 4.4, reviews: 41,
      intensity: 3, occasions: ["office", "casual"], color: "#52585c",
      notes: { top: ["Мята", "Бергамот"], heart: ["Ветивер", "Герань"], base: ["Мускус", "Кедр"] },
      description: "Металлическая свежесть мяты поверх земляного ветивера — строгий офисный характер.",
    },
    {
      id: 27, code: "No. 27", name: "Tabacco Reale", category: "men", gender: "men", family: "oriental",
      price50: 8490, oldPrice50: null, badges: ["limited"], rating: 4.9, reviews: 149,
      intensity: 5, occasions: ["evening", "special"], color: "#5a3418",
      notes: { top: ["Ром", "Корица"], heart: ["Табак", "Кожа"], base: ["Ваниль", "Пачули"] },
      description: "Ромовый табак с кожаным сердцем — плотный лимитированный аромат для особых вечеров.",
    },
    {
      id: 28, code: "No. 28", name: "Sale Marino", category: "men", gender: "men", family: "fougere",
      price50: 4790, oldPrice50: null, badges: [], rating: 4.2, reviews: 15,
      intensity: 2, occasions: ["day", "casual"], color: "#6e8f96",
      notes: { top: ["Морская соль", "Бергамот"], heart: ["Шалфей", "Лаванда"], base: ["Амброксан", "Кедр"] },
      description: "Солёный бриз и шалфей — свежий будничный аромат для прогулок вдоль побережья.",
    },
    {
      id: 29, code: "No. 29", name: "Neve", category: "unisex", gender: "unisex", family: "woody",
      price50: 6290, oldPrice50: null, badges: ["new"], rating: 4.5, reviews: 33,
      intensity: 2, occasions: ["day", "office"], color: "#cfd3d6",
      notes: { top: ["Кардамон", "Груша"], heart: ["Кашемировое дерево", "Ирис"], base: ["Мускус", "Сандал"] },
      description: "«Снежная» пудровая композиция: кашемировое дерево и ирис на мягком мускусном фоне.",
    },
    {
      id: 30, code: "No. 30", name: "Fumo Bianco", category: "unisex", gender: "unisex", family: "oriental",
      price50: 7990, oldPrice50: 9290, badges: ["sale"], rating: 4.7, reviews: 79,
      intensity: 4, occasions: ["evening", "date"], color: "#8a8378",
      notes: { top: ["Ладан", "Бергамот"], heart: ["Ладанник", "Роза"], base: ["Амбра", "Кедр"] },
      description: "Белый дым ладана и ладанника вокруг розы — унисекс-аромат для особенных вечеров.",
    },
    {
      id: 31, code: "No. 31", name: "Foglia d'Oro", category: "unisex", gender: "unisex", family: "woody",
      price50: 9490, oldPrice50: null, badges: ["limited"], rating: 4.9, reviews: 102,
      intensity: 4, occasions: ["special", "evening"], color: "#8c6a2f",
      notes: { top: ["Шафран", "Мандарин"], heart: ["Сандал", "Кожа"], base: ["Амбра", "Ваниль"] },
      description: "«Золотой лист»: шафран и сандаловая кожа в лимитированной унисекс-композиции.",
    },
    {
      id: 32, code: "No. 32", name: "Acqua Chiara", category: "unisex", gender: "unisex", family: "citrus",
      price50: 3990, oldPrice50: null, badges: [], rating: 4.1, reviews: 12,
      intensity: 1, occasions: ["day", "casual"], color: "#9fd0c7",
      notes: { top: ["Бергамот", "Мята"], heart: ["Нероли", "Зелёный чай"], base: ["Белый мускус"] },
      description: "Прозрачная водяная свежесть бергамота и зелёного чая — базовый аромат на каждый день.",
    },
    {
      id: 33, code: "No. 33", name: "Pietra Grigia", category: "unisex", gender: "unisex", family: "woody",
      price50: 6790, oldPrice50: null, badges: [], rating: 4.6, reviews: 94,
      intensity: 3, occasions: ["office", "casual"], color: "#6d6963",
      notes: { top: ["Перец", "Грейпфрут"], heart: ["Ветивер", "Ирис"], base: ["Кедр", "Мускус"] },
      description: "«Серый камень»: минеральный ветивер и пудровый ирис — сдержанный городской унисекс.",
    },
    {
      id: 34, code: "No. 34", name: "Vento del Sud", category: "unisex", gender: "unisex", family: "fougere",
      price50: 5490, oldPrice50: null, badges: [], rating: 4.3, reviews: 27,
      intensity: 2, occasions: ["casual", "date"], color: "#b7a888",
      notes: { top: ["Бергамот", "Лаванда"], heart: ["Гелиотроп", "Миндаль"], base: ["Тонка", "Мускус"] },
      description: "Тёплый южный ветер: миндальный гелиотроп на лавандовой свежести.",
    },
    {
      id: 35, code: "No. 35", name: "Incenso Sacro", category: "niche", gender: "unisex", family: "oriental",
      price50: 10990, oldPrice50: null, badges: ["bestseller", "limited"], rating: 4.9, reviews: 188,
      intensity: 5, occasions: ["special", "evening"], color: "#241a14",
      notes: { top: ["Ладан", "Шафран"], heart: ["Роза", "Уд"], base: ["Амбра", "Сандал"] },
      description: "Флагман нишевой линии: храмовый ладан и дымный уд вокруг розы, стойкость больше суток.",
    },
    {
      id: 36, code: "No. 36", name: "Giardino Segreto", category: "niche", gender: "women", family: "floral",
      price50: 8290, oldPrice50: 9490, badges: ["sale"], rating: 4.7, reviews: 61,
      intensity: 3, occasions: ["special", "day"], color: "#5c7048",
      notes: { top: ["Зелёные листья", "Фрезия"], heart: ["Жасмин", "Тубероза"], base: ["Мускус", "Кедр"] },
      description: "«Тайный сад»: зелёная фрезия и плотная тубероза — нишевой букет для особого дня.",
    },
    {
      id: 37, code: "No. 37", name: "Cenere", category: "niche", gender: "men", family: "woody",
      price50: 9990, oldPrice50: null, badges: ["limited"], rating: 4.8, reviews: 73,
      intensity: 4, occasions: ["evening", "special"], color: "#4a4642",
      notes: { top: ["Дымная нота", "Кардамон"], heart: ["Ветивер", "Кожа"], base: ["Пачули", "Смола"] },
      description: "«Пепел»: обугленный ветивер и кожа — плотный лимитированный аромат для холодных вечеров.",
    },
    {
      id: 38, code: "No. 38", name: "Miele Selvatico", category: "niche", gender: "women", family: "oriental",
      price50: 7690, oldPrice50: null, badges: ["new"], rating: 4.5, reviews: 24,
      intensity: 3, occasions: ["date", "special"], color: "#a67a2e",
      notes: { top: ["Мёд", "Бергамот"], heart: ["Бессмертник", "Роза"], base: ["Ваниль", "Мускус"] },
      description: "«Дикий мёд»: тягучий бессмертник и роза на ванильно-мускусном дне.",
    },
    {
      id: 39, code: "No. 39", name: "Ultima Notte", category: "niche", gender: "unisex", family: "oriental",
      price50: 11990, oldPrice50: null, badges: ["bestseller", "limited"], rating: 4.9, reviews: 230,
      intensity: 5, occasions: ["special", "evening"], color: "#150e12",
      notes: { top: ["Чёрный перец", "Слива"], heart: ["Уд", "Роза"], base: ["Амбра", "Пачули"] },
      description: "«Последняя ночь»: флагман коллекции — сливовая искра, дымный уд и роза на плотной амбровой базе.",
    },
    {
      id: 40, code: "No. 40", name: "Fiore di Sale", category: "niche", gender: "unisex", family: "citrus",
      price50: 5290, oldPrice50: null, badges: ["new"], rating: 4.3, reviews: 19,
      intensity: 2, occasions: ["day", "casual"], color: "#e8c8a0",
      notes: { top: ["Грейпфрут", "Морская соль"], heart: ["Нероли", "Инжир"], base: ["Кедр", "Белый мускус"] },
      description: "«Солёный цветок»: грейпфрут и нероли на кедрово-мускусной базе — нишевая цитрусовая лёгкость.",
    },
  ];

  const PRODUCTS = RAW_PRODUCTS.map((p) => {
    const volumes = volumesFrom(p.price50);
    const price = volumes[2].price;
    const oldPrice = p.oldPrice50 ? round90(p.oldPrice50) : null;
    return Object.assign({}, p, {
      name: p.code + " · " + p.name,
      shortName: p.name,
      brand: "AROMIO",
      volumes: volumes,
      price: price,
      oldPrice: oldPrice,
      discount: oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0,
      slug: "aromio-" + p.code.toLowerCase().replace(/[^\w]+/g, "-"),
    });
  });

  const FAMILY_LABELS = {
    floral: "Цветочный",
    woody: "Древесный",
    oriental: "Восточный",
    citrus: "Цитрусовый",
    fougere: "Фужерный",
  };

  const CATEGORY_LABELS = {
    all: "Все",
    women: "Женские",
    men: "Мужские",
    unisex: "Унисекс",
    niche: "Нишевая",
  };

  const BADGE_LABELS = {
    bestseller: "Бестселлер",
    new: "Новинка",
    sale: "Скидка",
    limited: "Лимитировано",
  };

  const PROMO_CODES = {
    AROMIO10: { type: "percent", value: 10, minTotal: 0, description: "−10% на любой заказ" },
    SUMMER20: { type: "percent", value: 20, minTotal: 10000, description: "−20% при заказе от 10 000 ₽" },
    WELCOME500: { type: "fixed", value: 500, minTotal: 3000, description: "−500 ₽ за подписку на новости" },
  };

  const QUIZ_QUESTIONS = [
    {
      id: "gender",
      question: "Для кого подбираем аромат?",
      options: [
        { label: "Женский", value: "women" },
        { label: "Мужской", value: "men" },
        { label: "Унисекс", value: "unisex" },
        { label: "Не важно", value: "any" },
      ],
    },
    {
      id: "time",
      question: "Когда чаще всего будете его носить?",
      options: [
        { label: "Днём, повседневно", value: "day" },
        { label: "Вечером, на встречах", value: "evening" },
      ],
    },
    {
      id: "family",
      question: "Какой характер аромата вам ближе?",
      options: [
        { label: "Свежий и лёгкий", value: "citrus" },
        { label: "Цветочный и нежный", value: "floral" },
        { label: "Древесный и тёплый", value: "woody" },
        { label: "Пряный и мужественный", value: "fougere" },
        { label: "Насыщенный и загадочный", value: "oriental" },
      ],
    },
    {
      id: "occasion",
      question: "Для какого повода?",
      options: [
        { label: "Повседневно", value: "casual" },
        { label: "Работа", value: "office" },
        { label: "Свидание", value: "date" },
        { label: "Особый случай", value: "special" },
      ],
    },
  ];

  Aromio.PRODUCTS = PRODUCTS;
  Aromio.FAMILY_LABELS = FAMILY_LABELS;
  Aromio.CATEGORY_LABELS = CATEGORY_LABELS;
  Aromio.BADGE_LABELS = BADGE_LABELS;
  Aromio.PROMO_CODES = PROMO_CODES;
  Aromio.QUIZ_QUESTIONS = QUIZ_QUESTIONS;
})((window.Aromio = window.Aromio || {}));
