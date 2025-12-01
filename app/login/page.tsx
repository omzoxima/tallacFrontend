'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Mail, Lock, LogIn, Link as LinkIcon, KeyRound, Moon, Sun, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading, refresh } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'magic-link' | 'forgot-password'>('login');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [tabMessage, setTabMessage] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isDark, setIsDark] = useState(true);

  const tabs = [
    { id: 'login', label: 'Login', description: 'Sign in with your Tallac credentials.' },
    { id: 'magic-link', label: 'Email Link', description: 'Receive a one-time secure login link via email.' },
    { id: 'forgot-password', label: 'Forgot Password', description: 'Request a password reset with administrator help.' },
  ] as const;

  // Initialize theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Pre-fill email from URL query parameters (if present)
  // SECURITY: Never read password from URL - it's a security risk
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailParam = searchParams?.get('email');
      
      if (emailParam) {
        // Pre-fill email from URL
        setEmail(decodeURIComponent(emailParam));
        
        // Remove email and password from URL for security
        // Password should NEVER be in URL, but remove it if present
        const url = new URL(window.location.href);
        url.searchParams.delete('email');
        url.searchParams.delete('password'); // Remove password if present
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setTabMessage(null);
    if (activeTab !== 'login') {
      setError('');
    }
  }, [activeTab]);

  // Redirect if user is already authenticated (but not if password change required)
  useEffect(() => {
    if (!userLoading && user && user.id && !user.password_change_required) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Invalid credentials';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Store token
      localStorage.setItem('token', data.token);
      
      // Refresh user context to update user state immediately
      await refresh();
      
      // Determine redirect path based on password change requirement
      const redirectPath = data.user && data.user.password_change_required === true
        ? '/change-password'
        : '/';
      
      // Small delay to ensure context is updated, then redirect
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 100);
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error && error.message) || 'An error occurred. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail) {
      setTabMessage({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    setTabMessage({
      type: 'info',
      message: 'Magic link login will be available soon. For now, please contact your administrator for access.',
    });
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setTabMessage({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    setTabMessage({
      type: 'success',
      message: 'Password reset instructions will be shared by your administrator shortly.',
    });
  };

  const renderActivePanel = () => {
    if (activeTab === 'login') {
      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
              isDark 
                ? 'bg-red-500/10 border border-red-500/50 text-red-400' 
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`block w-full pl-10 pr-3 py-3 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className={`block w-full pl-10 pr-10 py-3 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      );
    }

    return (
      <>
        {tabMessage && (
          <div
            className={`px-4 py-3 rounded-lg text-sm border ${
              tabMessage.type === 'error'
                ? isDark
                  ? 'bg-red-500/10 border-red-500/50 text-red-400'
                  : 'bg-red-50 border-red-200 text-red-600'
                : tabMessage.type === 'success'
                ? isDark
                  ? 'bg-green-500/10 border-green-500/40 text-green-300'
                  : 'bg-green-50 border-green-200 text-green-600'
                : isDark
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            {tabMessage.message}
          </div>
        )}

        {activeTab === 'magic-link' && (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  className={`block w-full pl-10 pr-3 py-3 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  placeholder="you@example.com"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <LinkIcon className="h-5 w-5" />
              <span>Send Secure Login Link</span>
            </button>

            <p className={`text-xs text-center ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We&apos;re rolling out passwordless login soon. Until then, your administrator can assist with account access.
            </p>
          </form>
        )}

        {activeTab === 'forgot-password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  className={`block w-full pl-10 pr-3 py-3 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              <KeyRound className="h-5 w-5" />
              <span>Request Password Reset</span>
            </button>

            <p className={`text-xs text-center ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              A Tallac administrator will verify your identity and help you reset your password.
            </p>
          </form>
        )}
      </>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      <div className="relative w-full max-w-md">
        {/* Theme Toggle - Top Right */}
        <button
          onClick={toggleTheme}
          className={`absolute -top-3 -right-3 p-2 rounded-lg shadow-md transition-colors ${
            isDark
              ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-xl transform hover:scale-105 transition-transform">
            <span className="text-3xl font-bold text-white">T</span>
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            TALLAC.IO
          </h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className={`backdrop-blur-sm border rounded-2xl shadow-2xl p-8 transition-colors ${
          isDark
            ? 'bg-gray-800/80 border-gray-700 text-white'
            : 'bg-white/95 border-gray-200 shadow-xl text-gray-900'
        }`}>
          <div className="mb-6">
            <div className={`flex border rounded-2xl p-1 ${
              isDark
                ? 'bg-gray-900/40 border-gray-700'
                : 'bg-gray-100 border-gray-300'
            }`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === tab.id
                      ? isDark
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'bg-white text-gray-900 shadow-md'
                      : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className={`text-xs mt-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>

          <div className="space-y-6">{renderActivePanel()}</div>

          <div className="mt-6 text-center">
            <p className={`text-xs ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Secure login with encrypted credentials
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
