'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout, canViewPartnersAndUsers } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const closeMenu = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span className="nav-label">Dashboard</span>
      </Link>
      
      <Link href="/prospects" className={`nav-item ${isActive('/prospects') ? 'active' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span className="nav-label">Prospects</span>
      </Link>
      
      <Link href="/activities" className={`nav-item ${isActive('/activities') ? 'active' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        <span className="nav-label">Activities</span>
      </Link>

      <div className="nav-item user-menu-container" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)} className="user-menu-button">
          {user?.avatar ? (
            <img src={user.avatar} alt="User avatar" className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="nav-label">Profile</span>
        </button>
        
        {menuOpen && (
          <div className="dropdown-menu">
            <Link href="/territories" className="menu-item" onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
              <span>Territories</span>
            </Link>
            {canViewPartnersAndUsers && (
              <>
                <Link href="/partners" className="menu-item" onClick={() => setMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Partners</span>
                </Link>
                <Link href="/users" className="menu-item" onClick={() => setMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Users</span>
                </Link>
              </>
            )}
            <hr className="menu-divider" />
            <button onClick={toggleTheme} className="menu-item menu-item-button">
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <hr className="menu-divider" />
            <a href="/app/user-profile" className="menu-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </a>
            <a href="/app/settings" className="menu-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path>
              </svg>
              <span>Settings</span>
            </a>
            <hr className="menu-divider" />
            <button onClick={handleLogout} className="menu-item menu-item-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          padding: 4px 0;
          z-index: 10000;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex;
            justify-content: space-around;
            align-items: center;
          }
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 6px 12px;
          color: #6b7280;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
          min-width: 70px;
          position: relative;
        }

        :global(.dark) .nav-item {
          color: #9ca3af;
        }

        .nav-item svg {
          width: 22px;
          height: 22px;
          stroke-width: 2;
        }

        .nav-label {
          font-size: 11px;
          font-weight: 500;
        }

        .nav-item:hover {
          color: #111827;
          background-color: #f3f4f6;
        }

        :global(.dark) .nav-item:hover {
          color: #f9fafb;
          background-color: #374151;
        }

        .nav-item.active {
          color: #2563eb;
          background-color: transparent;
        }

        :global(.dark) .nav-item.active {
          color: #60a5fa;
          background-color: transparent;
        }

        .nav-item.active svg {
          stroke-width: 2.5;
        }

        .user-menu-container {
          position: relative;
        }

        .user-menu-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #6b7280;
          padding: 6px 12px;
          width: 100%;
          border-radius: 8px;
          transition: all 0.2s;
        }

        :global(.dark) .user-menu-button {
          color: #9ca3af;
        }

        .user-menu-button:hover {
          color: #111827;
          background-color: #f3f4f6;
        }

        :global(.dark) .user-menu-button:hover {
          color: #f9fafb;
          background-color: #374151;
        }

        .user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-avatar-placeholder {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
        }

        :global(.dark) .user-avatar-placeholder {
          background-color: #60a5fa;
          color: #1e3a8a;
        }

        .dropdown-menu {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          padding: 6px;
          z-index: 10001;
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.dark) .dropdown-menu {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          color: #374151;
          text-decoration: none;
          font-size: 13px;
          border-radius: 6px;
          transition: background-color 0.2s;
          width: 100%;
        }

        .menu-item-button {
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        :global(.dark) .menu-item {
          color: #d1d5db;
        }

        .menu-item:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        :global(.dark) .menu-item:hover {
          background-color: #374151;
          color: #f9fafb;
        }

        .menu-item svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }

        .menu-divider {
          margin: 6px 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }

        :global(.dark) .menu-divider {
          border-top-color: #374151;
        }

        :global(.dark) .mobile-bottom-nav {
          background: #1f2937 !important;
          border-top-color: #374151 !important;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
    </nav>
  );
}

