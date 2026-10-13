import { useEffect, useState } from "react";
import AddItemForm from "./components/AddItemForm.jsx";
import SavedItems from "./components/SavedItems.jsx";
import { deleteSavedItem, getSavedItems, saveSavedItem } from "./lib/storage.js";
import "./App.css";

function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    getSavedItems()
      .then((savedItems) => {
        if (isCurrent) setItems(savedItems);
      })
      .catch(() => {
        if (isCurrent) setStorageError("Your saved items could not be loaded.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function addItem({ kind, name, description, url, file }) {
    const item = {
      id: crypto.randomUUID(),
      kind,
      name: name.trim(),
      description: description.trim(),
      url,
      file,
      fileName: file?.name,
      createdAt: new Date().toISOString(),
    };

    await saveSavedItem(item);
    setItems((currentItems) => [item, ...currentItems]);
  }

  async function removeItem(id) {
    await deleteSavedItem(id);
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter((item) =>
    [item.name, item.description, item.url, item.fileName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch)),
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="QuickKeep home">
          <span className="brand-mark" aria-hidden="true">q</span>
          <span>quickkeep</span>
        </a>
        <span className="topbar-note">A little space for the things worth keeping.</span>
      </header>

      <div className="content-wrap" id="home">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">YOUR PERSONAL LIBRARY</p>
            <h1 id="page-title">Keep what<br />you want to find.</h1>
            <p className="intro-copy">One home for useful links and files. No folders to keep track of.</p>
          </div>
          <div className="item-total" aria-label={`${items.length} saved items`}>
            <span>{String(items.length).padStart(2, "0")}</span>
            <small>items kept</small>
          </div>
        </section>

        <AddItemForm onAdd={addItem} />

        <section className="library" aria-labelledby="library-title">
          <div className="library-heading">
            <div>
              <p className="eyebrow">THE WHOLE COLLECTION</p>
              <h2 id="library-title">Everything, together<span>.</span></h2>
            </div>
            <label className="search-control">
              <span className="visually-hidden">Search saved items</span>
              <input
                type="search"
                placeholder="Search your keep..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {storageError && <p className="status-message" role="alert">{storageError}</p>}
          <SavedItems
            items={visibleItems}
            isLoading={isLoading}
            hasItems={items.length > 0}
            onDelete={removeItem}
          />
        </section>
      </div>
      <footer className="site-footer"><span>QUICKKEEP</span><span>Small things, close at hand.</span></footer>
    </main>
  );
}

export default App;
