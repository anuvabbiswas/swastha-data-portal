import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Power, Search, Filter, XCircle, Edit3 } from 'lucide-react';
import EditUserModal from './EditUserModal';
import ResetPasswordModal from './ResetPasswordModal';

export default function UserManagement() {
  const { token, user: loggedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({ employeeId: '', name: '', role: '', password: '' });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [editingUser, setEditingUser] = useState(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);
  
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

  const handleToggleStatus = async (userId, currentStatus) => {

    const confirmMessage = currentStatus === 'ACTIVE' 
      ? 'Are you sure you want to disable this user? They will not be able to log in.' 
      : 'Are you sure you want to re-enable this user?';
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchUsers(); 
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update status.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  // const handleResetPassword = async (userId) => {
  //   const newPassword = window.prompt('Enter the new temporary password for this user:');
  //   if (!newPassword) return; 

  //   try {
  //     const res = await fetch(`/api/users/${userId}/reset-password`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  //       body: JSON.stringify({ newPassword })
  //     });
  //     const data = await res.json();
  //     alert(data.message);
  //   } catch (err) {
  //     alert('Network error occurred.');
  //   }
  // };



  // --- NEW: Dynamic Filtering Logic ---
  const filteredUsers = users.filter(user => {
    // 1. Search Logic (Case-insensitive)
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Role Filter Logic
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    // 3. Status Filter Logic
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">User Management</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Side: Create User Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit xl:col-span-1">
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
              <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Select role</option>
                <option value="MARKETING">Marketing Associate</option>
                <option value="COMMUNITY">Community Outreach Associate</option>
                <option value="ADMIN">System Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
              <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700">
              Create Account
            </button>
          </form>
        </div>

        {/* Right Side: Directory & Filters */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* --- NEW: Search & Filter Control Bar --- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            
            {/* Search Box */}
            <div className="flex-1 w-full relative">
              <label className="sr-only">Search Associates</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-48">
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MARKETING">Marketing Associate</option>
                <option value="COMMUNITY">Community Associate</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button 
                onClick={clearFilters}
                className="flex items-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors w-full sm:w-auto justify-center whitespace-nowrap"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Clear
              </button>
            )}
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* Notice we map over filteredUsers instead of users */}
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-900">{u.employeeId}</td>
                        <td className="p-4 text-slate-700">{u.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {/* 1. Edit Button (Available for everyone) */}
                          <button 
                            onClick={() => setEditingUser(u)}
                            className="inline-flex items-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={u.id === loggedInUser.id ? "Edit My Profile" : "Edit User"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {/* 2. Reset Password Button (Available for everyone) */}
                          <button 
                            onClick={() => setResettingPasswordUser(u)}
                            className="inline-flex items-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Reset Password"
                          >
                            <Lock className="w-4 h-4" />
                          </button>

                          {/* 3. Disable Button (Hidden ONLY if it's the logged-in Admin's row) */}
                          {u.id !== loggedInUser.id && (
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
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500">
                          {users.length === 0 ? "No users found in the system." : "No associates match your search and filter criteria."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Render the Edit Modal if a user is selected */}
      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          loggedInUserId={loggedInUser.id}
          onClose={() => setEditingUser(null)} 
          onRefresh={fetchUsers} 
        />
      )}
      {/* Edit password modal */}
      {resettingPasswordUser && (
        <ResetPasswordModal 
          user={resettingPasswordUser} 
          onClose={() => setResettingPasswordUser(null)} 
        />
      )}
    </div>
  );
}