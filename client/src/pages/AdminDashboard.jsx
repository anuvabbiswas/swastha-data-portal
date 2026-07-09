import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import UserManagement from '../components/admin/UserManagement';

export default function AdminDashboard() {
  // State to track which sidebar item is active
  const [activeTab, setActiveTab] = useState('users');

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Conditionally render the correct component based on the active tab */}
      {activeTab === 'users' && <UserManagement />}
      
      {activeTab === 'fields' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Field Management</h2>
          <p className="text-slate-500">Dynamic Form Engine coming in the next step...</p>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Submissions Audit</h2>
          <p className="text-slate-500">Audit tables coming soon...</p>
        </div>
      )}
    </AdminLayout>
  );
}