"use client";

import { useCallback, useSyncExternalStore } from "react";
import { clearFavouritesAction, setFavouriteAction } from "@/actions/favourites.actions";

/**
 * Favourites and recently viewed, kept in the browser (localStorage) so they
 * work without signing in. Each signed-in customer has their own lists (and
 * favourites are also saved to their account by <ListsAccountSync>), so people
 * sharing a browser never see each other's. Every tab and component stays in sync.
 */
export const FAVOURITES_KEY = "cg-favourites";
export const RECENT_KEY = "cg-recently-viewed";
const EVENT = "cg-list-change";
const MAX = 48;
const EMPTY: string[] = [];
const snapshots = new Map<string, { raw: string | null; value: string[] }>();

/** "" = signed out (guest). Set by <ListsAccountSync>. */
let account = "";
/** Storage key for a list: guests keep the original key; each account has its own. */
const keyFor = (base: string, who = account) => (who ? `${base}:u:${who}` : base);

function readKey(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value;
  let value: string[] = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    value = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string" && /^[a-f0-9]{24}$/.test(x)).slice(0, MAX) : EMPTY;
  } catch {}
  snapshots.set(key, { raw, value });
  return value;
}
const read = (base: string) => readKey(keyFor(base));

function writeKey(key: string, list: string[]) {
  try {
    if (list.length) localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
    else localStorage.removeItem(key);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}
const write = (base: string, list: string[]) => writeKey(keyFor(base), list);

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => (e.key?.startsWith(FAVOURITES_KEY) || e.key?.startsWith(RECENT_KEY)) && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Live list of product ids for `key` (empty during server render). */
export function useStoredList(key: string) {
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}

/**
 * Switch the lists to this account (or to the guest lists when null).
 * `favourites` is the account's saved list from the server.
 */
export function setListsAccount(userId: string | null, favourites?: string[]) {
  account = userId ?? "";
  if (userId && favourites) writeKey(keyFor(FAVOURITES_KEY, userId), favourites);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: "account" }));
}

/** Guest favourites (saved before signing in), handed over once to the account that signs in. */
export function takeGuestFavourites() {
  const list = readKey(FAVOURITES_KEY);
  if (list.length) writeKey(FAVOURITES_KEY, []);
  return list;
}

export function useFavourites() {
  const list = useStoredList(FAVOURITES_KEY);
  const toggle = useCallback((id: string) => {
    const cur = read(FAVOURITES_KEY);
    const on = !cur.includes(id);
    write(FAVOURITES_KEY, on ? [id, ...cur] : cur.filter((x) => x !== id));
    if (account) setFavouriteAction(id, on).catch(() => {});
  }, []);
  const clear = useCallback(() => {
    write(FAVOURITES_KEY, []);
    if (account) clearFavouritesAction().catch(() => {});
  }, []);
  return { list, has: (id: string) => list.includes(id), toggle, clear };
}

/** Put `id` at the front of the recently viewed list. */
export function recordRecentlyViewed(id: string) {
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)]);
}
export const clearRecentlyViewed = () => write(RECENT_KEY, []);
