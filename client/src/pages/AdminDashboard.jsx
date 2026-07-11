import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import UserManagement from '../components/admin/UserManagement';
import FieldManagement from '../components/admin/FieldManagement';
import SubmissionsAudit from '../components/admin/SubmissionsAudit';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'users' && <UserManagement />}
      
      {/* Actual Component */}
      {activeTab === 'fields' && <FieldManagement />} 
      {activeTab === 'audit' && <SubmissionsAudit />}
    </AdminLayout>
  );
}