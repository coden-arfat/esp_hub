// ============================================================
// components/OutputControl.jsx — Generic Output Control
// ============================================================
// Supports PWM sliders, stepper positions, and simple switches.
// Updates are written to /devices/{deviceId}/outputs/{outputId}.
// ============================================================

import { useState, useEffect } from "react";
import { setDeviceOutput } from "../firebase/database";
import { timeAgo } from "../utils/helpers";

export function OutputControl({ deviceId, outputId, output }) {
  const { name, type = "switch", state, value, position, min = 0, max = 255, step = 1, unit = "" } = output;
  const [pending, setPending] = useState(false);
  const [currentValue, setCurrentValue] = useState(
    value !== undefined ? value : position !== undefined ? position : state !== undefined ? state : ""
  );

  useEffect(() => {
    if (value !== undefined) setCurrentValue(value);
    else if (position !== undefined) setCurrentValue(position);
    else if (state !== undefined) setCurrentValue(state);
  }, [value, position, state]);

  const numericValue = Number(currentValue);
  const pct = max === min ? 0 : (numericValue - min) / (max - min);
  const gaugeAngle = Math.round(Math.min(Math.max(pct, 0), 1) * 180);
  const displayValue = type === "stepper" ? `${numericValue}°` : `${numericValue}${unit}`;
  const fullRotationTarget = Math.min(max, 360);

  async function saveOutput(newData) {
    setPending(true);
    try {
      await setDeviceOutput(deviceId, outputId, newData);
    } finally {
      setPending(false);
    }
  }

  function handleToggle() {
    saveOutput({ state: !state });
  }

  function handleSliderChange(event) {
    setCurrentValue(Number(event.target.value));
  }

  async function handleSliderSave() {
    await saveOutput({ value: numericValue });
  }

  function handleStepperChange(delta) {
    const next = numericValue + delta;
    const clamped = Math.min(max, Math.max(min, next));
    setCurrentValue(clamped);
  }

  async function handleStepperSave() {
    await saveOutput({ position: numericValue });
  }

  function handleFullRotation() {
    setCurrentValue(fullRotationTarget);
    saveOutput({ position: fullRotationTarget });
  }

  function handleManualInputChange(event) {
    setCurrentValue(Number(event.target.value));
  }

  function renderGauge() {
    return (
      <div className="output-gauge">
        <div className="gauge-shell">
          <div className="gauge-track" />
          <div className="gauge-fill" style={{ transform: `rotate(${gaugeAngle}deg)` }} />
          <div className="gauge-center">
            <span className="gauge-value">{displayValue}</span>
            <span className="gauge-label">{type === "stepper" ? "Rotation" : "Power"}</span>
          </div>
        </div>
        <div className="gauge-range">
          <span>{min}</span>
          <span>{Math.round((min + max) / 2)}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }

  function renderControl() {
    if (type === "switch") {
      return (
        <button
          className={`relay-toggle ${state ? "relay-toggle--on" : "relay-toggle--off"}`}
          onClick={handleToggle}
          disabled={pending}
          aria-label={`Toggle ${name || outputId}`}
        >
          {pending ? "..." : state ? "ON" : "OFF"}
        </button>
      );
    }

    if (type === "pwm" || type === "range") {
      return (
        <div className="output-panel output-panel--pwm">
          {renderGauge()}
          <div className="output-control-grid">
            <div className="output-slider">
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={numericValue}
                onChange={handleSliderChange}
              />
              <div className="slider-meta">
                <span>{displayValue}</span>
                <button className="btn-secondary" type="button" onClick={handleSliderSave} disabled={pending}>
                  {pending ? "Saving..." : "Set"}
                </button>
              </div>
            </div>
            <div className="manual-input-block">
              <label>Manual Value</label>
              <div className="manual-input-row">
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={numericValue}
                  onChange={handleManualInputChange}
                />
                <button className="btn-secondary" type="button" onClick={handleSliderSave} disabled={pending}>
                  {pending ? "Saving..." : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === "stepper") {
      return (
        <div className="output-panel output-panel--stepper">
          {renderGauge()}
          <div className="output-control-grid">
            <div className="stepper-controls">
              <button type="button" onClick={() => handleStepperChange(-step)} disabled={pending}>-</button>
              <span>{displayValue}</span>
              <button type="button" onClick={() => handleStepperChange(step)} disabled={pending}>+</button>
            </div>
            <div className="manual-input-block">
              <label>Manual Angle</label>
              <div className="manual-input-row">
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={numericValue}
                  onChange={handleManualInputChange}
                />
                <button className="btn-secondary" type="button" onClick={handleStepperSave} disabled={pending}>
                  {pending ? "Saving..." : "Set"}
                </button>
              </div>
            </div>
            <button className="btn-primary btn-full-rotation" type="button" onClick={handleFullRotation} disabled={pending}>
              {pending ? "Saving..." : `Full Rotation (${fullRotationTarget}°)`}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="output-value-control">
        <input
          type="text"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
        />
        <button className="btn-secondary" type="button" onClick={() => saveOutput({ value: currentValue })} disabled={pending}>
          {pending ? "Saving..." : "Update"}
        </button>
      </div>
    );
  }

  return (
    <div className="output-card">
      <div className="output-header">
        <div>
          <p className="output-name">{name || outputId}</p>
          <p className="output-type">{type.toUpperCase()} control</p>
        </div>
        <span className="output-last-updated">{timeAgo(output.updated_at)}</span>
      </div>
      {renderControl()}
    </div>
  );
}
