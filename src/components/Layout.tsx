import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, BarChart3, ShieldAlert, Shield, LogOut, Menu, X, ClipboardCheck, Sun, Moon, Settings } from 'lucide-react';
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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'sk', 'lydc', 'meal_head', 'office_head', 'staff'] },
    { name: 'SK Reports', path: '/sk-reports', icon: FileText, roles: ['admin', 'sk', 'office_head'] },
    { name: 'LYDC Reports', path: '/lydc-reports', icon: FileText, roles: ['admin', 'lydc', 'office_head'] },
    { name: 'MEAL System', path: '/meal', icon: ClipboardCheck, roles: ['admin', 'staff', 'meal_head', 'office_head'] },
    { name: 'Administration', path: '/administration', icon: Shield, roles: ['admin', 'office_head'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-frostee/50 w-full">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 sm:p-4 glass sticky top-0 z-50 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-jewel/10 flex-shrink-0">
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
          <span className="font-semibold text-jewel text-sm sm:text-base truncate">TCYDO</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-jewel p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-y-0 left-0 z-40 w-64 glass flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:inset-auto md:z-auto md:h-screen overflow-hidden hover:overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:!translate-x-0`}
      >
        {/* Header */}
        <div className="p-responsive-sm flex items-center gap-3 border-b border-jewel/10 flex-shrink-0">
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
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-jewel leading-tight truncate">TCYDO</h1>
            <p className="text-xs text-jewel/70 line-clamp-2">Tagum City Youth Development Office</p>
          </div>
        </div>

        {/* Gradient Emoji Toggle */}
        <div className="px-responsive-sm py-3 border-t border-jewel/10 flex items-center justify-center gap-3 flex-shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              className="sr-only peer" 
              type="checkbox" 
              checked={isDark} 
              onChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
            <div className="w-16 h-8 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 peer-checked:from-[hsl(var(--color-jewel))] peer-checked:to-[hsl(var(--color-vista))] transition-all duration-500 after:content-['☀️'] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:flex after:items-center after:justify-center after:transition-all after:duration-500 peer-checked:after:translate-x-8 peer-checked:after:content-['🌙'] after:shadow-md after:text-base hover:shadow-xl">
            </div>
          </label>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-responsive-sm py-3 space-y-1 overflow-y-auto scrollable-responsive">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis ${
                  isActive
                    ? 'bg-jewel text-white shadow-md'
                    : 'text-jewel/80 hover:bg-white/50 hover:text-jewel active:bg-white/70'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-responsive-sm border-t border-jewel/10 flex-shrink-0 space-y-2">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-jewel truncate">{user?.name}</p>
            <p className="text-xs text-jewel/60 uppercase tracking-wider truncate">
              {user?.role === 'office_head' ? 'Office Head'
                : user?.role === 'meal_head' ? 'MEAL Head'
                : user?.role}
            </p>
          </div>
          <Link
            to="/account-settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-jewel hover:bg-jewel/10 transition-colors text-sm sm:text-base"
          >
            <Settings size={20} className="flex-shrink-0" />
            <span className="font-medium">Account Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 dark:text-red-400 transition-colors text-sm sm:text-base"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-responsive-sm md:p-8 overflow-y-auto w-full transition-all duration-300 flex flex-col">
        <div className="w-full max-w-full md:max-w-6xl mx-auto flex-1">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

