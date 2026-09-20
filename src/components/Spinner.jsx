// ============================================================
// components/Spinner.jsx — Loading Indicator
// ============================================================
// Props:
//   label {string} — optional loading message
// ============================================================

export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p className="spinner-label">{label}</p>
    </div>
  );
}
