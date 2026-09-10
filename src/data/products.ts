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
  name: string;
  brand: string;
  price: number;
  category: Category;
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

export const products: Product[] = [
  {
    id: 1, name: "AROMIO No. 01", brand: "AROMIO", price: 4990, category: "women",
    line: "BLANC", tint: "#d9c9a8", volume: "50 мл", type: "Eau de Parfum",
    desc: "Прозрачный старт из бергамота, который через час раскрывается тёплым белым мускусом.",
    notes: { top: "Бергамот, груша", heart: "Жасмин, пион", base: "Белый мускус, кедр" }
  },
  {
    id: 2, name: "AROMIO No. 02", brand: "AROMIO", price: 5490, category: "men",
    line: "NOIR", tint: "#4c5a63", volume: "100 мл", type: "Eau de Parfum",
    desc: "Плотный древесный характер: дым, кожа и холодный ветивер в основе.",
    notes: { top: "Чёрный перец, грейпфрут", heart: "Кожа, ирис", base: "Ветивер, кедр" }
  },
  {
    id: 3, name: "AROMIO No. 03", brand: "AROMIO", price: 5990, category: "unisex",
    line: "AMBRE", tint: "#c98f47", volume: "75 мл", type: "Eau de Parfum",
    desc: "Амбровая база с ладаном — тёплый, обволакивающий вечерний шлейф.",
    notes: { top: "Мандарин, розовый перец", heart: "Ладан, лабданум", base: "Амбра, ваниль" }
  },
  {
    id: 4, name: "AROMIO No. 04", brand: "AROMIO", price: 6490, category: "niche",
    line: "OUD", tint: "#7d3f34", volume: "50 мл", type: "Eau de Parfum",
    desc: "Флагман нишевой линии: настоящий уд, смягчённый шафраном и дамасской розой.",
    notes: { top: "Шафран, слива", heart: "Дамасская роза", base: "Уд, пачули" }
  },
  {
    id: 5, name: "AROMIO No. 05", brand: "AROMIO", price: 4590, category: "women",
    line: "IRIS", tint: "#b9a6c4", volume: "50 мл", type: "Eau de Parfum",
    desc: "Пудровый ирис с фиалкой — сдержанная элегантность на каждый день.",
    notes: { top: "Фиалковый лист", heart: "Ирис, фиалка", base: "Пудра, сандал" }
  },
  {
    id: 6, name: "AROMIO No. 06", brand: "AROMIO", price: 5290, category: "men",
    line: "CEDRE", tint: "#8a6b3f", volume: "100 мл", type: "Eau de Parfum",
    desc: "Сухой кедр и табак с медовой сладостью бобов тонка.",
    notes: { top: "Кардамон, лайм", heart: "Кедр, табак", base: "Бобы тонка, ваниль" }
  },
  {
    id: 7, name: "AROMIO No. 07", brand: "AROMIO", price: 6990, category: "unisex",
    line: "MUSC", tint: "#a9b7ad", volume: "100 мл", type: "Eau de Parfum",
    desc: "Минеральная свежесть: соль, белый чай и чистый мускус на коже.",
    notes: { top: "Морская соль, лимон", heart: "Белый чай, шалфей", base: "Мускус, амброксан" }
  },
  {
    id: 8, name: "AROMIO No. 08", brand: "AROMIO", price: 7490, category: "niche",
    line: "SANTAL", tint: "#c2a06a", volume: "75 мл", type: "Eau de Parfum",
    desc: "Кремовый сандал с кашемировым древесным послевкусием.",
    notes: { top: "Кокос, кориандр", heart: "Сандал, кашемир", base: "Пачули, ваниль" }
  },
  {
    id: 9, name: "Uomo Born In Roma", brand: "VALENTINO", price: 9990, category: "men",
    line: "BORN IN ROMA", tint: "#3b3b40", volume: "100 мл", type: "Eau de Toilette",
    photo: uomoRoma,
    desc: "Контраст римской архитектуры и уличной культуры: пряный имбирь на старте и минеральный кожаный шлейф.",
    notes: { top: "Имбирь, лист фиалки", heart: "Шалфей, лаванда", base: "Кожаный аккорд, ветивер, древесные" }
  },
  {
    id: 10, name: "Uomo", brand: "VALENTINO", price: 10490, category: "men",
    line: "UOMO", tint: "#a4713a", volume: "100 мл", type: "Eau de Toilette",
    photo: uomo,
    desc: "Гурманская классика дома: обжаренный кофе и джандуйя на тёплой кожаной базе.",
    notes: { top: "Бергамот, мирт", heart: "Обжаренный кофе, джандуйя", base: "Кожа, кедр" }
  },
  {
    id: 11, name: "Donna Born In Roma Green Stravaganza", brand: "VALENTINO", price: 11490,
    category: "women", line: "GREEN STRAVAGANZA", tint: "#a9c94f", volume: "100 мл",
    type: "Eau de Parfum", photo: donnaGreen,
    desc: "Зелёная цитрусовая версия Born In Roma: сочный старт, жасминовое сердце и мягкий мускусный финал.",
    notes: { top: "Бергамот, зелёное яблоко", heart: "Жасмин грандифлорум", base: "Белый мускус, светлые древесные" }
  }
];

export const houseProducts = products.filter(p => p.brand === "AROMIO");

export const byId = (id: number): Product =>
  products.find(p => p.id === id) ?? products[0];

export const money = (n: number): string => n.toLocaleString("ru-RU") + " ₽";
