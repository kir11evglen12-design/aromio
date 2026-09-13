import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from "react";
import type { ReactNode } from "react";
import { byId, HOUSES, priceNow, products, variantOf } from "../data/products";
import type { House, Product } from "../data/products";
import {
  loadUsers, readSession, upsertUser, writeSession
} from "./auth";
import type { Order, Reminder, ShelfItem, User } from "./auth";

type Drawer = "cart" | "search" | "auth" | null;

/** a chosen bottle: the fragrance plus the volume the shopper picked */
export interface CartLine {
  /** stable per line, so two identical bottles stay two separate rows */
  uid: string;
  product: Product;
  ml: number;
  price: number;
}

let lineSeq = 0;
const nextUid = (): string => `l${++lineSeq}`;
export type Filter = "all" | Product["category"] | House;
/* сортировки по названию нет: имя ищут поиском, а не листают по алфавиту */
export type Sort = "house" | "price-asc" | "price-desc";

export const SORT_LABEL: Record<Sort, string> = {
  house: "По дому",
  "price-asc": "↓ Сначала дешевле",
  "price-desc": "↑ Сначала дороже"
};

interface ShopValue {
  cart: CartLine[];
  cartTotal: number;
  addToCart: (id: number, ml?: number) => void;
  removeFromCart: (index: number) => void;
  restoreToCart: (index: number, line: CartLine) => void;
  /** «Купить сейчас»: кладёт в корзину и сразу открывает её на оформлении */
  buyNow: (id: number, ml?: number) => void;
  checkout: () => void;

  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => void;
  saveProfile: (patch: Partial<User>) => void;

  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number) => void;

  drawer: Drawer;
  openDrawer: (d: Drawer) => void;
  closeDrawer: () => void;
  authIntro: string;
  openAuth: (mode: "login" | "register", intro?: string) => void;
  authMode: "login" | "register";
  setAuthMode: (m: "login" | "register") => void;

  openProduct: (id: number) => void;
  closeProduct: () => void;
  productId: number | null;

  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;

  category: Filter;
  setCategory: (c: Filter) => void;
  sort: Sort;
  setSort: (s: Sort) => void;
  noteQuery: string;
  setNoteQuery: (q: string) => void;

  /** side-by-side comparison, three bottles at most */
  compare: number[];
  toggleCompare: (id: number) => void;
  clearCompare: () => void;
  compareOpen: boolean;
  setCompareOpen: (v: boolean) => void;

  /** the last products opened, newest first */
  recent: number[];
  removeRecent: (id: number) => void;
  clearRecent: () => void;

  /** bottles the visitor says they own */
  shelf: ShelfItem[];
  addToShelf: (id: number, ml: number) => void;
  removeFromShelf: (id: number) => void;
  onShelf: (id: number) => boolean;

  /** self-set reminders */
  reminders: Reminder[];
  addReminder: (text: string, due: string) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;

  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;

  /** the catalogue in its own window */
  catalogOpen: boolean;
  openCatalog: () => void;
  closeCatalog: () => void;

  /** the undo action is optional; when present the toast offers it for 4s */
  toast: (msg: string, undo?: () => void) => void;
  toastMsg: string;
  toastUndo: (() => void) | null;
  runUndo: () => void;
}

const Ctx = createContext<ShopValue | null>(null);

export const useShop = (): ShopValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
};

