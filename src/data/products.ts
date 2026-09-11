import donnaGreen from "../../assets/opt/valentino-donna-green-stravaganza.webp";

/* shots supplied on a black ground: they sit straight on the dark card */
import shotFahrenheit from "../../assets/opt/dior-fahrenheit.webp";
import shotEyes from "../../assets/opt/lv-eyes.webp";
import shotImagination from "../../assets/opt/lv-imagination.webp";
import shotUomo from "../../assets/opt/valentino-uomo.webp";
import shotUomoRoma from "../../assets/opt/valentino-uomo-roma.webp";
import shotUomoIntense from "../../assets/opt/valentino-uomo-intense.webp";
import shotDonna from "../../assets/opt/valentino-donna.webp";
import shotDonnaRoma from "../../assets/opt/valentino-donna-roma.webp";
import shotDonnaPurple from "../../assets/opt/valentino-donna-purple.webp";
import shotDonnaYellow from "../../assets/opt/valentino-donna-yellow.webp";

export type Category = "women" | "men" | "unisex" | "niche";

export interface Variant {
  /** volume in millilitres */
  ml: number;
  price: number;
  /** a decant to try, not a bottle to own */
  sample?: boolean;
}

export interface Notes {
  top: string;
  heart: string;
  base: string;
}

export interface Product {
  id: number;
  /** shown as the product title; the house is carried in `brand` */
  name: string;
  brand: string;
  /** price of the reference 100 ml bottle; variants carry the rest */
  price: number;
  variants: Variant[];
  category: Category;
  /** collection or line inside the house */
  line: string;
  /** liquid colour of the CSS bottle, and the scene tint in the picker */
  tint: string;
  type: string;
  desc: string;
  notes: Notes;
  /** official brand shot, supplied by the store owner */
  photo?: string;
  /** the shot is on a black ground rather than a white studio sweep */
  photoDark?: boolean;
  /** the nose, where the house has named one */
  nose?: string;
  /**
   * A running promotion, in percent off the list price. The list price is
   * what the shop charges outside the promo, and the cart charges the
   * discounted one — the strike-through is not decoration.
   */
  sale?: number;
  /**
   * The shop has not given us the composition of this bottle. We say so
   * rather than inventing a pyramid: an empty note list is honest, a
   * guessed one is not.
   */
  notesUnknown?: boolean;
}

export const CATEGORY_LABEL: Record<Category | "all", string> = {
  all: "Все",
  women: "Женские",
  men: "Мужские",
  unisex: "Унисекс",
  niche: "Нишевая"
};

export const HOUSES = [
  "DIOR", "LOUIS VUITTON", "VALENTINO", "JEAN PAUL GAULTIER", "LACOSTE",
  "CHANEL", "TOM FORD", "YVES SAINT LAURENT", "PACO RABANNE", "CREED"
] as const;
export type House = (typeof HOUSES)[number];

