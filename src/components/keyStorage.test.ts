import { describe, expect, it } from "vitest";
import { clearKey, KEY_NAME, readKey, writeKey, type KeyStores } from "./keyStorage";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

const stores = (): KeyStores => ({ local: memoryStorage(), session: memoryStorage() });

describe("key storage", () => {
  it("remembers the key on this device in local storage", () => {
    const s = stores();
    writeKey(s, "AIzaKEY1234", true);
    expect(readKey(s)).toEqual({ key: "AIzaKEY1234", remembered: true });
    expect(s.session!.getItem(KEY_NAME)).toBeNull();
  });

  it("keeps it only for the tab when not remembered", () => {
    const s = stores();
    writeKey(s, "AIzaKEY1234", false);
    expect(readKey(s)).toEqual({ key: "AIzaKEY1234", remembered: false });
    expect(s.local!.getItem(KEY_NAME)).toBeNull();
  });

  it("switching to not remembered removes the saved copy", () => {
    const s = stores();
    writeKey(s, "AIzaKEY1234", true);
    writeKey(s, "AIzaKEY1234", false);
    expect(s.local!.getItem(KEY_NAME)).toBeNull();
    expect(readKey(s).remembered).toBe(false);
  });

  it("clears both places", () => {
    const s = stores();
    writeKey(s, "AIzaKEY1234", true);
    clearKey(s);
    expect(readKey(s)).toEqual({ key: "", remembered: false });
  });

  it("copes with storage that is missing or throws", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    const s = { local: broken, session: null };
    expect(() => writeKey(s, "AIzaKEY1234", true)).not.toThrow();
    expect(readKey(s)).toEqual({ key: "", remembered: false });
  });
});
