// ============================================================
// components/DeviceCard.jsx — Device Summary Card
// ============================================================
// Displayed on the Dashboard for each registered ESP device.
// Shows: name, status, key sensor values, relay count.
// Clicking the card navigates to DeviceDetail.
//
// Props:
//   device {object} — full device object from Firebase
// ============================================================

import { useNavigate }   from "react-router-dom";
import StatusBadge       from "./StatusBadge";
import { formatSensor, timeAgo, countActiveRelays, isDeviceOnline } from "../utils/helpers";
import { DEMO_DEVICE_ID } from "../utils/demoData";

export default function DeviceCard({ device }) {
  const navigate = useNavigate();
  const { id, info = {}, status = {}, sensors = {}, relays = {} } = device;
  const online = id === DEMO_DEVICE_ID || (status.online && isDeviceOnline(status.last_seen));

  return (
    <div
      className={`device-card ${online ? "device-card--online" : "device-card--offline"}`}
      onClick={() => navigate(`/device/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/device/${id}`)}
    >
      {/* Card Header */}
      <div className="card-header">
        <div>
          <h3 className="card-title">{info.name || id}</h3>
          <p className="card-meta">{info.board} · {info.location}</p>
        </div>
        <StatusBadge online={online} />
      </div>

      {/* Sensor Preview */}
      <div className="card-sensors">
        {sensors.temperature !== undefined && (
          <div className="card-sensor">
            <span>🌡️</span>
            <span>{formatSensor(sensors.temperature, "°C")}</span>
          </div>
        )}
        {sensors.humidity !== undefined && (
          <div className="card-sensor">
            <span>💧</span>
            <span>{formatSensor(sensors.humidity, "%")}</span>
          </div>
        )}
        {sensors.motion !== undefined && (
          <div className="card-sensor">
            <span>🚶</span>
            <span>{sensors.motion ? "Motion" : "Clear"}</span>
          </div>
        )}
        {sensors.door !== undefined && (
          <div className="card-sensor">
            <span>🚪</span>
            <span>{sensors.door === "open" ? "Open" : "Closed"}</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="card-footer">
        <span className="card-last-seen">
          {online ? "🟢 Online" : `Last seen ${timeAgo(status.last_seen)}`}
        </span>
        {Object.keys(relays).length > 0 && (
          <span className="card-relay-count">
            ⚡ {countActiveRelays(relays)}/{Object.keys(relays).length} relays on
          </span>
        )}
      </div>
    </div>
  );
}
