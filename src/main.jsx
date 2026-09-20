import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { testFirebaseConnection, printTestResults } from "./utils/testFirebase";

// Test Firebase connection on startup
testFirebaseConnection().then(printTestResults);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
