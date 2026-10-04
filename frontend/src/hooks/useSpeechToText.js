"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { intlLocale } from "@/lib/i18n";

export const MIC_BLOCKED_MSG = "Zezwól na dostęp do mikrofonu w przeglądarce, aby dyktować.";

// only one microphone at a time across all text boxes
let activeRecognition = null;

function recognitionClass() {
  return typeof window === "undefined" ? undefined : window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

const subscribe = () => () => {};
const isSupported = () => !!recognitionClass();
const isSupportedOnServer = () => false;

// false on the server and in browsers without speech recognition (Firefox)
export function useSpeechSupported() {
  return useSyncExternalStore(subscribe, isSupported, isSupportedOnServer);
}

// Puts dictated text at the end of an <input> or <textarea> as if typed, so React's onChange runs.
// Returns false when the field is full (maxLength).
export function appendDictation(element, text) {
  const current = element.value;
  const sentenceStart = !current.trim() || /[.!?]\s*$/.test(current);
  const words = sentenceStart ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  let next = current + (current && !/\s$/.test(current) ? " " : "") + words;
  const limit = element.maxLength > 0 ? element.maxLength : Infinity;
  if (next.length > limit) next = next.slice(0, limit);

  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value").set;
  setter.call(element, next);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  return next.length < limit;
}

// status: "idle" | "listening" | "ended" (ended = just stopped, for the screen reader)
export function useSpeechToText({ onText, onError }) {
  const supported = useSpeechSupported();
  const [status, setStatus] = useState("idle");
  const recognitionRef = useRef(null);
  const handlers = useRef({ onText, onError });

  useEffect(() => {
    handlers.current = { onText, onError };
  });

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  const start = useCallback(() => {
    const Recognition = recognitionClass();
    if (!Recognition) return;
    activeRecognition?.stop();

    const recognition = new Recognition();
    recognition.lang = intlLocale();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal && text && handlers.current.onText?.(text) === false) recognition.stop();
      }
    };
    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") handlers.current.onError?.(MIC_BLOCKED_MSG);
    };
    recognition.onend = () => {
      if (activeRecognition === recognition) activeRecognition = null;
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setStatus("ended");
    };

    recognitionRef.current = recognition;
    activeRecognition = recognition;
    recognition.start();
    setStatus("listening");
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const listening = status === "listening";
  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  return { supported, status, listening, start, stop, toggle };
}
