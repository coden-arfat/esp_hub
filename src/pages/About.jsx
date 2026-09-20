// ============================================================
// pages/About.jsx — About & Device Connection Instructions
// ============================================================
// Provides a short manual for connecting an ESP device and
// using the dashboard.
// ============================================================

export default function About() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">About & Setup Guide</h1>
          <p className="page-subtitle">
            Follow these steps to connect your ESP device and control it from the dashboard.
          </p>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">1. Prepare your ESP device</h2>
        <p className="section-subtitle">
          Make sure your ESP32 / ESP8266 is flashed with the correct firmware and connected to Wi-Fi.
        </p>
        <ul>
          <li>Open the firmware project in the <code>ESP32_Firmware</code> folder.</li>
          <li>Set your Wi-Fi SSID and password in the firmware source.</li>
          <li>Set the same <code>DEVICE_ID</code> in firmware and in this dashboard when registering.</li>
          <li>Upload the firmware to the ESP board.</li>
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">2. Register your device</h2>
        <p className="section-subtitle">
          Add the ESP to the dashboard so it can be monitored and controlled.
        </p>
        <ul>
          <li>Open <strong>Devices</strong> from the sidebar.</li>
          <li>Enter the same device ID used by the ESP firmware.</li>
          <li>Give the device a friendly name and location.</li>
          <li>Click <strong>Add Device</strong> to register it.</li>
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">3. Control components</h2>
        <p className="section-subtitle">
          The detail page lets you interact with relays, PWM outputs, steppers, and more.
        </p>
        <ul>
          <li>Use the <strong>Dashboard</strong> to open a device page.</li>
          <li>Toggle relays on/off from the <strong>Relay Control</strong> panel.</li>
          <li>Use the <strong>Component Controls</strong> section for PWM sliders, stepper positions, and custom outputs.</li>
          <li>Any changes are sent instantly to the ESP via Firebase.
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">4. Verify your email</h2>
        <p className="section-subtitle">
          Email verification is required before you can access the dashboard.
        </p>
        <ul>
          <li>Check your inbox after signing up.</li>
          <li>Click the verification link in the email.</li>
          <li>If needed, use the <strong>Profile</strong> page to resend the verification message.</li>
        </ul>
      </section>
    </div>
  );
}
