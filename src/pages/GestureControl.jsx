import { useEffect, useRef, useState } from "react";
import { setGestureCount } from "../firebase/database";
import { useDevices } from "../hooks/useDevices";

const MEDIAPIPE_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js",
];

const FACE_MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

function loadScript(source) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${source}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", resolve, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = source;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Could not load ${source}`));
    document.head.appendChild(script);
  });
}

export default function GestureControl() {
  const { devices, loading: devicesLoading } = useDevices();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const lastCountRef = useRef(-1);
  const candidateCountRef = useRef(-1);
  const candidateFramesRef = useRef(0);
  const targetDeviceRef = useRef("");
  const lastFaceDetectionRef = useRef(0);
  const [count, setCount] = useState(0);
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState("Loading hand tracking...");
  const [faceBoxes, setFaceBoxes] = useState([]);

  useEffect(() => {
    if (!devices.length) return;
    const selectedDeviceExists = devices.some((device) => device.id === deviceId);
    if (!selectedDeviceExists) {
      setDeviceId(devices[0].id);
    }
  }, [devices, deviceId]);

  useEffect(() => {
    targetDeviceRef.current = deviceId;
  }, [deviceId]);

  useEffect(() => {
    let cancelled = false;

    async function startTracking() {
      try {
        await Promise.all(MEDIAPIPE_SCRIPTS.map(loadScript));
        if (cancelled) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        const faceApi = window.faceapi;
        await faceApi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL);

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results) => {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          let detectedCount = 0;
          const landmarks = results.multiHandLandmarks?.[0];
          if (landmarks) {
            window.drawConnectors(context, landmarks, window.HAND_CONNECTIONS, {
              color: "#7ee787",
              lineWidth: 3,
            });
            window.drawLandmarks(context, landmarks, {
              color: "#f0f6fc",
              lineWidth: 2,
              radius: 4,
            });

            const handedness = results.multiHandedness?.[0]?.label;
            // MediaPipe receives the unmirrored video frame. Its handedness
            // label is therefore opposite to the mirrored canvas view.
            const thumbIsUp = handedness === "Right"
              ? landmarks[4].x < landmarks[3].x
              : landmarks[4].x > landmarks[3].x;
            if (thumbIsUp) detectedCount += 1;

            // Compare each fingertip with its PIP joint, not the MCP joint.
            const fingertipIds = [8, 12, 16, 20];
            const pipIds = [6, 10, 14, 18];
            for (let finger = 1; finger < 5; finger += 1) {
              if (landmarks[fingertipIds[finger - 1]].y < landmarks[pipIds[finger - 1]].y) {
                detectedCount += 1;
              }
            }
          }

          if (detectedCount === candidateCountRef.current) {
            candidateFramesRef.current += 1;
          } else {
            candidateCountRef.current = detectedCount;
            candidateFramesRef.current = 1;
          }

          // Require several matching frames to avoid relay changes from camera noise.
          if (candidateFramesRef.current >= 5 && detectedCount !== lastCountRef.current) {
            setCount(detectedCount);
            if (!targetDeviceRef.current) return;
            setGestureCount(targetDeviceRef.current, detectedCount)
              .catch((error) => setStatus(`Firebase error: ${error.message}`));
            lastCountRef.current = detectedCount;
          }
        });

        const camera = new window.Camera(video, {
          onFrame: async () => {
            await hands.send({ image: video });

            // Face detection is throttled because it is the heavier model,
            // while hand tracking continues on every camera frame.
            const now = performance.now();
            if (now - lastFaceDetectionRef.current >= 200) {
              lastFaceDetectionRef.current = now;
              const detections = await faceApi.detectAllFaces(
                video,
                new faceApi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }),
              );
              if (video.videoWidth && video.videoHeight) {
                setFaceBoxes(detections.map(({ box }) => ({
                  xMin: box.x / video.videoWidth,
                  yMin: box.y / video.videoHeight,
                  width: box.width / video.videoWidth,
                  height: box.height / video.videoHeight,
                })));
              } else {
                setFaceBoxes([]);
              }
            }
          },
          width: 480,
          height: 360,
        });
        handsRef.current = hands;
        cameraRef.current = camera;
        camera.start();
        setStatus("Camera active. Show 1 to 5 fingers.");
      } catch (error) {
        setStatus(`Unable to start camera: ${error.message}`);
      }
    }

    startTracking();
    return () => {
      cancelled = true;
      cameraRef.current?.stop();
      handsRef.current?.close?.();
      setFaceBoxes([]);
    };
  }, []);

  return (
    <div className="page gesture-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gesture Control</h1>
          <p className="page-subtitle">Use one hand to select a relay through Firebase.</p>
        </div>
        <div className="gesture-count" aria-live="polite">{count}</div>
      </div>

      <section className="gesture-layout">
        <div className="gesture-camera-panel">
          <video ref={videoRef} autoPlay playsInline muted />
          <canvas ref={canvasRef} />
          {faceBoxes.map((faceBox, index) => {
            const boxSize = Math.max(faceBox.width, faceBox.height) * 1.2;
            return (
              <div
                key={`${faceBox.xMin}-${faceBox.yMin}-${index}`}
                className="gesture-face-ring"
                style={{
                  left: `${(1 - (faceBox.xMin + faceBox.width / 2) - boxSize / 2) * 100}%`,
                  top: `${(faceBox.yMin + faceBox.height / 2 - boxSize / 2) * 100}%`,
                  width: `${boxSize * 100}%`,
                  aspectRatio: "1",
                }}
              />
            );
          })}
          <div className="gesture-detection-readout" aria-live="polite">
            <strong>{faceBoxes.length ? `${faceBoxes.length} human${faceBoxes.length === 1 ? "" : "s"} detected` : "Searching for human..."}</strong>
            <span>{count} finger{count === 1 ? "" : "s"} detected</span>
          </div>
          <div className="gesture-status">{status}</div>
        </div>
        <div className="gesture-help section">
          <h2 className="section-title">Finger mapping</h2>
          <p>1 finger: Relay 1 on</p>
          <p>2 fingers: Relay 2 on</p>
          <p>3 fingers: Relay 3 on</p>
          <p>4 fingers: Relay 4 on</p>
          <p>5 fingers: Turn all relays off</p>
          <label className="field-group gesture-device-field">
            <span>Target device</span>
            <select
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              disabled={devicesLoading || devices.length === 0}
            >
              {devicesLoading && <option value="">Loading devices...</option>}
              {!devicesLoading && devices.length === 0 && (
                <option value="">No devices available</option>
              )}
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.info?.name || device.id} ({device.id})
                </option>
              ))}
            </select>
          </label>
          <p className="section-subtitle">Gesture control updates the same relay data as the manual controls.</p>
        </div>
      </section>
    </div>
  );
}
