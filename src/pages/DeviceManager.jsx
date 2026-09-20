// ============================================================
// pages/DeviceManager.jsx — Add / Remove Devices
// ============================================================
// Lets the user register new ESP devices by entering a Device ID.
// The Device ID must match what is set in the ESP firmware.
// Removing a device only unlinks it from the user — does NOT
// delete its data from Firebase.
// ============================================================

import { useState }       from "react";
import { useAuth }        from "../hooks/useAuth";
import { useDevices }     from "../hooks/useDevices";
import { registerDevice, seedDemoDevice, unregisterDevice } from "../firebase/database";
import StatusBadge        from "../components/StatusBadge";
import Spinner            from "../components/Spinner";

const DEVICE_TYPES = ["sensor", "relay", "sensor+relay", "security", "custom"];
const BOARDS       = ["ESP32", "ESP8266"];

export default function DeviceManager() {
  const { user }             = useAuth();
  const { devices, loading } = useDevices();
  const [form, setForm]      = useState({
    deviceId: "", name: "", type: "sensor+relay",
    board: "ESP32", location: "",
  });
  const [status,   setStatus]   = useState("");
  const [removing, setRemoving] = useState(null);
  const [seedingDemo, setSeedingDemo] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // ─── Register new device ──────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault();
    setStatus("Registering...");
    try {
      await registerDevice(user.uid, form.deviceId, {
        name:     form.name,
        type:     form.type,
        board:    form.board,
        location: form.location,
      });
      setStatus(`✅ Device "${form.name}" registered!`);
      setForm({ deviceId: "", name: "", type: "sensor+relay", board: "ESP32", location: "" });
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  }

  async function handleSeedDemo() {
    setSeedingDemo(true);
    setStatus("Creating demo device in Firebase...");
    try {
      await seedDemoDevice(user.uid);
      setStatus('Demo device created. Open it from the dashboard to control its five relays.');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setSeedingDemo(false);
    }
  }

  // ─── Remove device from user ──────────────────────────────
  async function handleRemove(deviceId, deviceName) {
    if (!window.confirm(`Remove "${deviceName}" from your dashboard?`)) return;
    setRemoving(deviceId);
    await unregisterDevice(user.uid, deviceId);
    setRemoving(null);
  }

  if (loading) return <Spinner label="Loading devices..." />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Devices</h1>
          <p className="page-subtitle">Register and remove ESP devices</p>
        </div>
      </div>

      {/* ── Add Device Form ── */}
      <section className="section">
        <h2 className="section-title">Register New Device</h2>
        <p className="section-subtitle">
          The Device ID must match the <code>DEVICE_ID</code> constant in your ESP firmware.
        </p>

        <form onSubmit={handleAdd} className="device-form">
          <div className="form-row">
            <div className="field-group">
              <label>Device ID *</label>
              <input
                name="deviceId" value={form.deviceId}
                onChange={handleChange} required
                placeholder="e.g. device_001"
              />
            </div>
            <div className="field-group">
              <label>Display Name *</label>
              <input
                name="name" value={form.name}
                onChange={handleChange} required
                placeholder="e.g. Living Room"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group">
              <label>Board</label>
              <select name="board" value={form.board} onChange={handleChange}>
                {BOARDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                {DEVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>Location</label>
              <input
                name="location" value={form.location}
                onChange={handleChange}
                placeholder="e.g. Floor 1"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">Add Device</button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">Try the Firebase Demo</h2>
        <p className="section-subtitle">
          Creates a real demo device in your Firebase database with temperature, humidity, and five relay controls.
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleSeedDemo}
          disabled={seedingDemo}
        >
          {seedingDemo ? "Creating demo device..." : "Create demo device in Firebase"}
        </button>
      </section>

      {/* ── Existing Devices ── */}
      <section className="section">
        <h2 className="section-title">Your Devices</h2>
        {devices.length === 0 ? (
          <p className="empty-text">No devices registered yet.</p>
        ) : (
          <div className="device-list">
            {devices.map((d) => (
              <div key={d.id} className="device-list-item">
                <div className="device-list-info">
                  <StatusBadge online={d.status?.online} small />
                  <div>
                    <p className="device-list-name">{d.info?.name || d.id}</p>
                    <p className="device-list-meta">
                      {d.id} · {d.info?.board} · {d.info?.type}
                    </p>
                  </div>
                </div>
                <button
                  className="btn-danger"
                  onClick={() => handleRemove(d.id, d.info?.name)}
                  disabled={removing === d.id}
                >
                  {removing === d.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
