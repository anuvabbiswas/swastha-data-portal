import React, { useState } from 'react';
import { X, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ResetPasswordModal({ user, onClose }) {
  const { token } = useAuth();
  
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNext = () => {
    if (!newPassword.trim()) {
      setError('Password cannot be empty.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async () => {
    // 1. Strict Validation Rule
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please enter the new password again.');
      setNewPassword('');
      setConfirmPassword('');
      setStep(1); // Restart the process as requested
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 2. API Call (Only fires if validation passes)
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to reset password.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('A network error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Reset Password</h2>
            <p className="text-xs text-slate-500 mt-1">For: {user.name} ({user.employeeId})</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Password reset successfully!
            </div>
          )}

          {!success && (
            <div className="space-y-4">
              {step === 1 ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Enter New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      autoFocus
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="w-full p-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-brand text-sm" 
                      placeholder="Type new password..."
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      autoFocus
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      className="w-full p-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-brand text-sm" 
                      placeholder="Re-type new password..."
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!success && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
            {step === 1 ? (
              <>
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors"
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={handleBack} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 text-sm font-bold text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm'}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}