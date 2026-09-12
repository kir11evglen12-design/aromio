import almond from "../../assets/notes/almond.webp";
import amber from "../../assets/notes/amber.webp";
import bayleaf from "../../assets/notes/bayleaf.webp";
import bergamot from "../../assets/notes/bergamot.webp";
import blackcurrant from "../../assets/notes/blackcurrant.webp";
import cardamom from "../../assets/notes/cardamom.webp";
import cedar from "../../assets/notes/cedar.webp";
import cinnamon from "../../assets/notes/cinnamon.webp";
import cocoa from "../../assets/notes/cocoa.webp";
import coconut from "../../assets/notes/coconut.webp";
import coffee from "../../assets/notes/coffee.webp";
import gardenia from "../../assets/notes/gardenia.webp";
import ginger from "../../assets/notes/ginger.webp";
import grapefruit from "../../assets/notes/grapefruit.webp";
import greentea from "../../assets/notes/greentea.webp";
import greenapple from "../../assets/notes/greenapple.webp";
import iris from "../../assets/notes/iris.webp";
import jasmine from "../../assets/notes/jasmine.webp";
import lavender from "../../assets/notes/lavender.webp";
import leather from "../../assets/notes/leather.webp";
import lemon from "../../assets/notes/lemon.webp";
import lily from "../../assets/notes/lily.webp";
import mandarin from "../../assets/notes/mandarin.webp";
import marine from "../../assets/notes/marine.webp";
import mineral from "../../assets/notes/mineral.webp";
import mint from "../../assets/notes/mint.webp";
import nutmeg from "../../assets/notes/nutmeg.webp";
import oakmoss from "../../assets/notes/oakmoss.webp";
import musk from "../../assets/notes/musk.webp";
import orange from "../../assets/notes/orange.webp";
import orangeblossom from "../../assets/notes/orangeblossom.webp";
import oud from "../../assets/notes/oud.webp";
import patchouli from "../../assets/notes/patchouli.webp";
import peach from "../../assets/notes/peach.webp";
import pear from "../../assets/notes/pear.webp";
import pepper from "../../assets/notes/pepper.webp";
import pine from "../../assets/notes/pine.webp";
import pineapple from "../../assets/notes/pineapple.webp";
import raspberry from "../../assets/notes/raspberry.webp";
import rose from "../../assets/notes/rose.webp";
import saffron from "../../assets/notes/saffron.webp";
import sandalwood from "../../assets/notes/sandalwood.webp";
import tobacco from "../../assets/notes/tobacco.webp";
import tonka from "../../assets/notes/tonka.webp";
import vanilla from "../../assets/notes/vanilla.webp";
import vetiver from "../../assets/notes/vetiver.webp";
import violet from "../../assets/notes/violet.webp";

/**
 * Photographed ingredients, supplied by the store owner.
 * A note that has no photograph falls back to the drawn disc, so the
 * pyramid stays complete without inventing imagery.
 *
 * Order matters: the first match wins, so a compound name goes above the
 * word it contains ("розовый перец" before "роза", "зелёное яблоко"
 * before the plain apple, "лист фиалки" before the leafy greens).
 */
interface NoteImage {
  match: RegExp;
  src: string;
  /** used as alt text */
  label: string;
}

export const NOTE_IMAGES: NoteImage[] = [
  /* compound names first */
  { match: /мускатный орех|мускатн|мацис/i,   src: nutmeg,        label: "мускатный орех" },
  { match: /дубовый мох|дубовы|оукмосс/i,     src: oakmoss,       label: "дубовый мох" },
  { match: /зелёный чай|зеленый чай|чай/i,    src: greentea,      label: "зелёный чай" },
  { match: /перец|перц/i,                     src: pepper,        label: "чёрный перец" },
  { match: /зелёное яблоко|зеленое яблоко/i,  src: greenapple,    label: "зелёное яблоко" },
  { match: /фиалк/i,                          src: violet,        label: "фиалка" },
  { match: /апельсиновый цвет|флёрдоранж|флердоранж|нероли/i, src: orangeblossom, label: "апельсиновый цвет" },

  /* citrus */
  { match: /бергамот/i,            src: bergamot,   label: "бергамот" },
  { match: /грейпфрут/i,           src: grapefruit, label: "грейпфрут" },
  { match: /лимон|лайм|цитрус/i,   src: lemon,      label: "лимон" },
  { match: /мандарин/i,            src: mandarin,   label: "мандарин" },
  { match: /апельсин/i,            src: orange,     label: "апельсин" },

  /* fruit and berry */
  { match: /яблок/i,               src: greenapple,  label: "яблоко" },
  { match: /груш/i,                src: pear,        label: "груша" },
  { match: /персик/i,              src: peach,       label: "персик" },
  { match: /малин/i,               src: raspberry,   label: "малина" },
  { match: /смородин/i,            src: blackcurrant, label: "чёрная смородина" },
  { match: /ананас/i,              src: pineapple,   label: "ананас" },
  { match: /кокос/i,               src: coconut,     label: "кокос" },

  /* florals */
  { match: /роз(а|ы|ой|е|у)|роза центифолия|центифолия|пион/i, src: rose, label: "роза" },
  { match: /жасмин/i,              src: jasmine,    label: "жасмин" },
  { match: /ландыш/i,              src: lily,       label: "ландыш" },
  { match: /гардени/i,             src: gardenia,   label: "гардения" },
  { match: /ирис/i,                src: iris,       label: "ирис" },
  { match: /лаванд/i,              src: lavender,   label: "лаванда" },

  /* woods, resins, leaves */
  { match: /сандал/i,              src: sandalwood, label: "сандал" },
  { match: /^уд$|агарвуд/i,        src: oud,        label: "уд" },
  { match: /кедр/i,                src: cedar,      label: "кедр" },
  { match: /можжевельник|сосн|хвой|мирт|древесн/i, src: pine, label: "хвоя" },
  { match: /ветивер/i,             src: vetiver,    label: "ветивер" },
  { match: /пачул/i,               src: patchouli,  label: "пачули" },
  { match: /мята|мяты|мятн/i,      src: mint,       label: "мята" },

  /* warm base */
  { match: /амбр|амброксан/i,      src: amber,      label: "амбра" },
  { match: /мускус/i,              src: musk,       label: "белый мускус" },
  { match: /ванил/i,               src: vanilla,    label: "ваниль" },
  { match: /тонка|бобы тонка/i,    src: tonka,      label: "бобы тонка" },
  { match: /кож|замш/i,            src: leather,    label: "кожа" },
  { match: /табак/i,               src: tobacco,    label: "табак" },
  { match: /кофе/i,                src: coffee,     label: "кофе" },
  { match: /корица|корицы/i,       src: cinnamon,   label: "корица" },
  { match: /кардамон/i,            src: cardamom,   label: "кардамон" },
  { match: /имбир/i,               src: ginger,     label: "имбирь" },
  { match: /шафран/i,              src: saffron,    label: "шафран" },
  { match: /лавр/i,                src: bayleaf,    label: "лавровый лист" },
  { match: /миндал/i,              src: almond,     label: "миндаль" },
  { match: /какао|шоколад|джандуй/i, src: cocoa,    label: "какао" },

  /* mineral and marine */
  { match: /морск|соль|водоросл|акватич/i, src: marine, label: "морская соль" },
  { match: /минерал|камен|камн|галь/i,     src: mineral, label: "минеральный аккорд" }
];

export const noteImage = (name: string): NoteImage | undefined =>
  NOTE_IMAGES.find(n => n.match.test(name));
