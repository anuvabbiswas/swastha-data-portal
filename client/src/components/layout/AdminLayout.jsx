import React, { useState, useEffect } from 'react';
import { Users, FileText, FileClock, LogOut, ChevronLeft, ChevronRight, BarChart3, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Footer from './Footer';
import logo from '../../assets/logo1.png';

export default function AdminLayout({ children, activeTab, setActiveTab }) {
  const { logout, user } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const navItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'fields', label: 'Form Management', icon: FileText },
    { id: 'audit', label: 'Submissions History', icon: FileClock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsMobileOpen(false); // Close menu on mobile after selection
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'} bg-sidebar text-white flex flex-col transition-all duration-300`}>
        
        {/* Mobile close button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 lg:hidden text-slate-300 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Desktop Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block absolute -right-3 top-8 bg-brand text-white rounded-full p-1 border-2 border-slate-50 hover:bg-brand-hover transition-colors shadow-sm"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`p-6 border-b border-slate-800 transition-all duration-300 ${isCollapsed ? 'lg:text-center lg:px-2' : ''} mt-8 lg:mt-0`}>
          <div className={`flex ${isCollapsed ? 'lg:justify-center' : ''} mb-3`}>
            <div className={`overflow-hidden rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'lg:w-10 lg:h-10 w-12 h-12' : 'w-12 h-12'}`}>
              <img
                src={logo}
                alt="Swastha Hospital Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className={`font-bold transition-all whitespace-nowrap overflow-hidden ${isCollapsed ? 'lg:text-sm text-xl' : 'text-xl'}`}>
            {isCollapsed ? (
              <>
                <span className="hidden lg:inline">ADM</span>
                <span className="inline lg:hidden">{user?.name}</span>
              </>
            ) : (
              <span>{user?.name}</span>
            )}
          </h1>
          {(!isCollapsed || isMobileOpen) && <p className={`text-sm text-slate-400 mt-1 truncate ${isCollapsed ? 'lg:hidden' : ''}`}>ID: {user?.employeeId}</p>}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-brand text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'lg:hidden ml-3' : ''}`}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            title={isCollapsed ? "Logout" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'space-x-3 px-4'} py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'lg:hidden ml-3' : ''}`}>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex flex-shrink-0 items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Swastha Hospital Logo" className="w-8 h-8 object-cover rounded-md" />
            <h1 className="font-bold text-slate-800 text-lg truncate">Admin Dashboard</h1>
          </div>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
        <Footer />
      </div>
      
    </div>
  );
}