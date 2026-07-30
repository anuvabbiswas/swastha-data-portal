import React, { useState, useEffect } from 'react';
import { Users, FileText, Database, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Footer from './Footer';

export default function AdminLayout({ children, activeTab, setActiveTab }) {
  const { logout, user } = useAuth();

  // 1. Initialize state from localStorage (Option B chosen)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  // 2. Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const navItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'fields', label: 'Field Management', icon: FileText },
    { id: 'audit', label: 'Submissions Audit', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      
      {/* Sidebar with dynamic width and smooth transitions */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col transition-all duration-300 relative z-20`}>
        
        {/* Collapse/Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-blue-600 text-white rounded-full p-1 border-2 border-slate-50 hover:bg-blue-700 transition-colors shadow-sm"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Sidebar Header */}
        <div className={`p-6 border-b border-slate-800 transition-all duration-300 ${isCollapsed ? 'text-center px-2' : ''}`}>
          <h1 className={`font-bold transition-all whitespace-nowrap overflow-hidden ${isCollapsed ? 'text-sm' : 'text-xl'}`}>
            {isCollapsed ? 'ADM' : 'Swastha Admin'}
          </h1>
          {!isCollapsed && <p className="text-sm text-slate-400 mt-1 truncate">ID: {user?.employeeId}</p>}
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : ''} // Show tooltip if collapsed
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            title={isCollapsed ? "Logout" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area + Footer */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto relative">
          {children}
          
        </main>
        <Footer />
      </div>
      
    </div>
  );
}