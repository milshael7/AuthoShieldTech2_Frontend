import React from 'react';

export default function ShareSnippet({ text = '' }) {
  const share = async () => {
    if (!text) return;

    try {
      // Native share (mobile & modern browsers)
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }

      // Fallback: copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard');
        return;
      }

      alert('Sharing is not supported in this browser.');
    } catch (err) {
      console.error('Share failed', err);
      alert('Unable to share right now.');
    }
  };

  return (
    <button onClick={share} title="Share">
      🔗 Share
    </button>
  );
}
