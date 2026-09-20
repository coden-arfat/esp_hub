# ESP Dashboard

A production-ready React and Firebase SPA for managing ESP32/ESP8266 devices with live telemetry, relay control, output management, and history visualization.

## Quick Start

```bash
npm install
npm run dev
```

## What this app does
- Authenticates users via Firebase Email/Password.
- Registers and links ESP devices to user accounts.
- Shows device status, sensor telemetry, relay state, and output controls.
- Sends real-time commands to ESP devices through Firebase Realtime Database.
- Displays historical sensor data using Recharts.

## Key folders
- `src/pages/` — route-level screens.
- `src/components/` — reusable UI components.
- `src/firebase/` — Firebase Auth and Realtime Database access.
- `src/hooks/` — subscription and auth hooks.
- `src/utils/` — helper functions and demo data.

## Deployment
Build the static production bundle:

```bash
npm run build
```

## Documentation
For developer, deployment, and maintenance details, see `TECHNICAL_DOCUMENTATION.md`.
