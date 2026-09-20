// ============================================================
// components/EmptyState.jsx — Empty / No Data Placeholder
// ============================================================
// Props:
//   icon    {string} — emoji
//   title   {string} — bold heading
//   message {string} — description text
// ============================================================

export default function EmptyState({ icon, title, message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
    </div>
  );
}
