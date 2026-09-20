// ============================================================
// components/StatusBadge.jsx — Online / Offline Indicator
// ============================================================
// Props:
//   online {boolean} — true = green, false = grey/red
//   small  {boolean} — smaller dot-only variant
// ============================================================

export default function StatusBadge({ online, small }) {
  return (
    <span className={`status-badge ${online ? "status-badge--online" : "status-badge--offline"} ${small ? "status-badge--small" : ""}`}>
      <span className="status-dot" />
      {!small && (online ? "Online" : "Offline")}
    </span>
  );
}
