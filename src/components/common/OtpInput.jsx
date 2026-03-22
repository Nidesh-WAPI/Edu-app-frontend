import { useRef, useEffect } from 'react';

const OTP_LENGTH = 6;

export default function OtpInput({ value, onChange }) {
  const inputs = useRef([]);

  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === idx ? val : d));
    onChange(next.join(''));
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = digits.map((d, i) => (i === idx ? '' : d));
        onChange(next.join(''));
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(paste.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH).replace(/ /g, ''));
    if (paste.length > 0) inputs.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus();
  };

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  return (
    <div className="flex justify-center gap-3">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className={`h-14 w-11 rounded-2xl border-2 text-center text-xl font-bold text-gray-800 outline-none transition-all
            ${digit
              ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-200 animate-pulse-once'
              : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white'
            }`}
        />
      ))}
    </div>
  );
}
