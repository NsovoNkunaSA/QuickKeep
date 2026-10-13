import { useState } from "react";

function AddItemForm({ onAdd }) {
  const [kind, setKind] = useState("link");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function changeKind(nextKind) {
    setKind(nextKind);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");

    let normalizedUrl = "";
    if (kind === "link") {
      normalizedUrl = url.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`;
      try {
        const parsedUrl = new URL(normalizedUrl);
        if (!parsedUrl.hostname.includes(".")) throw new Error("Invalid URL");
      } catch {
        setError("Enter a valid website address.");
        return;
      }
    }

    if (kind === "file" && !file) {
      setError("Choose a file to keep.");
      return;
    }

    setIsSaving(true);
    try {
      await onAdd({ kind, name, description, url: normalizedUrl, file });
      setName("");
      setDescription("");
      setUrl("");
      setFile(null);
      form.reset();
    } catch {
      setError("This item could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="add-panel" aria-labelledby="add-title">
      <div className="form-heading">
        <h2 id="add-title">Add to your keep</h2>
        <div className="type-switch" role="group" aria-label="Item type">
          <button type="button" aria-pressed={kind === "link"} onClick={() => changeKind("link")}>Link</button>
          <button type="button" aria-pressed={kind === "file"} onClick={() => changeKind("file")}>File</button>
        </div>
      </div>

      <form className="item-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="item-name">Name</label>
          <input
            id="item-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={kind === "link" ? "e.g. Design inspiration" : "e.g. Project brief"}
            required
          />
        </div>

        {kind === "link" ? (
          <div className="field">
            <label htmlFor="item-url">Website address</label>
            <input
              id="item-url"
              type="text"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="item-file">Choose a file</label>
            <input
              className="file-picker"
              id="item-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </div>
        )}

        <div className="field description-field">
          <label htmlFor="item-description">Description <span>(optional)</span></label>
          <textarea
            id="item-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a note to help you remember it"
            rows="1"
          />
        </div>

        <div className="form-actions">
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="add-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : `Keep ${kind}`}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddItemForm;