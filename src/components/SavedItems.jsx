import SavedItem from "./SavedItem.jsx";

function SavedItems({ items, isLoading, hasItems, onDelete }) {
  if (isLoading) {
    return <div className="empty-state" role="status"><p>Loading your keep...</p></div>;
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>{hasItems ? "Nothing matches that search." : "Your keep starts here."}</h3>
        <p>{hasItems ? "Try another name or description." : "Add a link or file above to see it here."}</p>
      </div>
    );
  }

  return (
    <div className="saved-list">
      {items.map((item) => <SavedItem key={item.id} item={item} onDelete={onDelete} />)}
    </div>
  );
}

export default SavedItems;