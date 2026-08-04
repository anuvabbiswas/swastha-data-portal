import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import UserManagement from '../components/admin/UserManagement';
import FieldManagement from '../components/admin/FieldManagement';
import SubmissionsAudit from '../components/admin/SubmissionsAudit';
import Analytics from '../components/admin/Analytics';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'users' && <UserManagement />}
      
      {activeTab === 'fields' && <FieldManagement />}
      {activeTab === 'audit' && <SubmissionsAudit />}
      {activeTab === 'analytics' && <Analytics />}
    </AdminLayout>
  );
}