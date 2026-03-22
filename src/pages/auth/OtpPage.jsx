import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import OtpInput from '@/components/common/OtpInput';
import Button from '@/components/common/Button';
import { verifyOtp, sendOtp } from '@/api/auth.api';
import { setCredentials } from '@/store/authSlice';

const RESEND_SECONDS = 30;

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  // Redirect if no phone in state
  useEffect(() => {
    if (!phone) navigate('/login', { replace: true });
  }, [phone, navigate]);

  // Countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleVerify = useCallback(async () => {
    if (otp.length < 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const res = await verifyOtp(phone, otp);
      dispatch(setCredentials(res.data.data));
      toast.success('Welcome to EduApp!');
      navigate('/home', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }, [otp, phone, dispatch, navigate]);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.length === 6) handleVerify();
  }, [otp]); // eslint-disable-line

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResending(true);
    try {
      await sendOtp(phone);
      toast.success('OTP resent!');
      setResendTimer(RESEND_SECONDS);
      setOtp('');
    } catch {
      toast.error('Could not resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formatted = phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : '';

  return (
    <div className="flex flex-1 flex-col">
      {/* Top gradient hero */}
      <div className="grad-primary px-6 pb-12 pt-12 text-white">
        <button onClick={() => navigate('/login')} className="mb-6 flex items-center gap-1.5 text-indigo-200 active:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Change number</span>
        </button>

        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
          <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Verify OTP</h1>
        <p className="mt-1 text-sm text-indigo-200">Code sent to <span className="font-semibold text-white">{formatted}</span></p>
      </div>

      {/* Card */}
      <div className="relative -mt-6 flex flex-1 flex-col rounded-t-3xl bg-white px-6 pt-8">
        <h2 className="text-lg font-semibold text-gray-900">Enter 6-digit OTP</h2>
        <p className="mt-1 text-sm text-gray-500">Type the code we sent to your number</p>

        <div className="mt-8">
          <OtpInput value={otp} onChange={setOtp} />
        </div>

        {/* Dev hint */}
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium text-amber-700">Dev mode — hardcoded OTP is <span className="font-bold tracking-widest">123456</span></p>
        </div>

        {/* Resend */}
        <div className="mt-5 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend OTP in <span className="font-semibold text-indigo-600">{resendTimer}s</span>
            </p>
          ) : (
            <button onClick={handleResend} disabled={resending}
              className="text-sm font-semibold text-indigo-600 disabled:opacity-50 active:text-indigo-800">
              {resending ? 'Resending…' : 'Resend OTP'}
            </button>
          )}
        </div>

        <div className="mt-auto pb-6 pt-8">
          <Button onClick={handleVerify} loading={loading} disabled={otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify & Login'}
          </Button>
        </div>
      </div>
    </div>
  );
}
