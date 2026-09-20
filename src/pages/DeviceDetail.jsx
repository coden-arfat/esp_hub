// ============================================================
// pages/DeviceDetail.jsx — Individual Device View
// ============================================================
// Full view of a single ESP device:
//   - Live sensor readings
//   - Relay controls
//   - Device info & status
//   - Link to history charts
// ============================================================

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDevice }       from "../hooks/useDevice";
import SensorWidget        from "../components/SensorWidget";
import { RelayToggle }     from "../components/RelayToggle";
import { OutputControl }   from "../components/OutputControl";
import VoiceRelayControl   from "../components/VoiceRelayControl";
import StatusBadge         from "../components/StatusBadge";
import Spinner             from "../components/Spinner";
import { formatTimestamp, timeAgo, isDeviceOnline } from "../utils/helpers";
import { turnOffDevicePorts } from "../firebase/database";
import { DEMO_DEVICE_ID } from "../utils/demoData";

export default function DeviceDetail() {
  const { deviceId } = useParams();
  const { device, loading } = useDevice(deviceId);
  const [bulkTurningOff, setBulkTurningOff] = useState(false);

  if (loading) return <Spinner label="Loading device..." />;
  if (!device) return <p className="not-found">Device not found.</p>;

  const { info = {}, status = {}, sensors = {}, relays = {}, outputs = {} } = device;
  const online = deviceId === DEMO_DEVICE_ID || (status.online && isDeviceOnline(status.last_seen));
  const hasRelays   = Object.keys(relays).length > 0;
  const hasSensors  = Object.keys(sensors).length > 1; // more than just updated_at
  const hasOutputs  = Object.keys(outputs).length > 0;

  async function handleTurnOffAllPorts() {
    if (!hasRelays && !hasOutputs) return;
    setBulkTurningOff(true);
    try {
      await turnOffDevicePorts(deviceId, relays, outputs);
    } finally {
      setBulkTurningOff(false);
    }
  }

  return (
    <div className="page">
      {/* Breadcrumb */}
      <Link to="/" className="breadcrumb">← Back to Dashboard</Link>

      {/* Device Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{info.name || deviceId}</h1>
          <p className="page-subtitle">
            {info.board} · {info.location} · {info.type}
          </p>
        </div>
        <StatusBadge online={online} />
      </div>

      {/* Status Bar */}
      <div className="info-bar">
        <div className="info-item">
          <span className="info-label">Last Seen</span>
          <span className="info-value">{timeAgo(status.last_seen)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">IP Address</span>
          <span className="info-value">{status.ip_address || "—"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Wi-Fi</span>
          <span className="info-value">{status.wifi_strength ? `${status.wifi_strength} dBm` : "—"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Firmware</span>
          <span className="info-value">v{status.firmware_version || "—"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Registered</span>
          <span className="info-value">{formatTimestamp(info.registered_at)}</span>
        </div>
      </div>

      {/* Sensor Readings */}
      {hasSensors && (
        <section className="section">
          <h2 className="section-title">Live Sensors</h2>
          <p className="section-subtitle">
            Updated {timeAgo(sensors.updated_at)}
          </p>
          <div className="sensor-grid">
            {sensors.temperature !== undefined && (
              <SensorWidget label="Temperature" value={sensors.temperature} unit="°C" icon="🌡️" />
            )}
            {sensors.humidity !== undefined && (
              <SensorWidget label="Humidity" value={sensors.humidity} unit="%" icon="💧" />
            )}
            {sensors.motion !== undefined && (
              <SensorWidget
                label="Motion"
                value={sensors.motion ? "Detected" : "Clear"}
                unit=""
                icon="🚶"
                raw
              />
            )}
            {sensors.door !== undefined && (
              <SensorWidget
                label="Door"
                value={sensors.door === "open" ? "Open" : "Closed"}
                unit=""
                icon="🚪"
                raw
              />
            )}
          </div>
        </section>
      )}

      {/* Relay Controls */}
      {(hasRelays || hasOutputs) && (
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Relay Control</h2>
              <p className="section-subtitle">
                Changes are pushed to the ESP instantly via Firebase
              </p>
            </div>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleTurnOffAllPorts}
              disabled={bulkTurningOff}
            >
              {bulkTurningOff ? "Turning off ports..." : "Turn off all ports"}
            </button>
          </div>

          {hasRelays && <VoiceRelayControl deviceId={deviceId} relays={relays} />}

          {hasRelays && (
            <div className="relay-grid">
              {Object.entries(relays).map(([relayId, relay]) => (
                <RelayToggle
                  key={relayId}
                  deviceId={deviceId}
                  relayId={relayId}
                  relay={relay}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {hasOutputs && (
        <section className="section">
          <h2 className="section-title">Component Controls</h2>
          <p className="section-subtitle">
            Control additional outputs such as PWM, stepper motors, and custom ESP components.
          </p>
          <div className="relay-grid">
            {Object.entries(outputs).map(([outputId, output]) => (
              <OutputControl
                key={outputId}
                deviceId={deviceId}
                outputId={outputId}
                output={output}
              />
            ))}
          </div>
        </section>
      )}

      {/* History Link */}
      <div className="section">
        <Link to={`/history?device=${deviceId}`} className="btn-secondary">
          📈 View Historical Data
        </Link>
      </div>
    </div>
  );
}
