/**
 * AuthoDev 6.5 — Unified Read Aloud Engine
 * Single voice, consistent across the platform
 *
 * Rules:
 * - One voice
 * - One cadence
 * - One speaker at a time
 * - No overlap
 */

let synth = null;
let currentUtterance = null;

function getSynth() {
  if (typeof window === "undefined") return null;
  if (!synth) synth = window.speechSynthesis;
  return synth;
}

export function stopReadAloud() {
  const s = getSynth();
  if (!s) return;
  s.cancel();
  currentUtterance = null;
}

export function readAloud(text) {
  if (!text) return;

  const s = getSynth();
  if (!s) return;

  // stop anything currently speaking
  s.cancel();

  const utter = new SpeechSynthesisUtterance(
    String(text)
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim()
  );

  // 🔊 AuthoDev voice tuning
  utter.rate = 0.95;     // calm, human pace
  utter.pitch = 1.0;     // neutral, professional
  utter.volume = 1.0;

  currentUtterance = utter;
  s.speak(utter);
}
