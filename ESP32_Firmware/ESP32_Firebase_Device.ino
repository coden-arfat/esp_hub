// ============================================================
// ESP32_Firebase_Device.ino — ESP32 Firmware
// ============================================================
// SETUP INSTRUCTIONS:
//   1. Install Arduino IDE + ESP32 board support
//   2. Install libraries (Arduino Library Manager):
//        - FirebaseClient by Mobizt
//        - ArduinoJson by Benoit Blanchon
//   3. Fill in your credentials in the CONFIG section below
//   4. Set DEVICE_ID to match what you registered on the website
//   5. Upload to your ESP32
//
// WHAT THIS FIRMWARE DOES:
//   - Connects to Wi-Fi
//   - Authenticates with Firebase
//   - Pushes sensor readings every SENSOR_INTERVAL_MS
//   - Pushes heartbeat every HEARTBEAT_INTERVAL_MS
//   - Listens for relay commands from Firebase in real time
//   - Logs history to /history/{DEVICE_ID}/{date}/{timestamp}
//
// FIREBASE DATABASE PATHS USED:
//   /devices/{DEVICE_ID}/sensors      ← ESP writes
//   /devices/{DEVICE_ID}/status       ← ESP writes
//   /devices/{DEVICE_ID}/relays       ← ESP reads (website writes)
//   /history/{DEVICE_ID}/{date}/      ← ESP writes (logs)
// ============================================================

#include <WiFi.h>
#include <FirebaseClient.h>
#include <DHT.h>        // Remove if not using DHT sensor
#include <time.h>

// ============================================================
// CONFIG — Fill these in before uploading
// ============================================================
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

#define FIREBASE_API_KEY    "YOUR_FIREBASE_API_KEY"
#define FIREBASE_DB_URL     "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define FIREBASE_USER_EMAIL "YOUR_FIREBASE_EMAIL"
#define FIREBASE_USER_PASS  "YOUR_FIREBASE_PASSWORD"

// Must match the Device ID registered on the website
#define DEVICE_ID        "device_001"
#define FIRMWARE_VERSION "1.0.2"

// Timing (milliseconds)
#define SENSOR_INTERVAL_MS    30000   // Send sensor data every 30s
#define HEARTBEAT_INTERVAL_MS 10000   // Heartbeat every 10s

// ─── Pin Definitions ────────────────────────────────────────
#define DHT_PIN    4    // GPIO for DHT22 sensor
#define DHT_TYPE   DHT22
#define PIR_PIN    5    // GPIO for PIR motion sensor
#define DOOR_PIN   6    // GPIO for door reed switch

#define RELAY1_PIN 16   // GPIO for Relay 1
#define RELAY2_PIN 17   // GPIO for Relay 2
#define RELAY3_PIN 18   // GPIO for Relay 3
#define RELAY4_PIN 19   // GPIO for Relay 4

// ============================================================
// GLOBALS
// ============================================================
DHT dht(DHT_PIN, DHT_TYPE);
FirebaseApp firebaseApp;
RealtimeDatabase db;

unsigned long lastSensorTime    = 0;
unsigned long lastHeartbeatTime = 0;

// ─── Relay state cache (avoids redundant writes to GPIO) ────
bool relayStates[4] = { false, false, false, false };
int  relayPins[4]   = { RELAY1_PIN, RELAY2_PIN, RELAY3_PIN, RELAY4_PIN };

// ============================================================
// HELPERS
// ============================================================

// Returns "YYYY-MM-DD" string for history path
String getDateString() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unknown-date";
  char buf[12];
  strftime(buf, sizeof(buf), "%Y-%m-%d", &timeinfo);
  return String(buf);
}

// Returns Unix timestamp (ms)
unsigned long long getTimestampMs() {
  return (unsigned long long)time(nullptr) * 1000ULL;
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n[ESP] Booting...");

  // ─── GPIO Setup ─────────────────────────────────────────
  pinMode(PIR_PIN,  INPUT);
  pinMode(DOOR_PIN, INPUT_PULLUP);
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Active-low: HIGH = OFF
  }

  // ─── DHT Sensor ─────────────────────────────────────────
  dht.begin();

  // ─── Wi-Fi ──────────────────────────────────────────────
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[ESP] Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[ESP] Wi-Fi connected: " + WiFi.localIP().toString());

  // ─── NTP Time (for timestamps & date strings) ───────────
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  Serial.println("[ESP] Waiting for NTP time...");
  delay(2000);

  // ─── Firebase Auth ──────────────────────────────────────
  UserAuth userAuth(FIREBASE_API_KEY, FIREBASE_USER_EMAIL, FIREBASE_USER_PASS);
  initializeApp(getDefaultNetwork(), firebaseApp, getAuth(userAuth));
  firebaseApp.getApp<RealtimeDatabase>(db);
  db.url(FIREBASE_DB_URL);
  Serial.println("[ESP] Firebase initialized.");

  // ─── Register device info & set online ──────────────────
  pushDeviceInfo();
  setOnlineStatus(true);

  // ─── Listen for relay commands (real-time) ──────────────
  // This streams any changes under /devices/{id}/relays
  String relayPath = "/devices/" + String(DEVICE_ID) + "/relays";
  db.get(firebaseApp.getApp<RealtimeDatabase>(), relayPath.c_str(),
    [](AsyncResult& result) {
      if (result.isValue()) {
        parseRelayCommands(result.to<object_t>());
      }
    }, true); // true = stream mode
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  firebaseApp.loop(); // MUST be called every loop for Firebase to work

  unsigned long now = millis();

  // ─── Sensor push ────────────────────────────────────────
  if (now - lastSensorTime >= SENSOR_INTERVAL_MS) {
    lastSensorTime = now;
    pushSensorData();
    pushHistoryLog();
  }

  // ─── Heartbeat ──────────────────────────────────────────
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = now;
    pushHeartbeat();
  }
}

