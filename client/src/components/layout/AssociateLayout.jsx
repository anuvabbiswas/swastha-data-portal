import React, { useState } from 'react';
import { FilePlus, History, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AssociateLayout({ children, activeTab, setActiveTab }) {
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'new', label: 'New Submission', icon: FilePlus },
    { id: 'history', label: 'My Submissions', icon: History },
  ];

  // Helper to format the role nicely (e.g., "MARKETING" -> "Marketing")
  const formattedRole = user?.role.charAt(0) + user?.role.slice(1).toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-20">
        <div>
          <h1 className="text-lg font-bold">Swastha {formattedRole}</h1>
          <p className="text-xs text-slate-400">{user?.name}</p>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-800 rounded-lg">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transition-transform duration-200 ease-in-out z-10 
        w-64 bg-slate-900 text-white flex flex-col h-full
      `}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-xl font-bold">Swastha {formattedRole}</h1>
          <p className="text-sm text-slate-400 mt-1">{user?.name}</p>
          <p className="text-xs text-slate-500 mt-1">ID: {user?.employeeId}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false); // Close menu on mobile after clicking
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-6">
        {children}
      </main>
    </div>
  );
}