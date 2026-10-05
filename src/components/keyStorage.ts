// Where the Gemini key lives in the browser. "Remember on this device" uses
// localStorage; otherwise sessionStorage, which the browser clears when the
// tab closes. The key is only ever sent to Google, never to Tailor's server.
export const KEY_NAME = "tailor.geminiKey";

export type KeyStores = { local: Storage | null; session: Storage | null };

// Storage can be missing or throw (private mode, blocked site data).
function get(store: Storage | null): string {
  try {
    return store?.getItem(KEY_NAME) ?? "";
  } catch {
    return "";
  }
}

function set(store: Storage | null, value: string | null): void {
  try {
    if (value) store?.setItem(KEY_NAME, value);
    else store?.removeItem(KEY_NAME);
  } catch {
    // Nowhere to keep it; the key just won't persist.
  }
}

export function readKey(stores: KeyStores): { key: string; remembered: boolean } {
  const remembered = get(stores.local);
  if (remembered) return { key: remembered, remembered: true };
  return { key: get(stores.session), remembered: false };
}

// Keeps the key in exactly one place, so turning "remember" off really forgets it.
export function writeKey(stores: KeyStores, key: string, remember: boolean): void {
  set(remember ? stores.local : stores.session, key);
  set(remember ? stores.session : stores.local, null);
}

export function clearKey(stores: KeyStores): void {
  set(stores.local, null);
  set(stores.session, null);
}
