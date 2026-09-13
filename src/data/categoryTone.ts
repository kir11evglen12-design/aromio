import type { Category } from "./products";

/**
 * Цвет категории по системе витрины: жёлтый — женские, синий —
 * мужские, зелёный — унисекс. Для нишевой названного цвета нет, берём
 * соседний из той же палитры холста.
 */
export const CATEGORY_TONE: Record<Category, string> = {
  women: "cat-women",
  men: "cat-men",
  unisex: "cat-unisex",
  niche: "cat-niche"
};
