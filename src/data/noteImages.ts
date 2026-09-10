import amber from "../../assets/notes/amber.webp";
import bergamot from "../../assets/notes/bergamot.webp";
import cinnamon from "../../assets/notes/cinnamon.webp";
import coconut from "../../assets/notes/coconut.webp";
import coffee from "../../assets/notes/coffee.webp";
import grapefruit from "../../assets/notes/grapefruit.webp";
import jasmine from "../../assets/notes/jasmine.webp";
import lavender from "../../assets/notes/lavender.webp";
import lemon from "../../assets/notes/lemon.webp";
import musk from "../../assets/notes/musk.webp";
import oud from "../../assets/notes/oud.webp";
import patchouli from "../../assets/notes/patchouli.webp";
import rose from "../../assets/notes/rose.webp";
import sandalwood from "../../assets/notes/sandalwood.webp";
import vanilla from "../../assets/notes/vanilla.webp";

/**
 * Photographed ingredients, supplied by the store owner.
 * A note that has no photograph falls back to the drawn disc, so the
 * pyramid stays complete without inventing imagery.
 */
interface NoteImage {
  match: RegExp;
  src: string;
  /** used as alt text */
  label: string;
}

export const NOTE_IMAGES: NoteImage[] = [
  { match: /бергамот/i,            src: bergamot,   label: "бергамот" },
  { match: /грейпфрут/i,           src: grapefruit, label: "грейпфрут" },
  { match: /лимон|цитрус|мандарин/i, src: lemon,    label: "лимон" },
  { match: /ванил/i,               src: vanilla,    label: "ваниль" },
  { match: /роз(а|ы|ой|овый пион)|пион/i, src: rose, label: "роза" },
  { match: /жасмин|флёрдоранж|апельсиновый цвет|нероли/i, src: jasmine, label: "жасмин" },
  { match: /сандал/i,              src: sandalwood, label: "сандал" },
  { match: /уд\b|^уд$|агарвуд/i,   src: oud,        label: "уд" },
  { match: /амбр|амброксан/i,      src: amber,      label: "амбра" },
  { match: /мускус/i,              src: musk,       label: "белый мускус" },
  { match: /пачул/i,               src: patchouli,  label: "пачули" },
  { match: /лаванд/i,              src: lavender,   label: "лаванда" },
  { match: /кофе/i,                src: coffee,     label: "кофе" },
  { match: /корица|корицы/i,       src: cinnamon,   label: "корица" },
  { match: /кокос/i,               src: coconut,    label: "кокос" }
];

export const noteImage = (name: string): NoteImage | undefined =>
  NOTE_IMAGES.find(n => n.match.test(name));
