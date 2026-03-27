import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, BarChart3, ShieldAlert, Shield, LogOut, Menu, X, ClipboardCheck, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileLogoError, setMobileLogoError] = useState(false);
  const [sidebarLogoError, setSidebarLogoError] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'sk', 'lydc', 'meal_head', 'office_head'] },
    { name: 'SK Reports', path: '/sk-reports', icon: FileText, roles: ['admin', 'sk', 'office_head'] },
    { name: 'LYDC Reports', path: '/lydc-reports', icon: FileText, roles: ['admin', 'lydc', 'office_head'] },
    { name: 'MEAL System', path: '/meal', icon: ClipboardCheck, roles: ['admin', 'staff', 'meal_head', 'office_head'] },

    { name: 'Administration', path: '/administration', icon: Shield, roles: ['admin'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-frostee/50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-jewel/10">
            {mobileLogoError ? (
              <span className="text-jewel font-bold text-xs">TY</span>
            ) : (
              <img 
                src="https://i.imgur.com/xggJ5lV.png" 
                alt="TCYDO" 
                className="w-full h-full object-cover" 
                onError={() => setMobileLogoError(true)}
              />
            )}
          </div>
          <span className="font-semibold text-jewel">TCYDO</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-jewel">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-y-0 left-0 z-40 w-64 glass flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:inset-auto md:z-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:!translate-x-0`}
      >
        {/* Header */}
        <div className="p-6 flex items-center gap-3 border-b border-jewel/10">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-jewel/10 shadow-md flex-shrink-0">
            {sidebarLogoError ? (
              <span className="text-jewel font-bold text-xl">TY</span>
            ) : (
              <img 
                src="https://i.imgur.com/xggJ5lV.png" 
                alt="TCYDO Logo" 
                className="w-full h-full object-cover" 
                onError={() => setSidebarLogoError(true)}
              />
            )}
          </div>
          <div>
            <h1 className="font-bold text-jewel leading-tight">TCYDO</h1>
            <p className="text-xs text-jewel/70">Tagum City Youth Development Office</p>
          </div>
        </div>

        {/* Gradient Emoji Toggle */}
        <div className="p-4 border-t border-jewel/10 flex items-center justify-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              className="sr-only peer" 
              type="checkbox" 
              checked={isDark} 
              onChange={toggleTheme}
            />
            <div className="w-20 h-10 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 peer-checked:from-[hsl(var(--color-jewel))] peer-checked:to-[hsl(var(--color-vista))] transition-all duration-500 after:content-['☀️'] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-8 after:w-8 after:flex after:items-center after:justify-center after:transition-all after:duration-500 peer-checked:after:translate-x-10 peer-checked:after:content-['🌙'] after:shadow-md after:text-lg hover:shadow-xl">
            </div>
          </label>
        </div>




        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-jewel text-white shadow-md'
                    : 'text-jewel/80 hover:bg-white/50 hover:text-jewel'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-jewel/10">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-jewel truncate">{user?.name}</p>
            <p className="text-xs text-jewel/60 uppercase tracking-wider">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 dark:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

