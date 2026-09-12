/**
 * Логотипы домов подхватываются из assets/houses по имени файла: дом в
 * нижнем регистре, пробелы через дефис. Файла нет — плитка рисует
 * название шрифтом витрины, и это честнее, чем чужой логотип наугад.
 */
const files = import.meta.glob("../../assets/houses/*.{svg,png,webp,jpg}", {
  eager: true,
  query: "?url",
  import: "default"
}) as Record<string, string>;

export const houseSlug = (house: string) =>
  house.toLowerCase().replace(/\s+/g, "-");

export const HOUSE_LOGOS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.replace(/^.*\//, "").replace(/\.[^.]+$/, ""),
    url
  ])
);

export const logoOf = (house: string): string | undefined =>
  HOUSE_LOGOS[houseSlug(house)];
