import { useEffect, useRef, useState } from "react";
import { setRelayState, turnOffDevicePorts } from "../firebase/database";

const NUMBER_WORDS = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
};

const BANGLA_NUMBER_WORDS = {
  "এক": "1",
  "দুই": "2",
  "তিন": "3",
  "চার": "4",
  "পাঁচ": "5",
};

function parseCommand(transcript, language) {
  if (language === "bn-BD") {
    const normalized = transcript.replace(/\s+/g, " ").trim();
    const numberPattern = Object.keys(BANGLA_NUMBER_WORDS).join("|");
    const withDigits = normalized.replace(new RegExp(`(?:${numberPattern})`, "g"), (word) => BANGLA_NUMBER_WORDS[word]);
    const stateMatch = withDigits.match(/(?:^|\s)(চালু|বন্ধ)(?=\s|$)/);
    if (!stateMatch) return null;

    if (/(?:^|\s)(?:সব|সমস্ত)\s*রিলে(?=\s|$)/.test(withDigits)) {
      return { type: "all", state: stateMatch[1] === "চালু" };
    }

    const relayMatch = withDigits.match(/(?:^|\s)(?:রিলে|আর)\s*([1-5])(?=\s|$)/);
    if (!relayMatch) return null;

    return {
      type: "relay",
      relayId: `relay_${relayMatch[1]}`,
      state: stateMatch[1] === "চালু",
    };
  }

  const normalized = transcript
    .toLowerCase()
    .replace(/\b(one|two|three|four|five)\b/g, (word) => NUMBER_WORDS[word])
    .replace(/\s+/g, " ")
    .trim();
  const action = normalized.match(/\b(on|off)\b/)?.[1];

  if (!action) return null;

  if (/\b(?:all|every)\s+relays?\b/.test(normalized)) {
    return { type: "all", state: action === "on" };
  }

  const relayMatch = normalized.match(/\b(?:relay|r)\s*([1-5])\b/);
  if (!relayMatch) return null;

  return {
    type: "relay",
    relayId: `relay_${relayMatch[1]}`,
    state: action === "on",
  };
}

function getConversationReply(transcript, language) {
  if (language === "bn-BD") {
    if (/^(হাই|হ্যালো|নমস্কার)/.test(transcript.trim())) {
      return "হ্যালো। আমি ভলটেক্স। কীভাবে সাহায্য করতে পারি?";
    }
    if (/কে তুমি|তোমার নাম কী/.test(transcript)) {
      return "আমি ভলটেক্স, আপনার রিলে নিয়ন্ত্রণের ভয়েস সহকারী।";
    }
    if (/তুমি কী করতে পারো|সাহায্য/.test(transcript)) {
      return "আমি আলাদা রিলে চালু বা বন্ধ করতে এবং সব রিলে নিয়ন্ত্রণ করতে পারি।";
    }
    return null;
  }

  const normalized = transcript.toLowerCase().trim();

  if (/^(hi|hello|hey)\b/.test(normalized)) {
    return "Hello. I am Voltex. How can I help you?";
  }
  if (/who are you|what is your name/.test(normalized)) {
    return "I am Voltex, your voice assistant for relay control.";
  }
  if (/what can you do|help/.test(normalized)) {
    return "I can turn individual relays on or off, control all relays, and answer simple questions.";
  }
  if (/how are you/.test(normalized)) {
    return "I am online and ready to help.";
  }
  if (/thank you|thanks/.test(normalized)) {
    return "You are welcome.";
  }
  if (/goodbye|bye/.test(normalized)) {
    return "Goodbye. I will be here when you need me.";
  }

  return null;
}

