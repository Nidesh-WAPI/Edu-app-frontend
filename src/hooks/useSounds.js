/**
 * useSounds — Web Audio API sound effects (zero dependencies, zero cost)
 *
 * playCorrect → cheerful ascending ding  C5 → E5 → G5
 * playWrong   → soft descending buzz
 * playComplete → short celebratory fanfare
 */

let audioCtx = null;

// Lazily create a shared AudioContext (browsers limit the total number)
const getCtx = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browsers auto-suspend after user inactivity)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const tone = (freq, duration, type = 'sine', vol = 0.25, startDelay = 0) => {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type           = type;
    osc.frequency.value = freq;

    const t0 = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.start(t0);
    osc.stop(t0 + duration);
  } catch { /* ignore */ }
};

// ── Correct answer — happy ascending ding ────────────────────────────────────
export const playCorrect = () => {
  tone(523, 0.12, 'sine', 0.28, 0.00); // C5
  tone(659, 0.12, 'sine', 0.25, 0.13); // E5
  tone(784, 0.22, 'sine', 0.22, 0.25); // G5
};

// ── Wrong answer — soft descending thud ──────────────────────────────────────
export const playWrong = () => {
  tone(280, 0.18, 'triangle', 0.20, 0.00);
  tone(220, 0.28, 'triangle', 0.15, 0.16);
};

// ── Quiz complete — short fanfare ─────────────────────────────────────────────
export const playComplete = () => {
  tone(523, 0.10, 'sine', 0.22, 0.00); // C5
  tone(659, 0.10, 'sine', 0.22, 0.12); // E5
  tone(784, 0.10, 'sine', 0.22, 0.24); // G5
  tone(1047, 0.30, 'sine', 0.20, 0.36); // C6
};
