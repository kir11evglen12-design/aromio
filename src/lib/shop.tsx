import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from "react";
import type { ReactNode } from "react";
import { byId, HOUSES, products } from "../data/products";
import type { House, Product } from "../data/products";
import {
  loadUsers, readSession, upsertUser, writeSession
} from "./auth";
import type { Order, User } from "./auth";

type Drawer = "cart" | "search" | "auth" | null;
export type Filter = "all" | Product["category"] | House;

interface ShopValue {
  cart: Product[];
  cartTotal: number;
  addToCart: (id: number) => void;
  removeFromCart: (index: number) => void;
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

  toast: (msg: string) => void;
  toastMsg: string;
}

const Ctx = createContext<ShopValue | null>(null);

export const useShop = (): ShopValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
};

const CART_KEY = "aromioCart";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Product[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as Product[];
      /* ids are the source of truth — prices and copy may have changed */
      return raw.map(p => byId(p.id)).filter(Boolean);
    } catch {
      return [];
    }
  });

  const [user, setUserState] = useState<User | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authIntro, setAuthIntro] = useState("Войдите, чтобы видеть историю заказов и избранные ароматы.");
  const [productId, setProductId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [category, setCategory] = useState<Filter>("all");
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<number>(0);

  /* restore the session once on mount */
  useEffect(() => {
    const email = readSession();
    if (!email) return;
    const found = loadUsers().find(u => u.email === email);
    if (found) setUserState({ ...found, orders: found.orders ?? [], favorites: found.favorites ?? [] });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart.map(p => ({ id: p.id }))));
    } catch {
      /* ignore */
    }
  }, [cart]);

  /* body scroll lock while an overlay is up */
  useEffect(() => {
    const locked = drawer !== null || productId !== null || profileOpen;
    document.body.classList.toggle("is-locked", locked);
  }, [drawer, productId, profileOpen]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(""), 2800);
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    writeSession(u ? u.email : null);
    if (u) upsertUser(u);
  }, []);

  const addToCart = useCallback((id: number) => {
    const p = byId(id);
    setCart(c => [...c, p]);
    toast(`${p.name} — добавлен в корзину`);
  }, [toast]);

  const removeFromCart = useCallback((index: number) => {
    setCart(c => c.filter((_, i) => i !== index));
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
      items: cart.map(p => ({ name: p.name, brand: p.brand, price: p.price, volume: p.volume })),
      total: cart.reduce((s, p) => s + p.price, 0),
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
      else setDrawer(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [productId, profileOpen]);

  const value = useMemo<ShopValue>(() => ({
    cart,
    cartTotal: cart.reduce((s, p) => s + p.price, 0),
    addToCart,
    removeFromCart,
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
    openProduct: (id: number) => { setDrawer(null); setProductId(id); },
    closeProduct: () => setProductId(null),
    productId,
    profileOpen,
    openProfile: () => (user ? setProfileOpen(true) : openAuth("login")),
    closeProfile: () => setProfileOpen(false),
    category,
    setCategory,
    toast,
    toastMsg
  }), [
    cart, addToCart, removeFromCart, checkout, user, setUser, signOut, saveProfile,
    isFavorite, toggleFavorite, drawer, authIntro, openAuth, authMode, productId,
    profileOpen, category, toast, toastMsg
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const visibleProducts = (filter: Filter): Product[] => {
  if (filter === "all") return products;
  if ((HOUSES as readonly string[]).includes(filter)) {
    return products.filter(p => p.brand === filter);
  }
  return products.filter(p => p.category === filter);
};
