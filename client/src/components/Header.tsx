import { Link, useLocation } from 'react-router-dom';
import { MailCheck, Activity, Shield, FileText, LogOut, Key } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home', icon: null },
    { to: '/dashboard', label: 'Verifier', icon: Activity },
    { to: '/security', label: 'Security', icon: Shield },
    { to: '/docs', label: 'API Docs', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-200 py-2 px-6">
      <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <Link to="/" className="flex items-center gap-2 cursor-pointer no-underline">
          <div className="w-7 h-7 rounded-md bg-neutral-950 text-white flex items-center justify-center shadow-sm">
            <MailCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-xs tracking-tight text-neutral-900 leading-tight">Bulk Email Verifier</span>
            <span className="text-[8px] font-bold text-accent-600 font-mono tracking-wider leading-none">SANDBOX SECURE</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-md border border-brand-200 text-[11px] font-semibold">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer no-underline flex items-center gap-1 ${
                location.pathname === to
                  ? 'bg-white text-brand-900 shadow-[0_1px_1.5px_rgba(0,0,0,0.05)] border border-brand-200/50 font-bold'
                  : 'text-brand-500 hover:text-brand-900'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-[11px]">
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-1 text-brand-500 font-mono">
                <Key className="w-3 h-3" />
                {user?.name || user?.email}
              </span>
              <button
                onClick={logout}
                className="px-2 py-1 rounded-md border border-brand-200 text-brand-600 hover:bg-neutral-100 transition-colors cursor-pointer text-[11px] font-medium flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1 rounded-md border border-brand-200 text-brand-700 hover:bg-neutral-100 transition-colors no-underline text-[11px] font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors no-underline text-[11px] font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
