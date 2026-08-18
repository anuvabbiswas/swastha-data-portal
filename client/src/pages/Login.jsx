import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, LockKeyhole, Loader2, CircleAlert } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/layout/Footer';

export default function Login() {
  const [role, setRole] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Invalid credentials. Please try again.'
        );
      }

      login(data.data.user, data.token);

      if (data.data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/associate');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center p-4 py-4 sm:py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg w-full max-w-md p-5 sm:p-6 lg:p-7 border border-slate-200/70">
          <div className="flex flex-col items-center mb-6">
            <img
              src={logo}
              alt="Swastha Hospital Logo"
              className="h-16 sm:h-20 w-auto object-contain mb-3"
            />
            <h1 className="portal-title text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 text-center">
              Data Collection Portal
            </h1>

            <p className="text-sm text-slate-500 text-center">
              Please log in to your account
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">

              <label className="block text-sm font-medium text-slate-700">
                Select Role
              </label>

              <div className="relative">

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                  required
                >
                  <option value="" disabled>
                    Choose your role...
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>

                  <option value="MARKETING">
                    Marketing Associate
                  </option>

                  <option value="COMMUNITY">
                    Community Outreach Associate
                  </option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">

              <label className="block text-sm font-medium text-slate-700">
                User ID
              </label>

              <div className="relative">

                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />

                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your User ID"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                  required
                />

              </div>
            </div>
            <div className="space-y-1.5">

              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 rounded-md transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>
            </div>
            <div className="pt-1">
              {error && (
                <div
                  role="alert"
                  className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium flex items-start gap-2.5"
                >
                  <CircleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 ${
                  isSubmitting
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:-translate-y-[1px]'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
            <div className="flex flex-col items-center pt-1">

              <p className="text-[11px] sm:text-xs text-slate-400 text-center leading-relaxed">
                Contact your admin if you are having trouble logging in.
              </p>

            </div>

          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}