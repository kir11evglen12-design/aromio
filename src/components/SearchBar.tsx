import { useEffect, useRef, useState } from "react";
import { Mic, Search, Shuffle, Sparkles, X } from "lucide-react";
import { products } from "../data/products";
import { useShop } from "../lib/shop";

/** the browser's speech API, where it exists */
interface Recognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechCtor = new () => Recognizer;

const speechCtor = (): SpeechCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/**
 * The shop's search: one field for a name, a house, a line or a note, with
 * three buttons that each do something real — the command palette over the
 * whole site, dictation where the browser offers it, and a random bottle
 * for when nothing in particular is wanted.
 */
export default function SearchBar() {
  const { noteQuery, setNoteQuery, setPaletteOpen, openProduct, toast } = useShop();
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const rec = useRef<Recognizer | null>(null);

  /* the microphone is only offered when the browser actually has one */
  useEffect(() => { setCanSpeak(!!speechCtor()); }, []);

  const dictate = () => {
    const Ctor = speechCtor();
    if (!Ctor) return;

    if (listening) { rec.current?.stop(); return; }

    const r = new Ctor();
    rec.current = r;
    r.lang = "ru-RU";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = e => setNoteQuery(e.results[e.results.length - 1][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast("Микрофон недоступен"); };

    try { r.start(); setListening(true); } catch { toast("Микрофон недоступен"); }
  };

  const random = () => {
    const p = products[Math.floor(Math.random() * products.length)];
    openProduct(p.id);
  };

  return (
    <div className={"sbar" + (listening ? " is-listening" : "")}>
      <Search className="sbar-glass" size={20} strokeWidth={1.7} aria-hidden />

      <input
        value={noteQuery}
        onChange={e => setNoteQuery(e.target.value)}
        placeholder="Аромат, дом, нота — например: уд, Dior, ваниль"
        aria-label="Поиск по витрине"
      />

      {noteQuery && (
        <button className="sbar-btn" onClick={() => setNoteQuery("")} aria-label="Очистить поиск">
          <X size={17} strokeWidth={1.8} />
        </button>
      )}

      <span className="sbar-sep" aria-hidden />

      <button className="sbar-btn" onClick={() => setPaletteOpen(true)}
              aria-label="Поиск по всему сайту: разделы, статьи, термины">
        <Sparkles size={19} strokeWidth={1.6} />
      </button>

      {canSpeak && (
        <button className="sbar-btn" onClick={dictate}
                aria-pressed={listening}
                aria-label={listening ? "Остановить диктовку" : "Продиктовать запрос"}>
          <Mic size={19} strokeWidth={1.6} />
        </button>
      )}

      <button className="sbar-btn" onClick={random} aria-label="Показать случайный аромат">
        <Shuffle size={19} strokeWidth={1.6} />
      </button>
    </div>
  );
}
