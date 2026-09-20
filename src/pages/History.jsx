// ============================================================
// pages/History.jsx — Historical Data & Charts
// ============================================================
// Displays time-series charts for sensor history.
// User selects: device + date → charts render from Firebase.
// Charts powered by Recharts (LineChart).
//
// To add a new sensor to charts:
//   1. Add a <Line> inside the <LineChart> block below
//   2. Make sure the ESP logs that key to /history
// ============================================================

import { useState, useEffect } from "react";
import { useSearchParams }     from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useDevices }            from "../hooks/useDevices";
import { getDeviceHistory }      from "../firebase/database";
import { formatHistoryForChart, todayString } from "../utils/helpers";
import Spinner                   from "../components/Spinner";
import EmptyState                from "../components/EmptyState";

export default function History() {
  const [searchParams]       = useSearchParams();
  const { devices }          = useDevices();
  const [selectedDevice, setSelectedDevice] = useState(searchParams.get("device") || "");
  const [selectedDate,   setSelectedDate]   = useState(todayString());
  const [chartData,      setChartData]      = useState([]);
  const [loading,        setLoading]        = useState(false);

  // ─── Load history whenever device or date changes ─────────
  useEffect(() => {
    if (!selectedDevice || !selectedDate) return;
    setLoading(true);
    getDeviceHistory(selectedDevice, selectedDate).then((logs) => {
      setChartData(formatHistoryForChart(logs));
      setLoading(false);
    });
  }, [selectedDevice, selectedDate]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">Sensor readings over time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="field-group">
          <label>Device</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            <option value="">Select a device...</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.info?.name || d.id}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Date</label>
          <input
            type="date"
            value={selectedDate}
            max={todayString()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Chart Area */}
      {!selectedDevice ? (
        <EmptyState icon="📈" title="Select a device" message="Choose a device and date to view its history." />
      ) : loading ? (
        <Spinner label="Loading history..." />
      ) : chartData.length === 0 ? (
        <EmptyState icon="📭" title="No data" message="No history found for this device on the selected date." />
      ) : (
        <div className="charts-container">

          {/* Temperature & Humidity Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Temperature & Humidity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {/* Add more <Line> here for new sensor types */}
                <Line
                  type="monotone" dataKey="temperature"
                  stroke="var(--accent-warm)" strokeWidth={2}
                  dot={false} name="Temperature (°C)"
                />
                <Line
                  type="monotone" dataKey="humidity"
                  stroke="var(--accent-cool)" strokeWidth={2}
                  dot={false} name="Humidity (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Motion Chart */}
          {chartData.some((d) => d.motion !== undefined) && (
            <div className="chart-card">
              <h3 className="chart-title">Motion Events</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => (v === 1 ? "Detected" : "Clear")} />
                  <Line
                    type="stepAfter" dataKey="motion"
                    stroke="var(--accent-warn)" strokeWidth={2}
                    dot={false} name="Motion"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Raw Data Table */}
          <div className="chart-card">
            <h3 className="chart-title">Raw Logs</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Temp (°C)</th>
                    <th>Humidity (%)</th>
                    <th>Motion</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.time}</td>
                      <td>{row.temperature ?? "—"}</td>
                      <td>{row.humidity ?? "—"}</td>
                      <td>{row.motion === 1 ? "Detected" : "Clear"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
