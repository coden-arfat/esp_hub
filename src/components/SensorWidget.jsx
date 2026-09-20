// ============================================================
// components/SensorWidget.jsx — Single Sensor Display
// ============================================================
// Props:
//   label  {string}  — e.g. "Temperature"
//   value  {number|string} — sensor value
//   unit   {string}  — e.g. "°C", "%"
//   icon   {string}  — emoji icon
//   raw    {boolean} — if true, render value as-is (no toFixed)
// ============================================================

import { formatSensor } from "../utils/helpers";

export default function SensorWidget({ label, value, unit, icon, raw }) {
  return (
    <div className="sensor-widget">
      <span className="sensor-icon">{icon}</span>
      <p className="sensor-value">
        {raw ? value : formatSensor(value, unit)}
      </p>
      <p className="sensor-label">{label}</p>
    </div>
  );
}
