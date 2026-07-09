import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import UserManagement from '../components/admin/UserManagement';
import FieldManagement from '../components/admin/FieldManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'users' && <UserManagement />}
      
      {/* Swap out the placeholder for our actual Component */}
      {activeTab === 'fields' && <FieldManagement />} 

      {activeTab === 'audit' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Submissions Audit</h2>
          <p className="text-slate-500">Audit tables coming soon...</p>
        </div>
      )}
    </AdminLayout>
  );
}