const CART_KEY = "aromioCart";
const RECENT_KEY = "aromioRecent";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as { id: number; ml?: number }[];
      /* ids and volumes are stored; prices are re-read so they never go stale */
      return raw.map(({ id, ml }) => {
        const product = byId(id);
        const variant = variantOf(product, ml ?? product.variants[0].ml);
        return { uid: nextUid(), product, ml: variant.ml, price: priceNow(product, variant) };
      });
    } catch {
      return [];
    }
  });

  const [user, setUserState] = useState<User | null>(null);
  /* openProfile is called right after sign-in, before the memo that captured
     `user` has re-run, so it reads the account through a ref instead */
  const userRef = useRef<User | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authIntro, setAuthIntro] = useState("Войдите, чтобы видеть историю заказов и избранные ароматы.");
  const [productId, setProductId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [category, setCategory] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("house");
  const [noteQuery, setNoteQuery] = useState("");
  const [compare, setCompare] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [recent, setRecent] = useState<number[]>(() => {
    try {
      return (JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as number[]).slice(0, 8);
    } catch {
      return [];
    }
  });
  const [toastMsg, setToastMsg] = useState("");
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null);
  const toastTimer = useRef<number>(0);

  /* restore the session once on mount */
  useEffect(() => {
    const email = readSession();
    if (!email) return;
    const found = loadUsers().find(u => u.email === email);
    if (found) {
      const restored = {
        ...found,
        orders: found.orders ?? [],
        favorites: found.favorites ?? [],
        shelf: found.shelf ?? [],
        reminders: found.reminders ?? []
      };
      userRef.current = restored;
      setUserState(restored);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart.map(l => ({ id: l.product.id, ml: l.ml }))));
    } catch {
      /* ignore */
    }
  }, [cart]);

  /* body scroll lock while an overlay is up */
  useEffect(() => {
    const locked = drawer !== null || productId !== null || profileOpen || catalogOpen;
    document.body.classList.toggle("is-locked", locked);
  }, [drawer, productId, profileOpen, catalogOpen]);

  useEffect(() => {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch { /* ignore */ }
  }, [recent]);

  const toast = useCallback((msg: string, undo?: () => void) => {
    setToastMsg(msg);
    setToastUndo(() => undo ?? null);
    clearTimeout(toastTimer.current);
    /* an undoable action stays on screen for the full four seconds the
       progress bar counts down; a plain notice leaves sooner */
    toastTimer.current = window.setTimeout(() => {
      setToastMsg("");
      setToastUndo(null);
    }, undo ? 4000 : 2800);
  }, []);

  const runUndo = useCallback(() => {
    setToastUndo(current => { current?.(); return null; });
    clearTimeout(toastTimer.current);
    setToastMsg("");
  }, []);

  const setUser = useCallback((u: User | null) => {
    userRef.current = u;
    setUserState(u);
    writeSession(u ? u.email : null);
    if (u) upsertUser(u);
  }, []);

  const addToCart = useCallback((id: number, ml?: number) => {
    const product = byId(id);
    const variant = variantOf(product, ml ?? 100);
    setCart(c => [...c, { uid: nextUid(), product, ml: variant.ml, price: priceNow(product, variant) }]);
    toast(`${product.brand} ${product.name}, ${variant.ml} мл — в корзине`);
  }, [toast]);

  const removeFromCart = useCallback((index: number) => {
    setCart(c => c.filter((_, i) => i !== index));
  }, []);

  /**
   * Кнопка «Купить сейчас» обязана вести к покупке: товар уходит в корзину
   * и корзина тут же открывается, иначе надпись обманывает — человек жмёт
   * «купить», а с виду не происходит ничего.
   */
  const buyNow = useCallback((id: number, ml?: number) => {
    addToCart(id, ml);
    setDrawer("cart");
  }, [addToCart]);

  /** put a removed line back exactly where it was — this is what undo does */
  const restoreToCart = useCallback((index: number, line: CartLine) => {
    setCart(c => [...c.slice(0, index), line, ...c.slice(index)]);
  }, []);

  const openAuth = useCallback((mode: "login" | "register", intro?: string) => {
    setAuthMode(mode);
    setAuthIntro(intro ?? "Войдите, чтобы видеть историю заказов и избранные ароматы.");
    setDrawer("auth");
  }, []);

  const checkout = useCallback(() => {
    if (!cart.length) { toast("Корзина пуста"); return; }
    if (!user) {
      setDrawer(null);
      openAuth("login", "Войдите или создайте аккаунт, чтобы оформить заказ.");
      return;
    }

    const order: Order = {
      id: "ARO-" + Math.floor(Math.random() * 90000 + 10000),
      date: new Date().toISOString(),
      items: cart.map(l => ({
        name: l.product.name, brand: l.product.brand, price: l.price, volume: `${l.ml} мл`
      })),
      total: cart.reduce((sum, l) => sum + l.price, 0),
      status: "Принят"
    };

    const next = { ...user, orders: [order, ...user.orders] };
    setUser(next);
    setCart([]);
    setDrawer(null);
    toast(`Заказ ${order.id} принят. Мы свяжемся с вами.`);
  }, [cart, user, setUser, toast, openAuth]);

  const isFavorite = useCallback(
    (id: number) => !!user && user.favorites.includes(id),
    [user]
  );

  const toggleFavorite = useCallback((id: number) => {
    if (!user) {
      openAuth("register", "Создайте аккаунт, чтобы сохранять любимые ароматы.");
      return;
    }
    const has = user.favorites.includes(id);
    setUser({
      ...user,
      favorites: has ? user.favorites.filter(f => f !== id) : [...user.favorites, id]
    });
    toast(has ? "Удалено из избранного" : "Добавлено в избранное");
  }, [user, setUser, toast, openAuth]);

  const toggleCompare = useCallback((id: number) => {
    setCompare(c => {
      if (c.includes(id)) return c.filter(x => x !== id);
      if (c.length >= 3) { toast("В сравнении уже три аромата"); return c; }
      return [...c, id];
    });
  }, [toast]);

  const shelf = useMemo<ShelfItem[]>(() => user?.shelf ?? [], [user]);

  const addToShelf = useCallback((id: number, ml: number) => {
    if (!user) { openAuth("register", "Заведите аккаунт, чтобы вести свою полку."); return; }
    if (shelf.some(s => s.id === id)) { toast("Уже на полке"); return; }
    setUser({ ...user, shelf: [...shelf, { id, ml, opened: new Date().toISOString() }] });
    toast("Добавлено на полку");
  }, [user, shelf, setUser, toast, openAuth]);

  const removeFromShelf = useCallback((id: number) => {
    if (!user) return;
    setUser({ ...user, shelf: shelf.filter(s => s.id !== id) });
  }, [user, shelf, setUser]);

  const reminders = useMemo<Reminder[]>(() => user?.reminders ?? [], [user]);

  const addReminder = useCallback((text: string, due: string) => {
    if (!user) { openAuth("register", "Напоминания хранятся в вашем аккаунте."); return; }
    const next: Reminder = { id: "r" + Date.now(), text, due, done: false };
    setUser({ ...user, reminders: [next, ...reminders] });
    toast("Напоминание сохранено");
  }, [user, reminders, setUser, toast, openAuth]);

  const toggleReminder = useCallback((id: string) => {
    if (!user) return;
    setUser({ ...user, reminders: reminders.map(r => r.id === id ? { ...r, done: !r.done } : r) });
  }, [user, reminders, setUser]);

  const removeReminder = useCallback((id: string) => {
    if (!user) return;
    setUser({ ...user, reminders: reminders.filter(r => r.id !== id) });
  }, [user, reminders, setUser]);

  const saveProfile = useCallback((patch: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...patch });
    toast("Данные сохранены");
  }, [user, setUser, toast]);

  const signOut = useCallback(() => {
    setUser(null);
    setProfileOpen(false);
    toast("Вы вышли из аккаунта");
  }, [setUser, toast]);

  /* Escape closes the topmost layer */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (productId !== null) setProductId(null);
      else if (profileOpen) setProfileOpen(false);
      else if (catalogOpen) setCatalogOpen(false);
      else setDrawer(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [productId, profileOpen, catalogOpen]);

  const value = useMemo<ShopValue>(() => ({
    cart,
    cartTotal: cart.reduce((sum, l) => sum + l.price, 0),
    addToCart,
    removeFromCart,
    restoreToCart,
    buyNow,
    checkout,
    user,
    setUser,
    signOut,
    saveProfile,
    isFavorite,
    toggleFavorite,
    drawer,
    openDrawer: setDrawer,
    closeDrawer: () => setDrawer(null),
    authIntro,
    openAuth,
    authMode,
    setAuthMode,
    openProduct: (id: number) => {
      setDrawer(null);
      setProductId(id);
      setRecent(r => [id, ...r.filter(x => x !== id)].slice(0, 8));
    },
    closeProduct: () => setProductId(null),
    productId,
    profileOpen,
    openProfile: () => (userRef.current ? setProfileOpen(true) : openAuth("login")),
    closeProfile: () => setProfileOpen(false),
    category,
    setCategory,
    sort,
    setSort,
    noteQuery,
    setNoteQuery,
    compare,
    toggleCompare,
    clearCompare: () => setCompare([]),
    compareOpen,
    setCompareOpen,
    recent,
    removeRecent: (id: number) => setRecent(r => r.filter(x => x !== id)),
    clearRecent: () => setRecent([]),
    shelf,
    addToShelf,
    removeFromShelf,
    onShelf: (id: number) => shelf.some(s => s.id === id),
    reminders,
    addReminder,
    toggleReminder,
    removeReminder,
    paletteOpen,
    setPaletteOpen,
    catalogOpen,
    openCatalog: () => setCatalogOpen(true),
    closeCatalog: () => setCatalogOpen(false),
    toast,
    toastMsg,
    toastUndo,
    runUndo
  }), [
    cart, addToCart, removeFromCart, restoreToCart, buyNow, checkout, user, setUser, signOut, saveProfile,
    isFavorite, toggleFavorite, drawer, authIntro, openAuth, authMode, productId,
    profileOpen, category, sort, noteQuery, compare, toggleCompare, compareOpen,
    recent, shelf, addToShelf, removeFromShelf, reminders, addReminder,
    toggleReminder, removeReminder, paletteOpen, catalogOpen, toast, toastMsg,
    toastUndo, runUndo
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * A query has to hit the start of a word, not just any substring: plain
 * `includes` made "уд" match "пУДровый". JS word boundaries do not work on
 * Cyrillic, so the character before the hit is checked by hand — which
 * still lets a prefix like "ванил" find "ваниль".
 */
const isLetter = (ch: string): boolean => /[\p{L}\p{N}]/u.test(ch);

const startsWord = (hay: string, needle: string): boolean => {
  let i = hay.indexOf(needle);
  while (i !== -1) {
    if (i === 0 || !isLetter(hay[i - 1])) return true;
    i = hay.indexOf(needle, i + 1);
  }
  return false;
};

export const visibleProducts = (
  filter: Filter,
  sort: Sort = "house",
  noteQuery = ""
): Product[] => {
  let list = products;

  if (filter !== "all") {
    list = (HOUSES as readonly string[]).includes(filter)
      ? list.filter(p => p.brand === filter)
      : list.filter(p => p.category === filter);
  }

  /* one field searches everything a shopper might type: a name, a house,
     a line, the concentration or a note */
  const q = noteQuery.trim().toLowerCase();
  if (q) {
    const words = q.split(/\s+/).filter(Boolean);
    list = list.filter(p => {
      const hay = [
        p.name, p.brand, p.line, p.type, p.desc,
        p.notes.top, p.notes.heart, p.notes.base
      ].join(" ").toLowerCase();
      return words.every(w => startsWord(hay, w));
    });
  }

  const priced = (p: Product) => Math.min(...p.variants.map(v => v.price));

  switch (sort) {
    case "price-asc":  return [...list].sort((a, b) => priced(a) - priced(b));
    case "price-desc": return [...list].sort((a, b) => priced(b) - priced(a));
    default:           return list;
  }
};
