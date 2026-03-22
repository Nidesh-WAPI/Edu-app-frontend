/**
 * useSpeech — Web Speech API Text-to-Speech hook
 * Strips markdown before speaking so formatting symbols aren't read aloud.
 * Works on all modern browsers (Chrome, Safari, Firefox, Edge).
 */
import { useState, useEffect } from 'react';

const stripMarkdown = (text) =>
  text
    .replace(/#{1,6}\s+/g, '')           // headings
    .replace(/\*\*(.+?)\*\*/gs, '$1')    // bold
    .replace(/\*(.+?)\*/gs, '$1')        // italic
    .replace(/`{3}[\s\S]*?`{3}/g, '')    // code blocks
    .replace(/`(.+?)`/g, '$1')           // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/!\[.*?\]\(.*?\)/g, '')     // images
    .replace(/^[-*+]\s+/gm, '')          // unordered list markers
    .replace(/^\d+\.\s+/gm, '')          // ordered list markers
    .replace(/^>\s+/gm, '')              // blockquotes
    .replace(/\n{2,}/g, '. ')            // paragraph breaks → pause
    .replace(/\n/g, ' ')                 // single line breaks
    .replace(/\s{2,}/g, ' ')
    .trim();

export default function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  const speak = (text) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const clean = stripMarkdown(text);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.rate  = 0.88;   // slightly slower — easier to follow
    u.pitch = 1.05;   // slightly warmer tone
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // Cancel any ongoing speech when component unmounts
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, []);

  return { speak, stop, speaking, supported };
}
