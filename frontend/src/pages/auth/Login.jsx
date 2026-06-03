import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const loadGoogleScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('google-gsi')) return resolve();
    const script = document.createElement('script');
    script.id = 'google-gsi';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login = () => {
  const { login, googleLogin, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('email');

  // Email
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Google
  const [googleLoading, setGoogleLoading] = useState(false);

  // Phone OTP
  const [phoneDigits, setPhoneDigits]     = useState('');
  const [otp, setOtp]                     = useState('');
  const [otpSent, setOtpSent]             = useState(false);
  const [phoneLoading, setPhoneLoading]   = useState(false);
  const [resendTimer, setResendTimer]     = useState(0);

  const fullPhone = '+91' + phoneDigits.replace(/\D/g, '');

  const startTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!phoneDigits || phoneDigits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setPhoneLoading(true);
    try {
      const devOtp = await sendOTP(fullPhone);
      setOtpSent(true);
      startTimer();
      if (devOtp) {
        setOtp(devOtp); // auto-fill in dev mode
        console.log(`📱 DEV OTP auto-filled: ${devOtp}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) { setError('Please enter the 6-digit OTP'); return; }
    setError('');
    setPhoneLoading(true);
    try {
      const user = await verifyOTP(otp);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google login is not configured.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    try {
      await loadGoogleScript();
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError('Google sign-in was cancelled.');
            setGoogleLoading(false);
            return;
          }
          try {
            const user = await googleLogin(tokenResponse.access_token);
            navigate(user.role === 'admin' ? '/admin' : '/');
          } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed.');
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError('Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">CreatorHub</h1>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading || loading || phoneLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 mb-4"
          >
            {googleLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-xs text-gray-600">or continue with</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-dark-700 rounded-lg p-1 mb-4">
            <button
              type="button"
              onClick={() => { setTab('email'); setError(''); setOtpSent(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'email' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setTab('phone'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'phone' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Phone / OTP
            </button>
          </div>

          {/* Email Form */}
          {tab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-dark-700 border border-dark-600 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="w-full bg-dark-700 border border-dark-600 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Phone OTP Form */}
          {tab === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  <div className="bg-dark-700 border border-dark-600 text-white rounded-lg px-3 py-2.5 text-sm flex items-center font-medium">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phoneDigits}
                    onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    disabled={otpSent}
                    maxLength={10}
                    className="flex-1 bg-dark-700 border border-dark-600 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Enter your 10-digit mobile number</p>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={phoneLoading || phoneDigits.length < 10}
                  className="btn-primary w-full py-2.5 disabled:opacity-50"
                >
                  {phoneLoading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Enter 6-digit OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="· · · · · ·"
                      maxLength={6}
                      className="w-full bg-dark-700 border border-dark-600 text-white placeholder-gray-400 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors tracking-[0.5em] text-center text-xl font-bold"
                    />
                    <p className="text-xs text-gray-600 mt-1.5">
                      OTP sent to +91 {phoneDigits}.{' '}
                      {resendTimer > 0 ? (
                        <span className="text-gray-500">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          className="text-brand-400 hover:text-brand-300"
                        >
                          Resend OTP
                        </button>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={phoneLoading || otp.length < 6}
                    className="btn-primary w-full py-2.5 disabled:opacity-50"
                  >
                    {phoneLoading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-400 py-1"
                  >
                    ← Change number
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;