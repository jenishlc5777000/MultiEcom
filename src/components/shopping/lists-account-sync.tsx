"use client";

import { useEffect } from "react";
import { syncFavouritesAction } from "@/actions/favourites.actions";
import { setListsAccount, takeGuestFavourites } from "@/lib/client-lists";

/**
 * Points favourites and recently viewed at the signed-in customer's own lists
 * (or the guest lists when signed out), and loads their saved favourites.
 * Favourites added before signing in move into the account.
 */
export function ListsAccountSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (!userId) {
      setListsAccount(null);
      return;
    }
    setListsAccount(userId);
    let live = true;
    syncFavouritesAction(takeGuestFavourites())
      .then((list) => live && list && setListsAccount(userId, list))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [userId]);
  return null;
}