export const products: Product[] = [
  /* ---------------- DIOR ---------------- */
  {
    id: 1, name: "Sauvage", brand: "DIOR", price: 11490, category: "men",
    variants: [{ ml: 50, price: 7090 }, { ml: 100, price: 11490 }, { ml: 125, price: 13990 }],
    line: "SAUVAGE", tint: "#6d7f8c", type: "Eau de Parfum",
    desc: "Пустынный минерализм: раскалённый бергамот на старте, лаванда в сердце и амброво-ванильный след.",
    notes: {
      top: "Бергамот, грейпфрут",
      heart: "Лаванда, мускатный орех, розовый перец",
      base: "Амбра, ваниль, ветивер, кедр"
    }
  },
  {
    id: 2, name: "Homme Intense", brand: "DIOR", price: 12990, category: "men",
    variants: [{ ml: 50, price: 8090 }, { ml: 100, price: 12990 }, { ml: 125, price: 15790 }],
    line: "HOMME", tint: "#6a5a66", type: "Eau de Parfum",
    desc: "Пудровый ирис, вписанный в тёплую древесную оправу — самый «костюмный» аромат дома.",
    notes: {
      top: "Лаванда, бергамот",
      heart: "Ирис, пачули, амбра",
      base: "Ваниль, сандал, кожа, кедр"
    }
  },
  {
    id: 3, name: "Miss Dior", brand: "DIOR", price: 13490, sale: 10, category: "women",
    variants: [{ ml: 50, price: 8390 }, { ml: 100, price: 13490 }, { ml: 125, price: 16490 }],
    line: "MISS DIOR", tint: "#d98fa0", type: "Eau de Parfum",
    desc: "Цветочный шипр нового поколения: роза центифолия, подсвеченная бергамотом и пачули.",
    notes: {
      top: "Бергамот, мандарин",
      heart: "Роза центифолия, пион, жасмин",
      base: "Белый мускус, пачули, ваниль, сандал"
    }
  },
  {
    id: 4, name: "J’adore", brand: "DIOR", price: 13990, category: "women",
    variants: [{ ml: 50, price: 8690 }, { ml: 100, price: 13990 }, { ml: 125, price: 17090 }],
    line: "J’ADORE", tint: "#d9b45a", type: "Eau de Parfum",
    desc: "Золотой цветочный букет: иланг-иланг, дамасская роза и жасмин самбак в одной ноте.",
    notes: {
      top: "Лимон, иланг-иланг",
      heart: "Жасмин самбак, роза, тубероза",
      base: "Белый мускус, ваниль, сандал, кедр"
    }
  },

  /* ---------------- LOUIS VUITTON ---------------- */
  {
    id: 5, name: "Imagination", brand: "LOUIS VUITTON", price: 33900, category: "men",
    variants: [{ ml: 100, price: 33890 }, { ml: 200, price: 52490 }],
    line: "LES PARFUMS", tint: "#6fcac0", type: "Eau de Parfum",
    photo: shotImagination, photoDark: true,
    desc: "Прозрачная цитрусовая акварель на чайной основе — лёгкий, но стойкий дневной аромат.",
    notes: {
      top: "Бергамот, лимон",
      heart: "Чёрный чай, кардамон, шафран",
      base: "Амбра, сандал, ветивер, белый мускус"
    }
  },
  {
    id: 6, name: "Ombre Nomade", brand: "LOUIS VUITTON", price: 42900, sale: 15, category: "niche",
    variants: [{ ml: 100, price: 42890 }, { ml: 200, price: 66490 }],
    line: "LES PARFUMS", tint: "#6b2f2a", type: "Eau de Parfum",
    desc: "Плотный уд с розой и ладаном: самый узнаваемый ночной аромат дома, шлейф читается через комнату.",
    notes: {
      top: "Малина, шафран",
      heart: "Роза, уд, ладан",
      base: "Уд, сандал, амбра, кожа"
    }
  },
  {
    id: 7, name: "Attrape-Rêves", brand: "LOUIS VUITTON", price: 33900, category: "women",
    variants: [{ ml: 100, price: 33890 }, { ml: 200, price: 52490 }],
    line: "LES PARFUMS", tint: "#8d5fa0", type: "Eau de Parfum",
    desc: "Пион и личи на пачулевой подушке — сладкий, но не приторный цветочный шлейф.",
    notes: {
      top: "Личи, бергамот",
      heart: "Пион, жасмин, роза",
      base: "Пачули, ваниль, сандал, белый мускус"
    }
  },
  {
    id: 8, name: "Météore", brand: "LOUIS VUITTON", price: 33900, category: "men",
    variants: [{ ml: 100, price: 33890 }, { ml: 200, price: 52490 }],
    line: "LES PARFUMS", tint: "#7fa3b8", type: "Eau de Parfum",
    desc: "Холодный цитрус с мятной искрой и минеральной древесной базой — аромат ясного утра.",
    notes: {
      top: "Лимон, грейпфрут",
      heart: "Мята, кардамон, можжевельник",
      base: "Пачули, сандал, амбра, ветивер"
    }
  },

  /* ---------------- VALENTINO ---------------- */
  {
    id: 9, name: "Uomo Born In Roma", brand: "VALENTINO", price: 9990, category: "men",
    variants: [{ ml: 50, price: 6190 }, { ml: 100, price: 9990 }, { ml: 150, price: 13990 }],
    line: "BORN IN ROMA", tint: "#9fb050", type: "Eau de Toilette",
    photo: shotUomoRoma, photoDark: true,
    desc: "Контраст римской архитектуры и уличной культуры: пряный имбирь на старте и минеральный кожаный шлейф.",
    notes: {
      top: "Имбирь, лист фиалки",
      heart: "Шалфей, лаванда, жасмин",
      base: "Кожаный аккорд, ветивер, сандал, амбра"
    }
  },
  {
    id: 10, name: "Uomo", brand: "VALENTINO", price: 10490, sale: 10, category: "men",
    variants: [{ ml: 50, price: 6490 }, { ml: 100, price: 10490 }, { ml: 150, price: 14690 }],
    line: "UOMO", tint: "#c08a5a", type: "Eau de Toilette",
    photo: shotUomo, photoDark: true,
    desc: "Гурманская классика дома: обжаренный кофе и джандуйя на тёплой кожаной базе.",
    notes: {
      top: "Бергамот, мирт",
      heart: "Кофе, джандуйя, корица",
      base: "Кожа, сандал, ваниль, кедр"
    }
  },
  {
    id: 11, name: "Donna Born In Roma Green Stravaganza", brand: "VALENTINO", price: 11490,
    variants: [{ ml: 50, price: 7090 }, { ml: 100, price: 11490 }, { ml: 150, price: 16090 }],
    category: "women", line: "BORN IN ROMA", tint: "#a9c94f",
    type: "Eau de Parfum", photo: donnaGreen,
    desc: "Зелёная цитрусовая версия Born In Roma: сочный старт, жасминовое сердце и мягкий мускусный финал.",
    notes: {
      top: "Бергамот, зелёное яблоко",
      heart: "Жасмин грандифлорум, роза, пион",
      base: "Белый мускус, сандал, ваниль, кедр"
    }
  },
  {
    id: 12, name: "Voce Viva", brand: "VALENTINO", price: 10990, category: "women",
    variants: [{ ml: 50, price: 6790 }, { ml: 100, price: 10990 }, { ml: 150, price: 15390 }],
    line: "VOCE VIVA", tint: "#e0c46a", type: "Eau de Parfum",
    desc: "Светлый цветочно-гурманский аромат: апельсиновый цвет и ваниль с кристальным мускусом.",
    notes: {
      top: "Лимон, мандарин",
      heart: "Апельсиновый цвет, жасмин, ландыш",
      base: "Ваниль, белый мускус, амбра, сандал"
    }
  },

  /* ---------------- ПОСТУПИЛИ В ВИТРИНУ ----------------
     Фотографии предоставлены магазином. Там, где состав нам не передали,
     он не выдуман: карточка честно говорит, что нот пока нет.           */
  {
    id: 13, name: "Fahrenheit", brand: "DIOR", price: 12490, sale: 20, category: "men",
    variants: [{ ml: 50, price: 8290 }, { ml: 100, price: 12490 }, { ml: 200, price: 19890 }],
    line: "FAHRENHEIT", tint: "#b8522a", type: "Eau de Toilette",
    photo: shotFahrenheit, photoDark: true,
    desc: "Кожано-бензиновая классика 1988 года: аромат, который тогда никто не смог повторить, а сегодня узнают с первой секунды.",
    notes: {
      top: "Мандарин, боярышник, лаванда",
      heart: "Лист фиалки, мускатный орех, жимолость",
      base: "Кожа, ветивер, кедр, мускус"
    }
  },
  {
    id: 14, name: "Eyes", brand: "LOUIS VUITTON", price: 34900, category: "unisex",
    variants: [{ ml: 100, price: 34890 }, { ml: 200, price: 53490 }],
    line: "LES PARFUMS", tint: "#9a8ef0", type: "Eau de Parfum",
    photo: shotEyes, photoDark: true,
    desc: "Прозрачное сиреневое стекло с монограммой на крышке — линия Les Parfums.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 15, name: "Uomo Intense", brand: "VALENTINO", price: 11990, category: "men",
    variants: [{ ml: 50, price: 7490 }, { ml: 100, price: 11990 }, { ml: 150, price: 16490 }],
    line: "UOMO", tint: "#2f2f34", type: "Eau de Parfum",
    photo: shotUomoIntense, photoDark: true,
    desc: "Чёрное гранёное стекло со стальными шипами по низу флакона и алой подписью дома.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 16, name: "Donna", brand: "VALENTINO", price: 11290, category: "women",
    variants: [{ ml: 50, price: 6990 }, { ml: 100, price: 11290 }, { ml: 150, price: 15790 }],
    line: "DONNA", tint: "#d9c9a3", type: "Eau de Parfum",
    photo: shotDonna, photoDark: true,
    desc: "Кремовое гранёное стекло с золотой крышкой-бантом — самый светлый флакон витрины.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 17, name: "Donna Born In Roma", brand: "VALENTINO", price: 11690, sale: 15, category: "women",
    variants: [{ ml: 50, price: 7290 }, { ml: 100, price: 11690 }, { ml: 150, price: 16290 }],
    line: "BORN IN ROMA", tint: "#e8398f", type: "Eau de Parfum",
    photo: shotDonnaRoma, photoDark: true,
    desc: "Ярко-розовые шипы Born In Roma — версия, которую видно через всю полку.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 18, name: "Donna Purple", brand: "VALENTINO", price: 11690, category: "women",
    variants: [{ ml: 50, price: 7290 }, { ml: 100, price: 11690 }, { ml: 150, price: 16290 }],
    line: "BORN IN ROMA", tint: "#a86fc0", type: "Eau de Parfum",
    photo: shotDonnaPurple, photoDark: true,
    desc: "Фиолетовое гранёное стекло с серебряными шипами и тёмной подписью дома.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 19, name: "Donna Yellow", brand: "VALENTINO", price: 11690, category: "women",
    variants: [{ ml: 50, price: 7290 }, { ml: 100, price: 11690 }, { ml: 150, price: 16290 }],
    line: "BORN IN ROMA", tint: "#d8b63c", type: "Eau de Parfum",
    photo: shotDonnaYellow, photoDark: true,
    desc: "Золотисто-жёлтое стекло на серебряном цоколе — самый солнечный флакон линии.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },

  /* ---------------- JEAN PAUL GAULTIER ---------------- */
  {
    id: 20, name: "Le Male", brand: "JEAN PAUL GAULTIER", price: 8990, category: "men",
    variants: [{ ml: 75, price: 6490 }, { ml: 125, price: 8990 }, { ml: 200, price: 12490 }],
    line: "LE MALE", tint: "#5f8fd0", type: "Eau de Toilette",
    desc: "Мята с лавандой поверх ванильно-тонкового тепла — аромат, который с 1995 года слышно в любой толпе.",
    notes: {
      top: "Мята, лаванда, бергамот",
      heart: "Корица, тмин, апельсиновый цвет",
      base: "Ваниль, бобы тонка, сандал, амбра"
    }
  },
  {
    id: 21, name: "Le Male Elixir", brand: "JEAN PAUL GAULTIER", price: 11490, category: "men",
    variants: [{ ml: 75, price: 8290 }, { ml: 125, price: 11490 }],
    line: "LE MALE", tint: "#8a6a3a", type: "Parfum",
    desc: "Плотная версия классики: тот же силуэт флакона, но звучание гуще и слаще.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },

  /* ---------------- LACOSTE ---------------- */
  {
    id: 22, name: "L.12.12 Blanc", brand: "LACOSTE", price: 6990, sale: 25, category: "men",
    variants: [{ ml: 50, price: 4990 }, { ml: 100, price: 6990 }, { ml: 175, price: 9990 }],
    line: "L.12.12", tint: "#dfe3e7", type: "Eau de Toilette",
    desc: "Белая поло-рубашка в парфюмерии: чистый, лёгкий и подчёркнуто повседневный аромат.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 23, name: "L.12.12 Noir", brand: "LACOSTE", price: 6990, category: "men",
    variants: [{ ml: 50, price: 4990 }, { ml: 100, price: 6990 }],
    line: "L.12.12", tint: "#2b2f33", type: "Eau de Toilette",
    desc: "Тёмная версия той же линии — плотнее и теплее белой, для вечера.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },

  /* ---------------- CHANEL ---------------- */
  {
    id: 24, name: "Bleu de Chanel", brand: "CHANEL", price: 13990, category: "men",
    variants: [{ ml: 50, price: 9490 }, { ml: 100, price: 13990 }, { ml: 150, price: 18490 }],
    line: "BLEU", tint: "#2b4a72", type: "Eau de Parfum", nose: "Жак Польж",
    desc: "Цитрусовый старт на ладанно-древесной базе: дом называет его ароматом свободы от условностей.",
    notes: {
      top: "Грейпфрут, лимон, мята",
      heart: "Имбирь, мускатный орех, жасмин",
      base: "Ладан, кедр, сандал"
    }
  },
  {
    id: 25, name: "Coco Mademoiselle", brand: "CHANEL", price: 14490, category: "women",
    variants: [{ ml: 50, price: 9990 }, { ml: 100, price: 14490 }, { ml: 200, price: 21990 }],
    line: "COCO", tint: "#c9884f", type: "Eau de Parfum", nose: "Жак Польж",
    desc: "Шипр с апельсиновой искрой и пачулевой подписью — один из самых узнаваемых женских ароматов дома.",
    notes: {
      top: "Апельсин, бергамот",
      heart: "Роза, жасмин",
      base: "Пачули, ваниль, белый мускус"
    }
  },

  /* ---------------- TOM FORD ---------------- */
  {
    id: 26, name: "Tobacco Vanille", brand: "TOM FORD", price: 27900, sale: 10, category: "unisex",
    variants: [{ ml: 50, price: 27900 }, { ml: 100, price: 39900 }],
    line: "PRIVATE BLEND", tint: "#7a4a22", type: "Eau de Parfum", nose: "Оливье Жилотен",
    desc: "Табачный лист с ванилью и сухофруктами — плотный, тёплый и очень зимний.",
    notes: {
      top: "Табак, специи",
      heart: "Ваниль, какао, сухофрукты",
      base: "Бобы тонка, древесные ноты"
    }
  },
  {
    id: 27, name: "Lost Cherry", brand: "TOM FORD", price: 29900, category: "unisex",
    variants: [{ ml: 50, price: 29900 }, { ml: 100, price: 42900 }],
    line: "PRIVATE BLEND", tint: "#a52a3c", type: "Eau de Parfum", nose: "Луиза Тёрнер",
    desc: "Вишнёвый ликёр и миндаль поверх тонка-ванильной базы: сладость, доведённая до предела.",
    notes: {
      top: "Вишня, ликёр, миндаль",
      heart: "Роза, жасмин",
      base: "Бобы тонка, ваниль, сандал"
    }
  },

  /* ---------------- YVES SAINT LAURENT ---------------- */
  {
    id: 28, name: "Libre", brand: "YVES SAINT LAURENT", price: 12990, category: "women",
    variants: [{ ml: 50, price: 8990 }, { ml: 90, price: 12990 }, { ml: 150, price: 17490 }],
    line: "LIBRE", tint: "#c8a64a", type: "Eau de Parfum", nose: "Анн Флипо и Карлос Бенаим",
    desc: "Лаванда против ванили — мужской материал в женском аромате, на этом контрасте всё и держится.",
    notes: {
      top: "Лаванда, мандарин, чёрная смородина",
      heart: "Жасмин, апельсиновый цвет",
      base: "Ваниль, мускус, кедр"
    }
  },
  {
    id: 29, name: "Y Eau de Parfum", brand: "YVES SAINT LAURENT", price: 12490, category: "men",
    variants: [{ ml: 60, price: 9490 }, { ml: 100, price: 12490 }, { ml: 200, price: 18990 }],
    line: "Y", tint: "#34424f", type: "Eau de Parfum",
    desc: "Сухая древесина с имбирным стартом: аромат-униформа для рабочей недели.",
    notes: {
      top: "Бергамот, имбирь",
      heart: "Шалфей, герань",
      base: "Кедр, амбра, бобы тонка"
    }
  },

  /* ---------------- PACO RABANNE ---------------- */
  {
    id: 30, name: "1 Million", brand: "PACO RABANNE", price: 9490, sale: 20, category: "men",
    variants: [{ ml: 50, price: 6990 }, { ml: 100, price: 9490 }, { ml: 200, price: 14490 }],
    line: "1 MILLION", tint: "#c2922f", type: "Eau de Toilette",
    nose: "Кристоф Рейно, Оливье Пешё и Мишель Жирар",
    desc: "Корица с кожей под грейпфрутовым стартом — золотой слиток на полке и в звучании.",
    notes: {
      top: "Грейпфрут, мята, мандарин",
      heart: "Корица, роза, кожа",
      base: "Амбра, пачули, кожа"
    }
  },
  {
    id: 31, name: "Invictus", brand: "PACO RABANNE", price: 8990, category: "men",
    variants: [{ ml: 50, price: 6490 }, { ml: 100, price: 8990 }, { ml: 200, price: 13990 }],
    line: "INVICTUS", tint: "#3f6f86", type: "Eau de Toilette",
    desc: "Морская свежесть на древесно-амбровой базе: спортивный профиль, который держится весь день.",
    notes: {
      top: "Грейпфрут, морская нота",
      heart: "Лавр, жасмин",
      base: "Амбра, пачули, дубовый мох"
    }
  },

  /* ---------------- CREED ---------------- */
  {
    id: 32, name: "Aventus", brand: "CREED", price: 38900, category: "niche",
    variants: [{ ml: 50, price: 27900 }, { ml: 100, price: 38900 }, { ml: 120, price: 45900 }],
    line: "AVENTUS", tint: "#6d4a2f", type: "Eau de Parfum", nose: "Эрвен Крид",
    desc: "Дымный ананас с берёзой — аромат, который в 2010-х переписал представление о мужской нише.",
    notes: {
      top: "Ананас, бергамот, чёрная смородина, яблоко",
      heart: "Берёза, пачули, жасмин",
      base: "Мускус, дубовый мох, амбра, ваниль"
    }
  },
  {
    id: 33, name: "Silver Mountain Water", brand: "CREED", price: 35900, category: "unisex",
    variants: [{ ml: 50, price: 25900 }, { ml: 100, price: 35900 }],
    line: "MILLESIME", tint: "#7f98a6", type: "Eau de Parfum",
    desc: "Холодная вода и зелёный чай: прозрачный аромат, придуманный как портрет альпийского ручья.",
    notes: {
      top: "Бергамот, мандарин",
      heart: "Зелёный чай, чёрная смородина",
      base: "Сандал, мускус"
    }
  }
];

/** compositions rendered with the CSS bottle — the picker retints these live */
export const pickerProducts = products.filter(p => !p.photo).slice(0, 8);

export const byId = (id: number): Product =>
  products.find(p => p.id === id) ?? products[0];

export const byHouse = (house: House): Product[] =>
  products.filter(p => p.brand === house);

export const money = (n: number): string => n.toLocaleString("ru-RU") + " ₽";

/** cheapest variant, used for the "от …" price on cards */
/**
 * Decants, added to every bottle: 1, 5 and 10 ml to try before committing.
 * Priced from the cheapest full bottle's per-millilitre rate with a decanting
 * fee, because splitting a bottle by hand costs more per drop than the bottle.
 */
export const SAMPLE_ML = [1, 5, 10] as const;

const sampleFor = (p: Product, ml: number): Variant => {
  const full = p.variants.filter(v => !v.sample);
  const perMl = Math.min(...full.map(v => v.price / v.ml));
  return { ml, price: Math.round((perMl * ml * 1.6 + 240) / 10) * 10, sample: true };
};

/** bottles only — what the volume picker on a card offers */
export const bottles = (p: Product): Variant[] => p.variants.filter(v => !v.sample);

/** the three decants for a fragrance, computed once and cached */
const sampleCache = new Map<number, Variant[]>();

export const samples = (p: Product): Variant[] => {
  const hit = sampleCache.get(p.id);
  if (hit) return hit;
  const made = SAMPLE_ML.map(ml => sampleFor(p, ml));
  sampleCache.set(p.id, made);
  return made;
};

/**
 * How many sprays a wear takes. Not a brand claim: it follows from the
 * concentration — the denser the juice, the fewer presses it needs.
 */
export const sprays = (p: Product): [number, number] => {
  if (/extrait|parfum$/i.test(p.type) && !/eau de parfum/i.test(p.type)) return [2, 3];
  if (/eau de parfum/i.test(p.type)) return [3, 4];
  return [4, 6];
};

/** what a bottle costs right now, with the promotion applied */
export const priceNow = (p: Product, v: Variant): number =>
  p.sale ? Math.round((v.price * (100 - p.sale)) / 100 / 10) * 10 : v.price;

/** the list price, shown struck through only while a promo runs */
export const priceList = (p: Product, v: Variant): number | undefined =>
  p.sale ? v.price : undefined;

/**
 * The promo runs to the end of the current month — the shop's own window,
 * shown in full so nobody has to guess how long "sale" means.
 */
export const saleUntil = (): string => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
};

export const fromPrice = (p: Product): number =>
  Math.min(...p.variants.map(v => priceNow(p, v)));

export const variantOf = (p: Product, ml: number): Variant =>
  p.variants.find(v => v.ml === ml) ?? samples(p).find(v => v.ml === ml) ?? p.variants[0];
