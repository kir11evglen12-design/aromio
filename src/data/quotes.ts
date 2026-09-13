export interface Quote {
  /** оригинал, как он написан по-французски */
  fr: string;
  /** перевод витрины — подстрочник, а не канонический перевод */
  ru: string;
  author: string;
  /** произведение и сборник, откуда строка */
  source: string;
  year: string;
}

/**
 * Бодлер писал о запахе больше и точнее всех — «Цветы зла» полны
 * флаконов, волос и смол. Здесь только он: строки, за которые мы можем
 * назвать и стихотворение, и сборник, и год. Красивую фразу без
 * проверяемого источника на витрину не ставим, даже если её любят
 * повторять.
 *
 * Русские строки — наш подстрочник, и так и подписаны: у Бодлера есть
 * известные переводы, но выдавать свой за чужой мы не станем.
 */
export const QUOTES: Quote[] = [
  {
    fr: "Il est de forts parfums pour qui toute matière\nEst poreuse. On dirait qu’ils pénètrent le verre.",
    ru: "Есть запахи такой силы, что всякое вещество\nдля них пористо. Кажется, они проходят сквозь стекло.",
    author: "Charles Baudelaire",
    source: "« Le Flacon », Les Fleurs du mal",
    year: "1857"
  },
  {
    fr: "Il est des parfums frais comme des chairs d’enfants,\nDoux comme les hautbois, verts comme les prairies.",
    ru: "Есть запахи свежие, как детская кожа,\nнежные, как гобои, зелёные, как луга.",
    author: "Charles Baudelaire",
    source: "« Correspondances », Les Fleurs du mal",
    year: "1857"
  },
  {
    fr: "Quand, les deux yeux fermés, en un soir chaud d’automne,\nJe respire l’odeur de ton sein chaleureux…",
    ru: "Когда, закрыв глаза, тёплым осенним вечером\nя вдыхаю запах твоей груди…",
    author: "Charles Baudelaire",
    source: "« Parfum exotique », Les Fleurs du mal",
    year: "1857"
  },
  {
    fr: "Laisse-moi respirer longtemps, longtemps, l’odeur de tes cheveux.",
    ru: "Дай мне долго, долго вдыхать запах твоих волос.",
    author: "Charles Baudelaire",
    source: "« Un hémisphère dans une chevelure », Le Spleen de Paris",
    year: "1869"
  }
];
