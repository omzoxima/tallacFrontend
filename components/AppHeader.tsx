'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCall } from '@/contexts/CallContext';
import OngoingCallIndicator from './OngoingCallIndicator';

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canViewPartnersAndUsers, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { activeCall } = useCall();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by only rendering conditional content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize isActive to prevent unnecessary re-renders
  const isActive = useMemo(() => {
    return (path: string) => {
      if (path === '/') {
        return pathname === '/' || pathname === '/dashboard';
      }
      return pathname === path || pathname.startsWith(path + '/');
    };
  }, [pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const handleCallIndicatorClick = () => {
    if (activeCall) {
      router.push(`/prospects?openProspect=${activeCall.prospectId}`);
    }
  };

  const handleHangUp = () => {
    console.log('Call ended from header');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo">
            <h1>TALLAC</h1>
          </div>
          {/* Only show navigation tabs after user is loaded and component is mounted (prevents hydration mismatch) */}
          {mounted && !isLoading && user && (user.id || user.email) && (
            <nav className="nav-links" suppressHydrationWarning>
            <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Dashboard
            </Link>
            <Link href="/prospects" className={`nav-link ${isActive('/prospects') ? 'active' : ''}`}>
              Prospects
            </Link>
            <Link href="/activities" className={`nav-link ${isActive('/activities') ? 'active' : ''}`}>
              Activities
            </Link>
            <Link href="/territories" className={`nav-link ${isActive('/territories') ? 'active' : ''}`}>
              Territories
            </Link>
            {canViewPartnersAndUsers && (
              <>
                <Link href="/partners" className={`nav-link ${isActive('/partners') ? 'active' : ''}`}>
                  Partners
                </Link>
                <Link href="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
                  Users
                </Link>
              </>
            )}
          </nav>
          )}
        </div>
        <div className="header-right">
          <OngoingCallIndicator onClick={handleCallIndicatorClick} onHangup={handleHangUp} />
          
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={isDark ? 'Light mode' : 'Dark mode'}
            suppressHydrationWarning
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          
          <div className="user-menu" ref={menuRef} suppressHydrationWarning>
            {!mounted ? (
              // Show loading state during SSR to match initial render
              <button className="user-button" disabled>
                <div className="user-avatar-placeholder">
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                  </svg>
                </div>
              </button>
            ) : isLoading ? (
              <button className="user-button" disabled>
                <div className="user-avatar-placeholder">
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                  </svg>
                </div>
              </button>
            ) : user && (user.id || user.email) ? (
              <button onClick={() => setMenuOpen(!menuOpen)} className="user-button">
                {user.avatar ? (
                  <img src={user.avatar} alt="User avatar" className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-info-text">
                  <span className="user-name">{user.full_name || user.email || 'User'}</span>
                  <span className="user-role">{user.tallac_role || 'User'}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            ) : null}
            
            {menuOpen && (
              <div className="dropdown-menu">
                <a href="/app/user-profile" className="menu-item">Profile</a>
                <a href="/app/settings" className="menu-item">Settings</a>
                <hr className="menu-divider" />
                <button onClick={handleLogout} className="menu-item menu-item-button">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .app-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10001;
          isolation: isolate;
        }

        html.dark .app-header {
          background: #1f2937;
          border-bottom: 1px solid #374151;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .logo h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
          font-family: inherit;
        }

        .dark .logo h1 {
          color: #f9fafb;
        }

        .nav-links {
          display: flex;
          gap: 8px;
        }

        .nav-link {
          padding: 8px 16px;
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          transition: all 0.2s;
          font-family: inherit;
        }

        .dark .nav-link {
          color: #9ca3af;
        }

        .nav-link:hover {
          color: #111827;
          background-color: #f3f4f6;
        }

        .dark .nav-link:hover {
          color: #f9fafb;
          background-color: #374151;
        }

        .nav-link.active {
          color: #2563eb;
          background-color: #eff6ff;
        }

        .dark .nav-link.active {
          color: #60a5fa;
          background-color: transparent;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .theme-toggle {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .dark .theme-toggle {
          color: #9ca3af;
        }

        .theme-toggle:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .dark .theme-toggle:hover {
          background-color: #374151;
          color: #f9fafb;
        }

        .user-menu {
          position: relative;
        }

        .user-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          color: #6b7280;
        }

        .dark .user-button {
          color: #9ca3af;
        }

        .user-button:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .dark .user-button:hover {
          background-color: #374151;
          color: #f9fafb;
        }

        .user-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .user-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .dark .user-avatar-placeholder {
          background-color: #60a5fa;
          color: #1e3a8a;
        }

        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .user-info-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          line-height: 1.2;
        }

        .user-role {
          font-size: 11px;
          color: #6b7280;
          font-weight: 400;
        }

        .dark .user-name {
          color: #f9fafb;
        }

        .dark .user-role {
          color: #9ca3af;
        }

        .user-button:hover .user-role {
          color: #4b5563;
        }

        .dark .user-button:hover .user-role {
          color: #e5e7eb;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          padding: 8px;
          z-index: 100;
        }

        .dark .dropdown-menu {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }

        .menu-item {
          display: block;
          padding: 8px 12px;
          color: #374151;
          text-decoration: none;
          font-size: 14px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .menu-item-button {
          width: 100%;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .dark .menu-item {
          color: #d1d5db;
        }

        .menu-item:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .dark .menu-item:hover {
          background-color: #374151;
          color: #f9fafb;
        }

        .menu-divider {
          margin: 8px 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }

        .dark .menu-divider {
          border-top-color: #374151;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .user-name {
            display: none;
          }

          .theme-toggle {
            display: none;
          }

          .user-menu {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

