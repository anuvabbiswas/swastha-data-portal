import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EditUserModal({ user, onClose, onRefresh }) {
  const { token } = useAuth();
  
  // Initialize form data with the existing user values
  const [formData, setFormData] = useState({
    employeeId: user.employeeId,
    name: user.name,
    role: user.role
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/users/${user.id}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onRefresh(); // Refresh the parent table
          onClose();   // Close the modal
        }, 1000);
      } else {
        setError(data.message || 'Failed to update user.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit Associate</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Details updated successfully!
            </div>
          )}

          <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
              <input type="text" required value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select 
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})} 
                disabled={user.role === 'ADMIN'} // Prevent changing Admin roles directly here
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
              >
                <option value="MARKETING">Marketing Associate</option>
                <option value="COMMUNITY">Community Outreach Associate</option>
                <option value="ADMIN">System Admin</option>
              </select>
              {user.role === 'ADMIN' && <p className="text-xs text-slate-500 mt-1">Admin roles cannot be modified.</p>}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-user-form" 
            disabled={isSubmitting || success}
            className={`px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}