import React from 'react';
import { Sun, Moon, LogOut, FileSearch } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../pages/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-14 border-b border-surface-200 dark:border-surface-700
                       bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm
                       flex items-center justify-between px-5 shrink-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
          <FileSearch className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-surface-900 dark:text-surface-100 leading-tight">
            Resume Intelligence
          </h1>
          <p className="text-[10px] text-surface-500 dark:text-surface-400 leading-tight font-medium">
            Evidence-based job match analysis
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="btn-ghost p-2"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={handleLogout} className="btn-ghost p-2" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
