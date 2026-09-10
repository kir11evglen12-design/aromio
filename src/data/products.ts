import uomoRoma from "../../assets/opt/valentino-uomo-born-in-roma.webp";
import uomo from "../../assets/opt/valentino-uomo.webp";
import donnaGreen from "../../assets/opt/valentino-donna-green-stravaganza.webp";

export type Category = "women" | "men" | "unisex" | "niche";

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
  price: number;
  category: Category;
  /** collection or line inside the house */
  line: string;
  /** liquid colour of the CSS bottle, and the scene tint in the picker */
  tint: string;
  volume: string;
  type: string;
  desc: string;
  notes: Notes;
  /** official brand shot, supplied by the store owner */
  photo?: string;
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
    line: "SAUVAGE", tint: "#6d7f8c", volume: "100 мл", type: "Eau de Parfum",
    desc: "Пустынный минерализм: раскалённый бергамот на старте, лаванда в сердце и амброво-ванильный след.",
    notes: {
      top: "Бергамот, грейпфрут",
      heart: "Лаванда, мускатный орех",
      base: "Амбра, ваниль"
    }
  },
  {
    id: 2, name: "Homme Intense", brand: "DIOR", price: 12990, category: "men",
    line: "HOMME", tint: "#6a5a66", volume: "100 мл", type: "Eau de Parfum",
    desc: "Пудровый ирис, вписанный в тёплую древесную оправу — самый «костюмный» аромат дома.",
    notes: {
      top: "Лаванда",
      heart: "Ирис, пачули",
      base: "Ваниль, сандал"
    }
  },
  {
    id: 3, name: "Miss Dior", brand: "DIOR", price: 13490, category: "women",
    line: "MISS DIOR", tint: "#d98fa0", volume: "100 мл", type: "Eau de Parfum",
    desc: "Цветочный шипр нового поколения: роза центифолия, подсвеченная бергамотом и пачули.",
    notes: {
      top: "Бергамот",
      heart: "Роза центифолия, пион",
      base: "Белый мускус, пачули"
    }
  },
  {
    id: 4, name: "J’adore", brand: "DIOR", price: 13990, category: "women",
    line: "J’ADORE", tint: "#d9b45a", volume: "100 мл", type: "Eau de Parfum",
    desc: "Золотой цветочный букет: иланг-иланг, дамасская роза и жасмин самбак в одной ноте.",
    notes: {
      top: "Лимон, иланг-иланг",
      heart: "Жасмин самбак, роза",
      base: "Белый мускус, ваниль"
    }
  },

  /* ---------------- LOUIS VUITTON ---------------- */
  {
    id: 5, name: "Imagination", brand: "LOUIS VUITTON", price: 33900, category: "men",
    line: "LES PARFUMS", tint: "#d9a45c", volume: "100 мл", type: "Eau de Parfum",
    desc: "Прозрачная цитрусовая акварель на чайной основе — лёгкий, но стойкий дневной аромат.",
    notes: {
      top: "Бергамот, лимон",
      heart: "Чёрный чай, кардамон",
      base: "Амбра, сандал"
    }
  },
  {
    id: 6, name: "Ombre Nomade", brand: "LOUIS VUITTON", price: 42900, category: "niche",
    line: "LES PARFUMS", tint: "#6b2f2a", volume: "100 мл", type: "Eau de Parfum",
    desc: "Плотный уд с розой и ладаном: самый узнаваемый ночной аромат дома, шлейф читается через комнату.",
    notes: {
      top: "Малина, шафран",
      heart: "Роза, уд",
      base: "Уд, сандал"
    }
  },
  {
    id: 7, name: "Attrape-Rêves", brand: "LOUIS VUITTON", price: 33900, category: "women",
    line: "LES PARFUMS", tint: "#8d5fa0", volume: "100 мл", type: "Eau de Parfum",
    desc: "Пион и личи на пачулевой подушке — сладкий, но не приторный цветочный шлейф.",
    notes: {
      top: "Личи",
      heart: "Пион, жасмин",
      base: "Пачули, ваниль"
    }
  },
  {
    id: 8, name: "Météore", brand: "LOUIS VUITTON", price: 33900, category: "men",
    line: "LES PARFUMS", tint: "#7fa3b8", volume: "100 мл", type: "Eau de Parfum",
    desc: "Холодный цитрус с мятной искрой и минеральной древесной базой — аромат ясного утра.",
    notes: {
      top: "Лимон, грейпфрут",
      heart: "Мята, кардамон",
      base: "Пачули, сандал"
    }
  },

  /* ---------------- VALENTINO ---------------- */
  {
    id: 9, name: "Uomo Born In Roma", brand: "VALENTINO", price: 9990, category: "men",
    line: "BORN IN ROMA", tint: "#3b3b40", volume: "100 мл", type: "Eau de Toilette",
    photo: uomoRoma,
    desc: "Контраст римской архитектуры и уличной культуры: пряный имбирь на старте и минеральный кожаный шлейф.",
    notes: {
      top: "Имбирь, лист фиалки",
      heart: "Шалфей, лаванда",
      base: "Кожаный аккорд, ветивер"
    }
  },
  {
    id: 10, name: "Uomo", brand: "VALENTINO", price: 10490, category: "men",
    line: "UOMO", tint: "#a4713a", volume: "100 мл", type: "Eau de Toilette",
    photo: uomo,
    desc: "Гурманская классика дома: обжаренный кофе и джандуйя на тёплой кожаной базе.",
    notes: {
      top: "Бергамот, мирт",
      heart: "Кофе, джандуйя",
      base: "Кожа, сандал"
    }
  },
  {
    id: 11, name: "Donna Born In Roma Green Stravaganza", brand: "VALENTINO", price: 11490,
    category: "women", line: "BORN IN ROMA", tint: "#a9c94f", volume: "100 мл",
    type: "Eau de Parfum", photo: donnaGreen,
    desc: "Зелёная цитрусовая версия Born In Roma: сочный старт, жасминовое сердце и мягкий мускусный финал.",
    notes: {
      top: "Бергамот, зелёное яблоко",
      heart: "Жасмин грандифлорум",
      base: "Белый мускус, сандал"
    }
  },
  {
    id: 12, name: "Voce Viva", brand: "VALENTINO", price: 10990, category: "women",
    line: "VOCE VIVA", tint: "#e0c46a", volume: "100 мл", type: "Eau de Parfum",
    desc: "Светлый цветочно-гурманский аромат: апельсиновый цвет и ваниль с кристальным мускусом.",
    notes: {
      top: "Лимон, мандарин",
      heart: "Апельсиновый цвет, жасмин",
      base: "Ваниль, белый мускус"
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
