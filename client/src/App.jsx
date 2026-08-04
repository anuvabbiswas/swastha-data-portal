import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AssociateDashboard from './pages/AssociateDashboard';

// Custom Wrapper Component to protect routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();

  // If no token, kick them to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If they are logged in but don't have the right role, deny access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect them to their proper dashboard based on role
    return user.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/associate" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/associate" 
            element={
              <ProtectedRoute allowedRoles={['MARKETING', 'COMMUNITY']}>
                <AssociateDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}