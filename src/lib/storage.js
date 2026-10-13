const DATABASE_NAME = "quickkeep";
const STORE_NAME = "items";
const LEGACY_KEY = "linkvault-links";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runRequest(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onabort = () => reject(transaction.error);
  }).finally(() => database.close());
}

export async function getSavedItems() {
  const items = await runRequest("readonly", (store) => store.getAll());
  if (items.length > 0) return items.sort((first, second) => second.createdAt.localeCompare(first.createdAt));

  const legacyLinks = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
  const migratedItems = legacyLinks.map((link) => ({
    id: String(link.id),
    kind: "link",
    name: link.title,
    description: "",
    url: link.url,
    createdAt: new Date(link.date || Date.now()).toISOString(),
  }));

  if (migratedItems.length > 0) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    migratedItems.forEach((item) => transaction.objectStore(STORE_NAME).put(item));
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  }

  return migratedItems;
}

export function saveSavedItem(item) {
  return runRequest("readwrite", (store) => store.put(item));
}

export function deleteSavedItem(id) {
  return runRequest("readwrite", (store) => store.delete(id));
}