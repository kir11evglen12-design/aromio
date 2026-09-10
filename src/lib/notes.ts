/**
 * Ingredient families. Each note in a product is matched by keyword and
 * drawn as a tinted disc with a line icon, so the pyramid reads visually
 * without needing licensed ingredient photography.
 */

export interface NoteFamily {
  key: string;
  match: RegExp;
  icon: string;
}

export const NOTE_FAMILIES: NoteFamily[] = [
  {
    key: "citrus",
    match: /бергамот|лимон|мандарин|грейпфрут|лайм|цитрус|нероли/i,
    icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18"/>'
  },
  {
    key: "fruit",
    match: /груш|яблок|слив|кокос|ягод|персик|инжир/i,
    icon: '<path d="M12 6.5c4 0 6.5 3 6.5 6.4 0 3.4-2.9 5.6-6.5 5.6s-6.5-2.2-6.5-5.6c0-3.4 2.5-6.4 6.5-6.4Z"/><path d="M12 6.5V4M12 4c1.6-.6 3-.2 3.6.8"/>'
  },
  {
    /* spice is tested before floral so "розовый перец" is not read as a rose */
    key: "spice",
    match: /перец|шафран|кардамон|имбир|кориандр|специ|гвоздик|корица/i,
    icon: '<path d="M12 4.5c3.2 2.6 4.8 5 4.8 7.6A4.8 4.8 0 0 1 12 17a4.8 4.8 0 0 1-4.8-4.9c0-2.6 1.6-5 4.8-7.6Z"/><path d="M12 20v-3"/>'
  },
  {
    key: "floral",
    match: /жасмин|роз|пион|фиалк|ирис|лаванд|цвет|флёрдоранж|гардени/i,
    icon: '<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c0-3 1-4.6 0-6.1M12 14.4c0 3-1 4.6 0 6.1M9.6 12c-3 0-4.6 1-6.1 0M14.4 12c3 0 4.6-1 6.1 0"/>'
  },
  {
    /* JS \b does not work on Cyrillic, so the standalone word is matched */
    key: "wood",
    match: /кедр|сандал|^уд$|ветивер|пачул|древес|дерев|мирт|бук/i,
    icon: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.4"/><circle cx="12" cy="12" r="2.3"/>'
  },
  {
    key: "leather",
    match: /кож|замш/i,
    icon: '<rect x="4.5" y="6" width="15" height="12" rx="2.4"/><path d="M4.5 10.5h15M9.5 6v12"/>'
  },
  {
    key: "sweet",
    match: /ванил|тонка|джандуй|карамел|мёд|мед\b|шоколад|орех/i,
    icon: '<path d="M8 5.5h8l-1.2 13a2.8 2.8 0 0 1-5.6 0Z"/><path d="M9.6 10.5h4.8"/>'
  },
  {
    key: "musk",
    match: /мускус|амбр|пудр|кашемир|белые|молоч/i,
    icon: '<path d="M5 14.5c1.8-4 4.2-6 7-6s5.2 2 7 6"/><path d="M6.5 17.5c1.5-2 3.3-3 5.5-3s4 1 5.5 3"/>'
  },
  {
    key: "green",
    match: /лист|шалфей|чай|трав|зелён|зелен|мята|базилик/i,
    icon: '<path d="M19 5c0 7-4.5 11.5-11 11.5C8 10 12.5 5 19 5Z"/><path d="M5 19c3-4.5 6-7 11-9.5"/>'
  },
  {
    key: "mineral",
    match: /сол|минерал|морск|акватик|озон/i,
    icon: '<path d="M12 3.5 20 12l-8 8.5L4 12Z"/><path d="M8 12h8"/>'
  },
  {
    key: "smoke",
    match: /ладан|лабданум|табак|дым|кофе|смол/i,
    icon: '<path d="M8 20c-1-2.4-.4-4 1.4-5.6 2-1.8 2.4-3.4 1.2-5.6 3 .8 5 3 5 6.2 0 2-.7 3.7-2 5"/><path d="M12 20h4"/>'
  }
];

const FALLBACK = NOTE_FAMILIES.find(f => f.key === "musk")!;

export const noteFamily = (name: string): NoteFamily =>
  NOTE_FAMILIES.find(f => f.match.test(name)) ?? FALLBACK;
