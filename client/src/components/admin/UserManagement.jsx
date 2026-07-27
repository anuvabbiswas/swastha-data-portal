import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Power } from 'lucide-react';

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({ employeeId: '', name: '', role: '', password: '' });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setUsers(data.data.users);
      else setError(data.message || 'Failed to fetch users');
    } catch (err) {
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setFormMessage({ type: 'success', text: 'User created successfully!' });
        setFormData({ employeeId: '', name: '', role: '', password: '' });
        fetchUsers(); 
      } else {
        setFormMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Server error occurred.' });
    }
  };

  // --- NEW: Toggle Status Handler ---
  const handleToggleStatus = async (userId, currentStatus, role) => {
    if (role === 'ADMIN') return alert('Cannot disable an Admin account.');
    
    const confirmMessage = currentStatus === 'ACTIVE' 
      ? 'Are you sure you want to disable this user? They will not be able to log in.' 
      : 'Are you sure you want to re-enable this user?';
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers(); // Refresh table on success
      else alert('Failed to update status.');
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  // --- NEW: Reset Password Handler ---
  const handleResetPassword = async (userId) => {
    const newPassword = window.prompt('Enter the new password for this user:');
    if (!newPassword) return; // User cancelled the prompt

    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">User Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Create New Associate</h3>
          
          {formMessage.text && (
            <div className={`mb-4 p-3 rounded text-sm font-medium ${formMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
              <input type="text" required value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. MKT-005" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Assign role...</option>
                <option value="MARKETING">Marketing Associate</option>
                <option value="COMMUNITY">Community Associate</option>
                <option value="ADMIN">System Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700">
              Create Account
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Associate Directory</h3>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading users...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                    <th className="p-4 font-medium">Employee ID</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    {/* NEW: Actions Column */}
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{u.employeeId}</td>
                      <td className="p-4 text-slate-700">{u.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {u.status}
                        </span>
                      </td>
                      {/* NEW: Action Buttons */}
                      <td className="p-4 text-right space-x-2">
                        {u.role !== 'ADMIN' && (
                          <>
                            <button 
                              onClick={() => handleResetPassword(u.id)}
                              className="inline-flex items-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Reset Password"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(u.id, u.status, u.role)}
                              className={`inline-flex items-center p-1.5 rounded transition-colors ${
                                u.status === 'ACTIVE' 
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                                  : 'text-red-500 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={u.status === 'ACTIVE' ? "Disable User" : "Enable User"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}