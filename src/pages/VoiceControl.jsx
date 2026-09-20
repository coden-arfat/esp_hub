import { useEffect, useState } from "react";
import VoiceRelayControl from "../components/VoiceRelayControl";
import { useDevices } from "../hooks/useDevices";

export default function VoiceControl() {
  const { devices, loading } = useDevices();
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    if (!devices.length) return;
    if (!devices.some((device) => device.id === deviceId)) {
      setDeviceId(devices[0].id);
    }
  }, [devices, deviceId]);

  const selectedDevice = devices.find((device) => device.id === deviceId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Voice Control</h1>
          <p className="page-subtitle">Control relay power with spoken commands.</p>
        </div>
      </div>

      <section className="section ai-control-panel">
        <label className="field-group gesture-device-field">
          <span>Target device</span>
          <select
            value={deviceId}
            onChange={(event) => setDeviceId(event.target.value)}
            disabled={loading || devices.length === 0}
          >
            {loading && <option value="">Loading devices...</option>}
            {!loading && devices.length === 0 && <option value="">No devices available</option>}
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.info?.name || device.id} ({device.id})
              </option>
            ))}
          </select>
        </label>

        {selectedDevice ? (
          <VoiceRelayControl deviceId={selectedDevice.id} relays={selectedDevice.relays || {}} />
        ) : (
          <p className="section-subtitle">Select a device to enable voice control.</p>
        )}
      </section>

      <section className="section ai-command-list">
        <h2 className="section-title">Available commands</h2>
        <p>“Relay 1 on” or “Relay 2 off”</p>
        <p>“All relays on” or “All relays off”</p>
      </section>
    </div>
  );
}
