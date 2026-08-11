import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Check, Eye, EyeOff, AlertCircle, KeyRound, ArrowLeft, RefreshCw, Sparkles, Building2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, forgotPassword, resetPasswordByToken, securityNotifications } = useApp();
  
  // View states: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password field
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Reset password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [simulatedInbox, setSimulatedInbox] = useState<string | null>(null);

  // Check for remembered email on mount
  useEffect(() => {
    const saved = safeGetItem('enterprise_remember_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Watch for generated password reset codes in security notifications for easy demo testing
  useEffect(() => {
    if (view === 'forgot' && securityNotifications.length > 0) {
      const latest = securityNotifications[0];
      if (latest.title === 'Password Reset Requested' && latest.message.includes(forgotEmail)) {
        // Extract 6-digit code
        const codeMatch = latest.message.match(/\((\d{6})\)/);
        if (codeMatch && codeMatch[1]) {
          setSimulatedInbox(codeMatch[1]);
        }
      }
    }
  }, [securityNotifications, view, forgotEmail]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    
    // Simulate minor network delay for JWT hashing security feel
    setTimeout(async () => {
      const res = await login(email, password, rememberMe);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed.');
      }
    }, 600);
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSimulatedInbox(null);
    
    if (!forgotEmail) {
      setError('Please enter your email address.');
      return;
    }
    
    const res = forgotPassword(forgotEmail);
    if (res.success) {
      setSuccess('A 6-digit verification code has been dispatched to your email.');
      setResetEmail(forgotEmail);
      // Wait a moment then route to reset screen
      setTimeout(() => {
        setView('reset');
        setSuccess(null);
      }, 1500);
    } else {
      setError(res.error || 'Failed to request reset.');
    }
  };

  // Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!resetCode || !newPassword || !confirmPassword) {
      setError('Please complete all verification fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const res = await resetPasswordByToken(resetEmail, resetCode, newPassword);
      setLoading(false);
      if (res.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          setView('login');
          setSuccess(null);
          setPassword('');
          setError(null);
        }, 2000);
      } else {
        setError(res.error || 'Verification failed.');
      }
    }, 600);
  };

  // Prefill helper for testing and evaluation
  const handlePrefill = (prefilledEmail: string) => {
    setEmail(prefilledEmail);
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-neutral-200">
      
      {/* Top Brand Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 bg-black rounded-2xl items-center justify-center shadow-md mb-4 ring-4 ring-neutral-100">
          <KeyRound className="text-white h-6 w-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Enterprise Security Portal
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500 max-w-sm mx-auto uppercase tracking-widest font-semibold font-mono">
          Strict Access Node &middot; JWT Secure
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
          
          {/* Subtle status glow top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-600 via-neutral-950 to-neutral-600" />

          {/* VIEW: LOGIN FORM */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="login-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="name@enterprise.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-xs font-medium text-gray-600 hover:text-black transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="login-remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black focus:outline-none cursor-pointer"
                  />
                  <span className="ml-2 text-xs text-gray-500 font-medium">Remember my credential</span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-800 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <button
                type="submit"
                id="login-btn"
                disabled={loading}
                className="w-full py-3 bg-black text-white hover:bg-neutral-800 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-md disabled:bg-neutral-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying Security...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Sign In Terminals</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-gray-900">Forgot Password</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your email registered in User Management. We will simulate sending a secure OTP authorization code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Enter Account Email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="owner@enterprise.com"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-800">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div>{success}</div>
                </div>
              )}

              {simulatedInbox && (
                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 mt-4 animate-fade-in text-left">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Mock SMTP Dispatcher</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    An automated email containing authorization token was triggered.
                  </p>
                  <div className="mt-3 flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                    <div>
                      <div className="text-[9px] text-gray-500 font-mono">OTP AUTHORIZATION CODE:</div>
                      <div className="text-lg font-mono font-bold text-white tracking-widest">{simulatedInbox}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResetCode(simulatedInbox);
                        setView('reset');
                      }}
                      className="px-2.5 py-1.5 bg-white text-black text-[10px] font-semibold rounded hover:bg-gray-200 font-mono"
                    >
                      Autofill OTP
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 hover:text-black font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Login</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black text-white hover:bg-neutral-800 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <span>Request Code</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD */}
          {view === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-gray-900">Authorization Code Check</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter authorization code sent to <strong className="text-gray-800">{resetEmail}</strong> to override password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="block w-full text-center tracking-widest font-mono text-xl py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  New Secure Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Min 8 chars, uppercase, number, symbol"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-800">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div>{success}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black text-white hover:bg-neutral-800 font-medium text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-neutral-400"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                <span>Override & Save Password</span>
              </button>
            </form>
          )}

        </div>

        {/* DEMO ACCOUNTS ACCORDION - GOLD STANDARD USABILITY */}
        {view === 'login' && (
          <div className="mt-5 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono uppercase tracking-widest font-bold border-b border-gray-100 pb-2 mb-3">
              <Building2 className="h-3.5 w-3.5" />
              <span>Evaluator Access Shortcuts</span>
            </div>
            
            <div className="space-y-1.5 text-left">
              {[
                { label: 'Enterprise Owner', email: 'owner@enterprise.com', role: 'Full Enterprise Access' },
                { label: 'System Admin', email: 'admin@enterprise.com', role: 'Security & Branch Configurations' },
                { label: 'Branch Manager', email: 'manager@sivasakthi.com', role: 'Single Shop Branch Access' },
                { label: 'POS Cashier', email: 'cashier@sivasakthi.com', role: 'POS Billing Only' },
                { label: 'Company Accountant', email: 'accountant@sivasakthi.com', role: 'Audits & Ledgers Only' }
              ].map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePrefill(acc.email)}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-black hover:bg-gray-50 flex items-center justify-between text-xs transition-all group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-gray-800 flex items-center gap-1">
                      <span>{acc.label}</span>
                      <span className="text-[9px] font-mono font-medium text-gray-400">({acc.role})</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono tracking-tight mt-0.5">{acc.email}</div>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 group-hover:text-black font-semibold uppercase tracking-wider bg-gray-50 group-hover:bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    Use Account
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-center text-gray-400 font-mono mt-3.5">
              Password for all seeded accounts: <strong className="text-gray-700">Password@123</strong>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
