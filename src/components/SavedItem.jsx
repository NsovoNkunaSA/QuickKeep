import { useState } from "react";

function SavedItem({ item, onDelete, onDownload }) {
  const [copied, setCopied] = useState(false);
  const isFile = item.kind === "file";
  const savedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="saved-item">
      <div className={`item-kind${isFile ? " file" : ""}`} aria-hidden="true">
        <span>{isFile ? "FILE" : "LINK"}</span>
        {isFile && <small>{item.fileName?.split(".").pop()?.slice(0, 5) || "DOC"}</small>}
      </div>
      <div className="item-copy">
        <h3>{item.name}</h3>
        {item.description && <p className="item-description">{item.description}</p>}
        {isFile ? (
          <p className="item-filename">{item.fileName}</p>
        ) : (
          <a className="item-url" href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
        )}
      </div>
      <div className="item-actions">
        <time className="item-date" dateTime={item.createdAt}>{savedDate}</time>
        {isFile ? (
          <button className="item-action" type="button" onClick={() => onDownload(item)}>Download</button>
        ) : (
          <button className="item-action" type="button" onClick={copyUrl}>{copied ? "Copied" : "Copy"}</button>
        )}
        <button className="item-action delete-action" type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>Delete</button>
      </div>
    </article>
  );
}

export default SavedItem;