import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '@/components/common/Button';
import { sendOtp } from '@/api/auth.api';

export default function PhonePage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clean = phone.replace(/\D/g, '');
  const isValid = clean.length === 10;

  const handleChange = (e) => {
    const val = e.target.value.replace(/[^\d\s\-+()]/g, '').slice(0, 15);
    setPhone(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) { setError('Enter a valid 10-digit mobile number'); return; }

    setLoading(true);
    try {
      await sendOtp(clean);
      toast.success('OTP sent!');
      navigate('/otp', { state: { phone: clean } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Top gradient hero */}
      <div className="grad-primary px-6 pb-12 pt-16 text-white">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
          {/* Book icon */}
          <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold leading-tight">EduApp</h1>
        <p className="mt-2 text-indigo-200 text-base">Your personalised learning companion</p>
      </div>

      {/* Card pulled up over gradient */}
      <div className="relative -mt-6 flex flex-1 flex-col rounded-t-3xl bg-white px-6 pt-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
        <p className="mt-1 text-sm text-gray-500">Enter your mobile number to continue</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-1 flex-col">
          {/* Phone input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mobile Number</label>
            <div className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition-colors
              ${error ? 'border-red-400 bg-red-50' : isValid ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50 focus-within:border-indigo-400 focus-within:bg-white'}`}>
              {/* Country code */}
              <div className="flex items-center gap-1.5 border-r border-gray-300 pr-3">
                <span className="text-lg leading-none">🇮🇳</span>
                <span className="text-sm font-semibold text-gray-700">+91</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handleChange}
                placeholder="98765 43210"
                className="flex-1 bg-transparent text-base font-medium text-gray-900 placeholder-gray-400 outline-none"
                autoFocus
              />
              {isValid && (
                <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
          </div>

          {/* Info note */}
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-indigo-700">We'll send a one-time password to verify your number. No registration needed.</p>
          </div>

          <div className="mt-auto pb-6 pt-8">
            <Button type="submit" loading={loading} disabled={!isValid}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
