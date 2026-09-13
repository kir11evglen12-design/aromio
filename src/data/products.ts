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

/* ниша: снимки поставлены владельцем витрины, все на чёрном фоне */
import shotEsc02 from "../../assets/opt/escentric-molecules-escentric-02.webp";
import shotEsc01 from "../../assets/opt/escentric-molecules-escentric-01.webp";
import shotMol01 from "../../assets/opt/escentric-molecules-molecule-01.webp";
import shotFleurNarcotique from "../../assets/opt/ex-nihilo-fleur-narcotique.webp";
import shotCedratBoise from "../../assets/opt/mancera-cedrat-boise.webp";
import shotRedTobacco from "../../assets/opt/mancera-red-tobacco.webp";
import shotBoisImperial from "../../assets/opt/essential-parfums-bois-imperial.webp";
import shotRosesMusk from "../../assets/opt/montale-roses-musk.webp";
import shotSoleilCapri from "../../assets/opt/montale-soleil-de-capri.webp";
import shotYara from "../../assets/opt/lattafa-yara.webp";
import shotGuidance from "../../assets/opt/amouage-guidance.webp";
import shotBR540 from "../../assets/opt/mfk-baccarat-rouge-540.webp";
import shotLostCherry from "../../assets/opt/tom-ford-lost-cherry.webp";
import shotBalAfrique from "../../assets/opt/byredo-bal-dafrique.webp";
import shotSantal33 from "../../assets/opt/le-labo-santal-33.webp";
import shotAventus from "../../assets/opt/creed-aventus.webp";
import shotBlackAfgano from "../../assets/opt/nasomatto-black-afgano.webp";
import shotKirke from "../../assets/opt/tiziana-terenzi-kirke.webp";
import shotAndromeda from "../../assets/opt/tiziana-terenzi-andromeda.webp";
import shotErbaPura from "../../assets/opt/xerjoff-erba-pura.webp";

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
  "CHANEL", "TOM FORD", "YVES SAINT LAURENT", "PACO RABANNE", "CREED",
  "ESCENTRIC MOLECULES", "EX NIHILO", "MANCERA", "ESSENTIAL PARFUMS",
  "MONTALE", "LATTAFA", "AMOUAGE", "MAISON FRANCIS KURKDJIAN",
  "BYREDO", "LE LABO", "NASOMATTO", "TIZIANA TERENZI", "XERJOFF"
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
    id: 2, name: "Homme Intense", brand: "DIOR", price: 12990, sale: 20, category: "men",
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
    id: 3, name: "Miss Dior", brand: "DIOR", price: 13490, sale: 20, category: "women",
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
    id: 4, name: "J’adore", brand: "DIOR", price: 13990, sale: 20, category: "women",
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
    id: 5, name: "Imagination", brand: "LOUIS VUITTON", price: 33900, sale: 25, category: "men",
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
    id: 6, name: "Ombre Nomade", brand: "LOUIS VUITTON", price: 42900, sale: 25, category: "niche",
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
    id: 7, name: "Attrape-Rêves", brand: "LOUIS VUITTON", price: 33900, sale: 30, category: "women",
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
    id: 9, name: "Uomo Born In Roma", brand: "VALENTINO", price: 9990, sale: 15, category: "men",
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
    id: 10, name: "Uomo", brand: "VALENTINO", price: 10490, sale: 20, category: "men",
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
    id: 12, name: "Voce Viva", brand: "VALENTINO", price: 10990, sale: 35, category: "women",
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
    id: 13, name: "Fahrenheit", brand: "DIOR", price: 12490, sale: 30, category: "men",
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
    id: 14, name: "Eyes", brand: "LOUIS VUITTON", price: 34900, sale: 25, category: "unisex",
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
    id: 16, name: "Donna", brand: "VALENTINO", price: 11290, sale: 15, category: "women",
    variants: [{ ml: 50, price: 6990 }, { ml: 100, price: 11290 }, { ml: 150, price: 15790 }],
    line: "DONNA", tint: "#d9c9a3", type: "Eau de Parfum",
    photo: shotDonna, photoDark: true,
    desc: "Кремовое гранёное стекло с золотой крышкой-бантом — самый светлый флакон витрины.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 17, name: "Donna Born In Roma", brand: "VALENTINO", price: 11690, sale: 25, category: "women",
    variants: [{ ml: 50, price: 7290 }, { ml: 100, price: 11690 }, { ml: 150, price: 16290 }],
    line: "BORN IN ROMA", tint: "#e8398f", type: "Eau de Parfum",
    photo: shotDonnaRoma, photoDark: true,
    desc: "Ярко-розовые шипы Born In Roma — версия, которую видно через всю полку.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 18, name: "Donna Purple", brand: "VALENTINO", price: 11690, sale: 20, category: "women",
    variants: [{ ml: 50, price: 7290 }, { ml: 100, price: 11690 }, { ml: 150, price: 16290 }],
    line: "BORN IN ROMA", tint: "#a86fc0", type: "Eau de Parfum",
    photo: shotDonnaPurple, photoDark: true,
    desc: "Фиолетовое гранёное стекло с серебряными шипами и тёмной подписью дома.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 19, name: "Donna Yellow", brand: "VALENTINO", price: 11690, sale: 25, category: "women",
    variants: [{ ml: 50, price: 7290 }, { ml: 100, price: 11690 }, { ml: 150, price: 16290 }],
    line: "BORN IN ROMA", tint: "#d8b63c", type: "Eau de Parfum",
    photo: shotDonnaYellow, photoDark: true,
    desc: "Золотисто-жёлтое стекло на серебряном цоколе — самый солнечный флакон линии.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },

  /* ---------------- JEAN PAUL GAULTIER ---------------- */
  {
    id: 20, name: "Le Male", brand: "JEAN PAUL GAULTIER", price: 8990, sale: 15, category: "men",
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
    id: 21, name: "Le Male Elixir", brand: "JEAN PAUL GAULTIER", price: 11490, sale: 25, category: "men",
    variants: [{ ml: 75, price: 8290 }, { ml: 125, price: 11490 }],
    line: "LE MALE", tint: "#8a6a3a", type: "Parfum",
    desc: "Плотная версия классики: тот же силуэт флакона, но звучание гуще и слаще.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },

  /* ---------------- LACOSTE ---------------- */
  {
    id: 22, name: "L.12.12 Blanc", brand: "LACOSTE", price: 6990, sale: 35, category: "men",
    variants: [{ ml: 50, price: 4990 }, { ml: 100, price: 6990 }, { ml: 175, price: 9990 }],
    line: "L.12.12", tint: "#dfe3e7", type: "Eau de Toilette",
    desc: "Белая поло-рубашка в парфюмерии: чистый, лёгкий и подчёркнуто повседневный аромат.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },
  {
    id: 23, name: "L.12.12 Noir", brand: "LACOSTE", price: 6990, sale: 20, category: "men",
    variants: [{ ml: 50, price: 4990 }, { ml: 100, price: 6990 }],
    line: "L.12.12", tint: "#2b2f33", type: "Eau de Toilette",
    desc: "Тёмная версия той же линии — плотнее и теплее белой, для вечера.",
    notes: { top: "", heart: "", base: "" }, notesUnknown: true
  },

  /* ---------------- CHANEL ---------------- */
  {
    id: 24, name: "Bleu de Chanel", brand: "CHANEL", price: 13990, sale: 15, category: "men",
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
    id: 25, name: "Coco Mademoiselle", brand: "CHANEL", price: 14490, sale: 15, category: "women",
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
    id: 26, name: "Tobacco Vanille", brand: "TOM FORD", price: 27900, sale: 20, category: "unisex",
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
    id: 27, name: "Lost Cherry", brand: "TOM FORD", price: 29900, sale: 25, category: "unisex",
    variants: [{ ml: 50, price: 29900 }, { ml: 100, price: 42900 }],
    line: "PRIVATE BLEND", tint: "#a52a3c", type: "Eau de Parfum", nose: "Луиза Тёрнер",
    photo: shotLostCherry, photoDark: true,
    desc: "Вишнёвый ликёр и миндаль поверх тонка-ванильной базы: сладость, доведённая до предела.",
    notes: {
      top: "Вишня, ликёр, миндаль",
      heart: "Роза, жасмин",
      base: "Бобы тонка, ваниль, сандал"
    }
  },

  /* ---------------- YVES SAINT LAURENT ---------------- */
  {
    id: 28, name: "Libre", brand: "YVES SAINT LAURENT", price: 12990, sale: 25, category: "women",
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
    id: 30, name: "1 Million", brand: "PACO RABANNE", price: 9490, sale: 30, category: "men",
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
    id: 31, name: "Invictus", brand: "PACO RABANNE", price: 8990, sale: 15, category: "men",
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
    id: 32, name: "Aventus", brand: "CREED", price: 38900, sale: 20, category: "niche",
    variants: [{ ml: 50, price: 27900 }, { ml: 100, price: 38900 }, { ml: 120, price: 45900 }],
    line: "AVENTUS", tint: "#6d4a2f", type: "Eau de Parfum", nose: "Эрвен Крид",
    photo: shotAventus, photoDark: true,
    desc: "Дымный ананас с берёзой — аромат, который в 2010-х переписал представление о мужской нише.",
    notes: {
      top: "Ананас, бергамот, чёрная смородина, яблоко",
      heart: "Берёза, пачули, жасмин",
      base: "Мускус, дубовый мох, амбра, ваниль"
    }
  },
  {
    id: 33, name: "Silver Mountain Water", brand: "CREED", price: 35900, sale: 15, category: "unisex",
    variants: [{ ml: 50, price: 25900 }, { ml: 100, price: 35900 }],
    line: "MILLESIME", tint: "#7f98a6", type: "Eau de Parfum",
    desc: "Холодная вода и зелёный чай: прозрачный аромат, придуманный как портрет альпийского ручья.",
    notes: {
      top: "Бергамот, мандарин",
      heart: "Зелёный чай, чёрная смородина",
      base: "Сандал, мускус"
    }
  },

  /* ---------------- ESCENTRIC MOLECULES ---------------- */
  {
    id: 34, name: "Molecule 01", brand: "ESCENTRIC MOLECULES", price: 14900, sale: 25, category: "unisex",
    variants: [{ ml: 30, price: 9900 }, { ml: 100, price: 14900 }],
    line: "MOLECULE", tint: "#8d8b86", type: "Eau de Toilette", nose: "Гёза Шён",
    photo: shotMol01, photoDark: true,
    desc: "Одна молекула вместо пирамиды: Iso E Super в чистом виде. Пахнет по-разному на каждой коже и то появляется, то пропадает в течение дня.",
    notes: {
      top: "Iso E Super",
      heart: "Iso E Super",
      base: "Iso E Super"
    }
  },
  {
    id: 35, name: "Escentric 01", brand: "ESCENTRIC MOLECULES", price: 15900, sale: 25, category: "unisex",
    variants: [{ ml: 30, price: 10900 }, { ml: 100, price: 15900 }],
    line: "ESCENTRIC", tint: "#7f8a7a", type: "Eau de Toilette", nose: "Гёза Шён",
    photo: shotEsc01, photoDark: true,
    desc: "Та же Iso E Super, но обведённая по контуру: цитрус, перец и ирис делают молекулу слышимой.",
    notes: {
      top: "Лайм, розовый перец",
      heart: "Ирис, зелёные ноты",
      base: "Iso E Super, мускус"
    }
  },
  {
    id: 36, name: "Escentric 02", brand: "ESCENTRIC MOLECULES", price: 15900, category: "unisex",
    variants: [{ ml: 30, price: 10900 }, { ml: 100, price: 15900 }],
    line: "ESCENTRIC", tint: "#6f7d83", type: "Eau de Toilette", nose: "Гёза Шён",
    photo: shotEsc02, photoDark: true,
    desc: "Вторая пара к Molecule 02: мускусная прозрачность с зелёным чаем и лаймом, почти без веса.",
    notes: {
      top: "Лайм, бальзамические ноты",
      heart: "Зелёный чай, ирис",
      base: "Мускус, ветивер"
    }
  },

  /* ---------------- EX NIHILO ---------------- */
  {
    id: 37, name: "Fleur Narcotique", brand: "EX NIHILO", price: 33900, sale: 15, category: "unisex",
    variants: [{ ml: 50, price: 24900 }, { ml: 100, price: 33900 }],
    line: "INITIALE", tint: "#c9a3a8", type: "Eau de Parfum",
    photo: shotFleurNarcotique, photoDark: true,
    desc: "Персик и личи поверх белых цветов: тот самый «цветочный, который любят все» из парижского бутика на Рю Сент-Оноре.",
    notes: {
      top: "Персик, личи, бергамот",
      heart: "Пион, жасмин, флёрдоранж",
      base: "Мускус, мох"
    }
  },

  /* ---------------- MANCERA ---------------- */
  {
    id: 38, name: "Cedrat Boise", brand: "MANCERA", price: 14900, sale: 20, category: "unisex",
    variants: [{ ml: 60, price: 10900 }, { ml: 120, price: 14900 }],
    line: "LES CONFIDENTIELS", tint: "#93803f", type: "Eau de Parfum",
    photo: shotCedratBoise, photoDark: true,
    desc: "Лимонная корка на древесно-ванильной подложке: свежий старт, который к вечеру становится тёплым.",
    notes: {
      top: "Сицилийский лимон, бергамот, чёрная смородина",
      heart: "Жасмин, специи, древесные ноты",
      base: "Ваниль, уд, сандал, пачули, мускус"
    }
  },
  {
    id: 39, name: "Red Tobacco", brand: "MANCERA", price: 16900, sale: 35, category: "unisex",
    variants: [{ ml: 60, price: 12400 }, { ml: 120, price: 16900 }],
    line: "LES CONFIDENTIELS", tint: "#6e1d18", type: "Eau de Parfum",
    photo: shotRedTobacco, photoDark: true,
    desc: "Пряный табак с корицей и шафраном: густой, сладкий, слышно издалека.",
    notes: {
      top: "Табак, специи, корица",
      heart: "Шафран, уд",
      base: "Амбра, ваниль, древесные ноты"
    }
  },

  /* ---------------- ESSENTIAL PARFUMS ---------------- */
  {
    id: 40, name: "Bois Imperial", brand: "ESSENTIAL PARFUMS", price: 12900, sale: 25, category: "unisex",
    variants: [{ ml: 30, price: 7900 }, { ml: 100, price: 12900 }],
    line: "PARIS", tint: "#8a7b5c", type: "Eau de Parfum", nose: "Кантен Биш",
    photo: shotBoisImperial, photoDark: true,
    desc: "Грейпфрут и ветивер на прозрачной древесной основе — дом сознательно собирает такие ароматы из немногих материалов.",
    notes: {
      top: "Грейпфрут, лист фиалки",
      heart: "Ветивер, древесные ноты",
      base: "Мускус, амбретта"
    }
  },

  /* ---------------- MONTALE ---------------- */
  {
    id: 41, name: "Roses Musk", brand: "MONTALE", price: 13900, sale: 15, category: "women",
    variants: [{ ml: 50, price: 9900 }, { ml: 100, price: 13900 }],
    line: "LES ROSES", tint: "#c0567f", type: "Eau de Parfum",
    photo: shotRosesMusk, photoDark: true,
    desc: "Роза, промытая мускусом до чистоты свежего белья: без варенья и без пудры.",
    notes: {
      top: "Турецкая роза, болгарская роза",
      heart: "Жасмин, мускус",
      base: "Белый мускус, амбра"
    }
  },
  {
    id: 42, name: "Soleil de Capri", brand: "MONTALE", price: 12900, sale: 25, category: "unisex",
    variants: [{ ml: 50, price: 9400 }, { ml: 100, price: 12900 }],
    line: "LES SOLEILS", tint: "#d8b64a", type: "Eau de Parfum",
    photo: shotSoleilCapri, photoDark: true,
    desc: "Цитрусовый лимонад с флёрдоранжем: самый летний флакон на витрине.",
    notes: {
      top: "Апельсин, лимон, мандарин",
      heart: "Нероли, жасмин",
      base: "Мускус, ваниль"
    }
  },

  /* ---------------- LATTAFA ---------------- */
  {
    id: 43, name: "Yara", brand: "LATTAFA", price: 4990, category: "women",
    variants: [{ ml: 50, price: 3990 }, { ml: 100, price: 4990 }],
    line: "YARA", tint: "#c98fa2", type: "Eau de Parfum",
    photo: shotYara, photoDark: true,
    desc: "Сладкий восточный цветочный с гелиотропом и ванилью: самый доступный вход в плотную парфюмерию на витрине.",
    notes: {
      top: "Флёрдоранж, мандарин",
      heart: "Гелиотроп, орхидея, тропические фрукты",
      base: "Ваниль, сандал, мускус"
    }
  },

  /* ---------------- AMOUAGE ---------------- */
  {
    id: 44, name: "Guidance", brand: "AMOUAGE", price: 52900, sale: 20, category: "niche",
    variants: [{ ml: 50, price: 39900 }, { ml: 100, price: 52900 }],
    line: "EXCEPTIONAL EXTRAITS", tint: "#b98c7a", type: "Extrait de Parfum",
    photo: shotGuidance, photoDark: true,
    desc: "Медовая тубероза с ладаном и сандалом: плотный белый цветок в оманской оправе.",
    notes: {
      top: "Мёд, шафран",
      heart: "Тубероза, жасмин",
      base: "Сандал, ладан, мускус"
    }
  },

  /* ---------------- MAISON FRANCIS KURKDJIAN ---------------- */
  {
    id: 45, name: "Baccarat Rouge 540", brand: "MAISON FRANCIS KURKDJIAN", price: 44900, sale: 30, category: "unisex",
    variants: [{ ml: 35, price: 26900 }, { ml: 70, price: 44900 }, { ml: 200, price: 89900 }],
    line: "BACCARAT ROUGE", tint: "#8c1d2a", type: "Eau de Parfum", nose: "Франсис Куркджян",
    photo: shotBR540, photoDark: true,
    desc: "Шафран и жасмин, сплавленные с амброй в почти минеральную сладость. Аромат, который в 2015-м задал тон целому десятилетию.",
    notes: {
      top: "Шафран, жасмин",
      heart: "Амбровое дерево, кедр",
      base: "Амбра, смола пихты"
    }
  },

  /* ---------------- BYREDO ---------------- */
  {
    id: 46, name: "Bal d’Afrique", brand: "BYREDO", price: 27900, sale: 30, category: "unisex",
    variants: [{ ml: 50, price: 20900 }, { ml: 100, price: 27900 }],
    line: "BYREDO", tint: "#9a7c4e", type: "Eau de Parfum", nose: "Жером Эпине",
    photo: shotBalAfrique, photoDark: true,
    desc: "Неролиевый цитрус с фиалкой и ветивером — отсылка к парижскому увлечению африканским искусством в 1920-е.",
    notes: {
      top: "Бергамот, лимон, нероли, бархатцы",
      heart: "Фиалка, цикламен, жасмин",
      base: "Мускус, ветивер, кедр, амбра"
    }
  },

  /* ---------------- LE LABO ---------------- */
  {
    id: 47, name: "Santal 33", brand: "LE LABO", price: 34900, sale: 25, category: "unisex",
    variants: [{ ml: 50, price: 26900 }, { ml: 100, price: 34900 }],
    line: "CITY EXCLUSIVES", tint: "#8a6f52", type: "Eau de Parfum", nose: "Франк Фёлькль",
    photo: shotSantal33, photoDark: true,
    desc: "Сухой сандал с кожей и папирусом: запах, который в 2010-х стал звучать одинаково в кофейнях от Нью-Йорка до Берлина.",
    notes: {
      top: "Кардамон, фиалка, ирис",
      heart: "Сандал, папирус, кедр",
      base: "Кожа, амбра, мускус"
    }
  },

  /* ---------------- NASOMATTO ---------------- */
  {
    id: 48, name: "Black Afgano", brand: "NASOMATTO", price: 39900, sale: 15, category: "niche",
    variants: [{ ml: 30, price: 39900 }],
    line: "NASOMATTO", tint: "#2f2a24", type: "Extrait de Parfum", nose: "Алессандро Гуальтьери",
    photo: shotBlackAfgano, photoDark: true,
    desc: "Смолы, уд и кофе в почти смоляной густоте. Один объём, 30 мл — дом других не выпускает.",
    notes: {
      top: "Зелёные ноты, кофе",
      heart: "Табак, смолы",
      base: "Уд, древесные ноты, мускус"
    }
  },

  /* ---------------- TIZIANA TERENZI ---------------- */
  {
    id: 49, name: "Kirke", brand: "TIZIANA TERENZI", price: 46900, sale: 20, category: "women",
    variants: [{ ml: 30, price: 24900 }, { ml: 100, price: 46900 }],
    line: "LUNA", tint: "#b4603f", type: "Extrait de Parfum",
    photo: shotKirke, photoDark: true,
    desc: "Маракуйя и персик, залитые ванилью: густой фруктовый шлейф, который держится на одежде сутками.",
    notes: {
      top: "Маракуйя, персик, слива",
      heart: "Малина, земляника, жасмин",
      base: "Ваниль, мускус, пачули, сандал"
    }
  },
  {
    id: 50, name: "Andromeda", brand: "TIZIANA TERENZI", price: 46900, category: "unisex",
    variants: [{ ml: 30, price: 24900 }, { ml: 100, price: 46900 }],
    line: "LUNA", tint: "#c9c4bb", type: "Extrait de Parfum",
    photo: shotAndromeda, photoDark: true,
    desc: "Прозрачный цитрус с фрезией и амброй — светлая сторона той же коллекции, что и Kirke.",
    notes: {
      top: "Бергамот, лимон, цитрусовые",
      heart: "Фрезия, флёрдоранж",
      base: "Мускус, амбра, древесные ноты"
    }
  },

  /* ---------------- XERJOFF ---------------- */
  {
    id: 51, name: "Erba Pura", brand: "XERJOFF", price: 41900, sale: 25, category: "unisex",
    variants: [{ ml: 50, price: 31900 }, { ml: 100, price: 41900 }],
    line: "CASAMORATI · SHOOTING STARS", tint: "#27a8a8", type: "Eau de Parfum",
    photo: shotErbaPura, photoDark: true,
    desc: "Сицилийский цитрус и фруктовый сироп на ванильно-мускусной базе: сладко, но не тяжело.",
    notes: {
      top: "Сицилийский апельсин, лимон, бергамот, фрукты",
      heart: "Белый мускус, жасмин",
      base: "Амбра, ваниль, мадагаскарская ваниль"
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
/** короткая подпись концентрации — на узкой плашке полное название не влезает */
export const SHORT_TYPE: Record<string, string> = {
  "Eau de Parfum": "EDP",
  "Eau de Toilette": "EDT",
  "Extrait de Parfum": "EXTRAIT"
};

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
/**
 * Сезон аромата выводится из его же нот и концентрации, а не назначается
 * вручную: цитрус и морская свежесть — лето, цветы и зелень — весна,
 * специи, кожа и древесина — осень, уд, ваниль и смолы — зима.
 */
export type Season = "spring" | "summer" | "autumn" | "winter";

export const season = (p: Product): Season => {
  /* верхние ноты решают первое впечатление, база — только оттеняет,
     иначе любой аромат с сандалом и амброй уезжает в осень */
  const weigh = (words: string[]) =>
    words.reduce((n, w) =>
      n + (p.notes.top.toLowerCase().includes(w) ? 3 : 0)
        + (p.notes.heart.toLowerCase().includes(w) ? 2 : 0)
        + (p.notes.base.toLowerCase().includes(w) ? 1 : 0), 0);

  const winter = weigh(["уд", "ваниль", "ладан", "смол", "тонка", "какао", "шоколад",
                        "кожа", "замша", "табак", "бальзам", "мирр", "дёгот"])
                 + (p.type === "Extrait de Parfum" ? 2 : 0);
  const summer = weigh(["бергамот", "лимон", "лайм", "грейпфрут", "мандарин", "апельсин", "цитрус",
                        "морск", "соль", "водоросл", "кокос", "ананас", "мята", "акватич", "арбуз"])
                 + (p.type === "Eau de Toilette" ? 2 : 0);
  const spring = weigh(["роза", "пион", "жасмин", "ландыш", "фиалк", "ирис", "флёрдоранж", "нероли",
                        "зелён", "чай", "яблок", "груша", "личи", "жимолость", "гардени", "магноли"]);
  const autumn = weigh(["пачул", "ветивер", "сандал", "кедр", "древесн", "мох", "перец", "шафран",
                        "кардамон", "корица", "имбирь", "мускатн", "лавр", "дубов", "каштан"]);

  const best = Math.max(winter, summer, spring, autumn);
  if (best === 0) return "autumn";
  if (winter === best) return "winter";
  if (summer === best) return "summer";
  if (spring === best) return "spring";
  return "autumn";
};

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

/**
 * Фолио — двузначный номер аромата на витрине. Считается от порядка в
 * каталоге, а не берётся из id: id может быть разреженным, а номер
 * должен идти подряд, чтобы по нему можно было назвать аромат вслух.
 */
const folioMap = new Map(products.map((p, i) => [p.id, String(i + 1).padStart(2, "0")]));

export const folio = (p: Product): string => folioMap.get(p.id) ?? "00";
