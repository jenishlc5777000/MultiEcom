"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Favourites and recently viewed, kept in the visitor's browser (localStorage)
 * so they work without signing in. Every tab and component stays in sync.
 */
export const FAVOURITES_KEY = "cg-favourites";
export const RECENT_KEY = "cg-recently-viewed";
const EVENT = "cg-list-change";
const MAX = 48;
const EMPTY: string[] = [];
const snapshots = new Map<string, { raw: string | null; value: string[] }>();

function read(key: string): string[] {
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

function write(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => (e.key === FAVOURITES_KEY || e.key === RECENT_KEY) && cb();
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

export function useFavourites() {
  const list = useStoredList(FAVOURITES_KEY);
  const toggle = useCallback((id: string) => {
    const cur = read(FAVOURITES_KEY);
    write(FAVOURITES_KEY, cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur]);
  }, []);
  const clear = useCallback(() => write(FAVOURITES_KEY, []), []);
  return { list, has: (id: string) => list.includes(id), toggle, clear };
}

/** Put `id` at the front of the recently viewed list. */
export function recordRecentlyViewed(id: string) {
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)]);
}
export const clearRecentlyViewed = () => write(RECENT_KEY, []);
