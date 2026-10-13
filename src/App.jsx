import { useEffect, useState } from "react";
import AuthForm from "./components/AuthForm.jsx";
import AddItemForm from "./components/AddItemForm.jsx";
import SavedItems from "./components/SavedItems.jsx";
import { deleteSavedItem, getFileDownloadUrl, getSavedItems, saveSavedItem } from "./lib/items.js";
import { getCurrentSession, isSupabaseConfigured, onAuthStateChange, signOut } from "./lib/supabase.js";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [items, setItems] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let isCurrent = true;
    const unsubscribe = onAuthStateChange((session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });
    getCurrentSession()
      .then((session) => {
        if (isCurrent) setUser(session?.user ?? null);
      })
      .catch(() => {
        if (isCurrent) setStorageError("Your sign-in session could not be checked.");
      })
      .finally(() => {
        if (isCurrent) setIsAuthLoading(false);
      });

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    let isCurrent = true;

    getSavedItems()
      .then((savedItems) => {
        if (isCurrent) {
          setItems(savedItems);
          setLoadedUserId(user.id);
          setStorageError("");
        }
      })
      .catch(() => {
        if (isCurrent) {
          setLoadedUserId(user.id);
          setStorageError("Your saved items could not be loaded.");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [user]);

  async function addItem({ kind, name, description, url, file }) {
    const item = {
      id: crypto.randomUUID(),
      kind,
      name: name.trim(),
      description: description.trim(),
      url,
      file,
      createdAt: new Date().toISOString(),
    };

    const savedItem = await saveSavedItem(item);
    setItems((currentItems) => [savedItem, ...currentItems]);
  }

  async function removeItem(id) {
    try {
      await deleteSavedItem(id);
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch {
      setStorageError("This item could not be deleted. Please try again.");
    }
  }

  async function downloadItem(item) {
    try {
      const url = await getFileDownloadUrl(item);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setStorageError("This file could not be downloaded. Please try again.");
    }
  }

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) setStorageError("You could not be signed out. Please try again.");
  }

  const normalizedSearch = search.trim().toLowerCase();
  const userItems = loadedUserId === user?.id ? items : [];
  const visibleItems = userItems.filter((item) =>
    [item.name, item.description, item.url, item.fileName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch)),
  );

  if (isAuthLoading) {
    return <main className="auth-layout"><p role="status">Checking your account...</p></main>;
  }

  if (!user) return <AuthForm isConfigured={isSupabaseConfigured} />;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="QuickKeep home">
          <span className="brand-mark" aria-hidden="true">q</span>
          <span>quickkeep</span>
        </a>
        <div className="account-controls">
          <span className="topbar-note">{user.email}</span>
          <button className="sign-out-button" type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <div className="content-wrap" id="home">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">YOUR PERSONAL LIBRARY</p>
            <h1 id="page-title">Keep what<br />you want to find.</h1>
            <p className="intro-copy">One home for useful links and files. No folders to keep track of.</p>
          </div>
          <div className="item-total" aria-label={`${userItems.length} saved items`}>
            <span>{String(userItems.length).padStart(2, "0")}</span>
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
            isLoading={isLoading || loadedUserId !== user.id}
            hasItems={userItems.length > 0}
            onDelete={removeItem}
            onDownload={downloadItem}
          />
        </section>
      </div>
      <footer className="site-footer"><span>QUICKKEEP</span><span>Small things, close at hand.</span></footer>
    </main>
  );
}

export default App;
