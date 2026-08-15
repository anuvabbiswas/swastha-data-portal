import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 py-8">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-8 lg:p-10 border border-slate-100">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <img
              src={logo}
              alt="Swastha Hospital Logo"
              className="w-full max-w-xs h-24 object-contain mb-5"
            />

            <h1 className="portal-title text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center">
              Data Collection Portal
            </h1>

            <p className="text-sm text-slate-500 text-center">
              Please log in to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Role */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Select Role
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand appearance-none"
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
            </div>

            {/* User ID */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                User ID
              </label>

              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. ADM-001"
                autoComplete="username"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand pr-12"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error + Login Button */}
            <div className="pt-2">

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                  isSubmitting
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
              >
                {isSubmitting
                  ? 'Authenticating...'
                  : 'Login'}
              </button>
            </div>

            {/* Help Text */}
            <div className="flex flex-col items-center pt-2">
              <p className="text-[11px] sm:text-xs text-slate-400 text-center leading-relaxed">
                Contact your admin if you are having trouble logging in.
              </p>
            </div>

          </form>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}