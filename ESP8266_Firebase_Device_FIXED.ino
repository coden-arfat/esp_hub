/*devices/{deviceId}/relays/relay_1/state
devices/{deviceId}/relays/relay_2/state
devices/{deviceId}/relays/relay_3/state
devices/{deviceId}/relays/relay_4/state
devices/{deviceId}/relays/relay_5/state
{
  "devices": {
    "device_001": {
      "relays": {
        "relay_1": {
          "state": true,
          "name": "Relay 1",
          "updated_by": "esp8266"
        },
        "relay_2": {
          "state": false,
          "name": "Relay 2",
          "updated_by": "esp8266"
        },
        "relay_3": {
          "state": true,
          "name": "Relay 3",
          "updated_by": "esp8266"
        },
        "relay_4": {
          "state": false,
          "name": "Relay 4",
          "updated_by": "esp8266"
        },
        "relay_5": {
          "state": false,
          "name": "Relay 5",
          "updated_by": "esp8266"
        }
      },
      "status": {
        "online": true,
        "ip_address": "192.168.1.25",
        "wifi_strength": - sixty,
        "firmware_version": "1.0.0",
        "last_seen": 125430
      }
    }
  }
}
"wifi_strength": -60
/devices/device_001/relays/relay_1/state
*/


#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <time.h>
#define API_KEY "AIzaSyClR6JtT1s8O8rPpUH1H3sS3m2A4SvwuFs"
#define DATABASE_URL "https://test-8bc81-default-rtdb.asia-southeast1.firebasedatabase.app"
#define WIFI_SSID "DARK_WEB"
#define WIFI_PASSWORD "000020057"
#define EMAIL "home@gmail.com"
#define PASSWORD "123456789"
#define DEVICE_ID "device_001"
#define FIRMWARE_VERSION "1.0.0"

const uint8_t RELAY_COUNT = 5;
const uint8_t RELAY_PINS[RELAY_COUNT] = {D1, D2, D3, D5, D6};
bool relayStates[RELAY_COUNT] = {false, false, false, false, false};
const unsigned long FIREBASE_CHECK_INTERVAL = 500;
const unsigned long STATUS_UPDATE_INTERVAL = 30000;

unsigned long lastFirebaseCheck = 0;
unsigned long lastStatusUpdate = 0;
FirebaseData fbdo;
FirebaseConfig config;
FirebaseAuth auth;

String relayPath(uint8_t index) {
  return "/devices/" + String(DEVICE_ID) + "/relays/relay_" + String(index + 1);
}

void setRelay(uint8_t index, bool on) {
  if (index >= RELAY_COUNT || relayStates[index] == on) return;

  relayStates[index] = on;
  digitalWrite(RELAY_PINS[index], on ? LOW : HIGH);
  Serial.printf("Relay %u: %s\n", index + 1, on ? "ON" : "OFF");
}

void publishRelayState(uint8_t index) {
  FirebaseJson relay;
  relay.set("state", relayStates[index]);
  relay.set("name", "Relay " + String(index + 1));
  relay.set("updated_by", "esp8266");

  if (!Firebase.RTDB.setJSON(&fbdo, relayPath(index).c_str(), &relay)) {
    Serial.println("Relay state upload failed: " + fbdo.errorReason());
  }
}

void checkRelayCommands() {
  const String path = "/devices/" + String(DEVICE_ID) + "/relays";
  if (!Firebase.RTDB.getJSON(&fbdo, path.c_str())) {
    Serial.println("Relay read failed: " + fbdo.errorReason());
    return;
  }

  FirebaseJson *relays = fbdo.to<FirebaseJson *>();
  for (uint8_t index = 0; index < RELAY_COUNT; index++) {
    FirebaseJsonData state;
    const String key = "relay_" + String(index + 1) + "/state";
    if (relays->get(state, key.c_str())) {
      setRelay(index, state.boolValue);
    }
  }
}

void syncRelayStates() {
  const String path = "/devices/" + String(DEVICE_ID) + "/relays";
  if (!Firebase.RTDB.getJSON(&fbdo, path.c_str())) {
    Serial.println("Initial relay sync failed: " + fbdo.errorReason());
    return;
  }

  FirebaseJson *relays = fbdo.to<FirebaseJson *>();
  for (uint8_t index = 0; index < RELAY_COUNT; index++) {
    FirebaseJsonData state;
    const String key = "relay_" + String(index + 1) + "/state";
    if (relays->get(state, key.c_str())) {
      setRelay(index, state.boolValue);
    } else {
      publishRelayState(index);
    }
  }
}

void updateDeviceStatus() {
  FirebaseJson status;
  status.set("online", true);
  status.set("ip_address", WiFi.localIP().toString());
  status.set("wifi_strength", WiFi.RSSI());
  status.set("firmware_version", FIRMWARE_VERSION);
  status.set("last_seen", (long long)time(nullptr) * 1000);

  const String path = "/devices/" + String(DEVICE_ID) + "/status";
  if (!Firebase.RTDB.setJSON(&fbdo, path.c_str(), &status)) {
    Serial.println("Status upload failed: " + fbdo.errorReason());
  }
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("Wi-Fi connected: " + WiFi.localIP().toString());
}

void setup() {
  Serial.begin(9600);
  for (uint8_t index = 0; index < RELAY_COUNT; index++) {
    pinMode(RELAY_PINS[index], OUTPUT);
    digitalWrite(RELAY_PINS[index], HIGH);
  }

  connectToWiFi();
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  auth.user.email = EMAIL;
  auth.user.password = PASSWORD;
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);
}

void loop() {
  if (!Firebase.ready()) {
    delay(5000);
    return;
  }

  const unsigned long now = millis();
  if (lastFirebaseCheck == 0) {
    syncRelayStates();
    updateDeviceStatus();
    lastFirebaseCheck = now;
    lastStatusUpdate = now;
  }

  if (now - lastFirebaseCheck >= FIREBASE_CHECK_INTERVAL) {
    lastFirebaseCheck = now;
    checkRelayCommands();
  }

  if (now - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
    lastStatusUpdate = now;
    updateDeviceStatus();
  }
  delay(10);
}