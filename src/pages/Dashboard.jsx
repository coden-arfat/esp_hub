// ============================================================
// pages/Dashboard.jsx — Main Dashboard
// ============================================================
// Shows all ESP devices as cards with live status.
// Uses useDevices() hook for real-time Firebase updates.
// Each device links to its DeviceDetail page.
// ============================================================

import { useDevices } from "../hooks/useDevices";
import DeviceCard     from "../components/DeviceCard";
import Spinner        from "../components/Spinner";
import EmptyState     from "../components/EmptyState";
import { DEMO_DEVICE_ID } from "../utils/demoData";
import { isDeviceOnline } from "../utils/helpers";

export default function Dashboard() {
  const { devices, loading } = useDevices();
  const demoMode = devices.length === 1 && devices[0]?.id === DEMO_DEVICE_ID;

  // ─── Derived stats ────────────────────────────────────────
  const onlineCount  = devices.filter((d) => d.id === DEMO_DEVICE_ID || (d.status?.online && isDeviceOnline(d.status.last_seen))).length;
  const offlineCount = devices.length - onlineCount;

  if (loading) return <Spinner label="Loading devices..." />;

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {devices.length} device{devices.length !== 1 ? "s" : ""} registered
          </p>
        </div>

        {/* Quick Stats */}
        <div className="stat-pills">
          <span className="stat-pill online">{onlineCount} Online</span>
          <span className="stat-pill offline">{offlineCount} Offline</span>
        </div>
      </div>

      {/* Device Grid */}
      {devices.length === 0 ? (
        <EmptyState
          icon="🔌"
          title="No devices yet"
          message='Go to "Manage Devices" to register your first ESP.'
        />
      ) : (
        <>
          {demoMode && (
            <div className="demo-banner">
              <p>
                Demo mode enabled: this sample device shows how the dashboard looks and behaves without a connected ESP.
              </p>
            </div>
          )}
          <div className="device-grid">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