// ============================================================
// FIREBASE WRITE FUNCTIONS
// ============================================================

// Write device info (runs once on boot)
void pushDeviceInfo() {
  String base = "/devices/" + String(DEVICE_ID) + "/info/";
  db.set<String>(firebaseApp.getApp<RealtimeDatabase>(), (base + "board").c_str(),    "ESP32");
  db.set<String>(firebaseApp.getApp<RealtimeDatabase>(), (base + "firmware_version").c_str(), FIRMWARE_VERSION);
}

// Update online status and last_seen
void setOnlineStatus(bool online) {
  String base = "/devices/" + String(DEVICE_ID) + "/status/";
  db.set<bool>  (firebaseApp.getApp<RealtimeDatabase>(), (base + "online").c_str(),     online);
  db.set<String>(firebaseApp.getApp<RealtimeDatabase>(), (base + "ip_address").c_str(), WiFi.localIP().toString());
  db.set<int>   (firebaseApp.getApp<RealtimeDatabase>(), (base + "wifi_strength").c_str(), WiFi.RSSI());
  // Note: last_seen uses server timestamp — set via client timestamp workaround
  db.set<unsigned long long>(firebaseApp.getApp<RealtimeDatabase>(),
    (base + "last_seen").c_str(), getTimestampMs());
}

// Push current sensor readings
void pushSensorData() {
  float temp     = dht.readTemperature();
  float humidity = dht.readHumidity();
  bool  motion   = digitalRead(PIR_PIN) == HIGH;
  bool  doorOpen = digitalRead(DOOR_PIN) == LOW; // Reed switch: LOW = open

  String base = "/devices/" + String(DEVICE_ID) + "/sensors/";

  if (!isnan(temp)) {
    db.set<float>(firebaseApp.getApp<RealtimeDatabase>(), (base + "temperature").c_str(), temp);
    Serial.println("[ESP] Temp: " + String(temp) + "°C");
  }
  if (!isnan(humidity)) {
    db.set<float>(firebaseApp.getApp<RealtimeDatabase>(), (base + "humidity").c_str(), humidity);
  }
  db.set<bool>  (firebaseApp.getApp<RealtimeDatabase>(), (base + "motion").c_str(), motion);
  db.set<String>(firebaseApp.getApp<RealtimeDatabase>(), (base + "door").c_str(),   doorOpen ? "open" : "closed");
  db.set<unsigned long long>(firebaseApp.getApp<RealtimeDatabase>(),
    (base + "updated_at").c_str(), getTimestampMs());
}

// Append one log entry to /history
void pushHistoryLog() {
  float temp     = dht.readTemperature();
  float humidity = dht.readHumidity();
  bool  motion   = digitalRead(PIR_PIN) == HIGH;

  String date = getDateString();
  String logKey = "log_" + String(getTimestampMs());
  String base = "/history/" + String(DEVICE_ID) + "/" + date + "/" + logKey + "/";

  if (!isnan(temp))     db.set<float>(firebaseApp.getApp<RealtimeDatabase>(), (base + "temperature").c_str(), temp);
  if (!isnan(humidity)) db.set<float>(firebaseApp.getApp<RealtimeDatabase>(), (base + "humidity").c_str(), humidity);
  db.set<bool>(firebaseApp.getApp<RealtimeDatabase>(), (base + "motion").c_str(), motion);
  db.set<unsigned long long>(firebaseApp.getApp<RealtimeDatabase>(),
    (base + "timestamp").c_str(), getTimestampMs());
}

// Update heartbeat + last_seen
void pushHeartbeat() {
  setOnlineStatus(true);
  Serial.println("[ESP] Heartbeat sent.");
}

// ============================================================
// RELAY COMMAND HANDLER
// ============================================================
// Called by Firebase stream when relay data changes
void parseRelayCommands(object_t relayData) {
  // Relay mapping: relay_1 → index 0, etc.
  String relayKeys[] = { "relay_1", "relay_2", "relay_3", "relay_4" };

  for (int i = 0; i < 4; i++) {
    // Parse relay state from Firebase JSON object
    // FirebaseClient returns nested object — check docs for exact API
    bool newState = relayData[relayKeys[i].c_str()]["state"];
    if (newState != relayStates[i]) {
      relayStates[i] = newState;
      // Active-low relay: LOW = ON, HIGH = OFF
      digitalWrite(relayPins[i], newState ? LOW : HIGH);
      Serial.println("[ESP] " + relayKeys[i] + " → " + (newState ? "ON" : "OFF"));
    }
  }
}
