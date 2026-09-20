// ============================================================
// components/RelayToggle.jsx — Relay ON/OFF Control
// ============================================================
// Writes relay state to Firebase → ESP reacts in real time.
//
// Props:
//   deviceId {string} — Firebase device path key
//   relayId  {string} — e.g. "relay_1"
//   relay    {object} — { name, state, updated_by, updated_at }
// ============================================================

import { useState }     from "react";
import { setRelayState } from "../firebase/database";
import { timeAgo }      from "../utils/helpers";

export function RelayToggle({ deviceId, relayId, relay }) {
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await setRelayState(deviceId, relayId, !relay.state);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`relay-card ${relay.state ? "relay-card--on" : "relay-card--off"}`}>
      <div className="relay-info">
        <p className="relay-name">{relay.name || relayId}</p>
        <p className="relay-meta">
          Changed by {relay.updated_by} · {timeAgo(relay.updated_at)}
        </p>
      </div>
      <button
        className={`relay-toggle ${relay.state ? "relay-toggle--on" : "relay-toggle--off"}`}
        onClick={toggle}
        disabled={pending}
        aria-label={`Toggle ${relay.name}`}
      >
        {pending ? "..." : relay.state ? "ON" : "OFF"}
      </button>
    </div>
  );
}
