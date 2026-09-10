/**
 * Client-side accounts.
 *
 * This storefront has no backend, so an account lives in the browser.
 * Passwords are never stored — only a PBKDF2-SHA256 hash over a random
 * per-user salt. That is honest about what it can and cannot protect:
 * it keeps the password itself out of localStorage, but it is not a
 * substitute for server-side auth in a real shop.
 */

export interface Order {
  id: string;
  date: string;
  items: { name: string; brand: string; price: number; volume: string }[];
  total: number;
  status: string;
}

export interface User {
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: string;
  phone: string;
  city: string;
  address: string;
  orders: Order[];
  favorites: number[];
}

const USERS_KEY = "aromio_users";
const SESSION_KEY = "aromio_session";

export const canHash = (): boolean =>
  typeof crypto !== "undefined" && !!crypto.subtle && window.isSecureContext;

export function loadUsers(): User[] {
  try {
    return (JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as User[]) ?? [];
  } catch {
    return [];
  }
}

export function saveUsers(list: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  } catch {
    /* private mode — the session simply will not persist */
  }
}

export function upsertUser(user: User): void {
  const users = loadUsers();
  const i = users.findIndex(u => u.email === user.email);
  if (i > -1) users[i] = user;
  else users.push(user);
  saveUsers(users);
}

export function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeSession(email: string | null): void {
  try {
    if (email) localStorage.setItem(SESSION_KEY, email);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

const toHex = (buf: ArrayBuffer): string =>
  [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

export function randomSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

export async function derive(password: string, saltHex: string): Promise<string> {
  const salt = Uint8Array.from(saltHex.match(/../g)!.map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 150_000, hash: "SHA-256" }, key, 256
  );
  return toHex(bits);
}

export function initials(user: User): string {
  const src = (user.name || user.email).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase();
}

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

export function memberSince(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

/**
 * Russian counts need three forms: 1 аромат, 2 аромата, 5 ароматов.
 * Teens are the exception — 11–14 always take the last form.
 */
export const plural = (n: number, one: string, few: string, many: string): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};
