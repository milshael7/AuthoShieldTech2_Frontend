import React from 'react';

export default function ReadAloud({ text = '' }) {
  const speak = () => {
    if (!text) return;

    if (!('speechSynthesis' in window)) {
      alert('Read aloud is not supported in this browser.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // stop any current speech before starting new
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button onClick={speak} title="Read aloud">
      🔊 Read aloud
    </button>
  );
}
