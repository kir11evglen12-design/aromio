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

export const HOUSES = ["DIOR", "LOUIS VUITTON", "VALENTINO"] as const;
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
    id: 3, name: "Miss Dior", brand: "DIOR", price: 13490, category: "women",
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
    id: 6, name: "Ombre Nomade", brand: "LOUIS VUITTON", price: 42900, category: "niche",
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
    id: 10, name: "Uomo", brand: "VALENTINO", price: 10490, category: "men",
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
    id: 13, name: "Fahrenheit", brand: "DIOR", price: 12490, category: "men",
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
    id: 17, name: "Donna Born In Roma", brand: "VALENTINO", price: 11690, category: "women",
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
export const fromPrice = (p: Product): number =>
  Math.min(...p.variants.map(v => v.price));

export const variantOf = (p: Product, ml: number): Variant =>
  p.variants.find(v => v.ml === ml) ?? p.variants[0];