export default function VoiceRelayControl({ deviceId, relays }) {
  const recognitionRef = useRef(null);
  const voicesRef = useRef([]);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [voicesReady, setVoicesReady] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello. I am Voltex. I am ready to help." },
  ]);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const supported = Boolean(SpeechRecognition) && speechSupported;

  useEffect(() => {
    if (!speechSupported) return undefined;

    const updateVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      setVoicesReady(true);
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      recognitionRef.current?.abort();
    };
  }, [speechSupported]);

  function speakText(text) {
    if (!speechSupported) return;
    const utterance = new window.SpeechSynthesisUtterance(text);
    const voices = voicesRef.current;
    const preferredVoice = voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase())
      || (language === "bn-BD" && voices.find((voice) => voice.lang.toLowerCase() === "bn-in"))
      || voices.find((voice) => voice.lang.toLowerCase().startsWith(language.split("-")[0]));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = language;
    utterance.rate = language === "bn-BD" ? 0.82 : 0.9;
    utterance.pitch = language === "bn-BD" ? 1 : 0.8;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function addMessage(role, text, speak = false) {
    setMessages((current) => [...current, { role, text }]);
    if (speak) speakText(text);
  }

  function setAssistantMessage(text, speak = true) {
    setMessages((current) => [...current, { role: "assistant", text }]);
    if (speak) speakText(text);
  }

  function startListening() {
    if (!supported || listening || processing || speaking) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    addMessage("assistant", "Listening...", false);
    setListening(true);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const command = parseCommand(transcript, language);
      addMessage("user", transcript, false);
      setListening(false);

      if (!command) {
        const reply = getConversationReply(transcript, language);
        setAssistantMessage(reply || (language === "bn-BD"
          ? "আমি বুঝতে পারিনি। ‘রিলে ১ চালু’ বলতে পারেন।"
          : "I did not understand that. You can ask who I am or say relay 1 on."));
        return;
      }

      setProcessing(true);
      try {
        if (command.type === "all") {
          if (command.state) {
            await Promise.all(
              Object.keys(relays).map((relayId) => setRelayState(deviceId, relayId, true)),
            );
          } else {
            await turnOffDevicePorts(deviceId, relays);
          }
          setAssistantMessage(language === "bn-BD"
            ? `সব রিলে ${command.state ? "চালু" : "বন্ধ করা হয়েছে"}.`
            : `All relays turned ${command.state ? "on" : "off"}.`);
        } else {
          await setRelayState(deviceId, command.relayId, command.state);
          setAssistantMessage(language === "bn-BD"
            ? `${command.relayId.replace("relay_", "রিলে ")} ${command.state ? "চালু" : "বন্ধ করা হয়েছে"}.`
            : `${command.relayId.replace("_", " ")} turned ${command.state ? "on" : "off"}.`);
        }
      } catch (error) {
        setAssistantMessage(`Voice command failed: ${error.message}`);
      } finally {
        setProcessing(false);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setAssistantMessage(event.error === "not-allowed" ? "Microphone permission is required." : `Voice error: ${event.error}.`);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  return (
    <div className="voice-relay-control">
      <label className="field-group voice-language-field">
        <span>Voice language</span>
        <select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={listening || processing || speaking}>
          <option value="en-US">English</option>
          <option value="bn-BD">বাংলা (বাংলাদেশ)</option>
        </select>
      </label>
      {language === "bn-BD" && voicesReady && !voicesRef.current.some((voice) => voice.lang.toLowerCase().startsWith("bn")) && (
        <span className="voice-relay-message">এই ব্রাউজারে বাংলা কণ্ঠস্বর নেই। Chrome-এর বাংলা voice ইনস্টল করুন।</span>
      )}
      <div className="voice-chat-log" aria-live="polite">
        {messages.map((entry, index) => (
          <p key={`${entry.role}-${index}`} className={`voice-chat-message voice-chat-message--${entry.role}`}>
            <strong>{entry.role === "user" ? "You" : "Voltex"}</strong>
            <span>{entry.text}</span>
          </p>
        ))}
      </div>
      <button
        className={`voice-relay-button ${listening ? "voice-relay-button--listening" : ""}`}
        type="button"
        onClick={startListening}
        disabled={!supported || listening || processing || speaking}
        aria-label="Use voice to control relays"
      >
        {listening ? "Listening..." : speaking ? "Voltex is speaking..." : processing ? "Applying..." : "Talk to Voltex"}
      </button>
      {!supported && <span className="voice-relay-message">Use Chrome or Edge and allow microphone access.</span>}
    </div>
  );
}
