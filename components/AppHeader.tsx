'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { getVisibleNavItems } from '@/utils/permissions';
import ActiveCallCard from './ActiveCallCard';
import RecordCallOutcomeModal from './RecordCallOutcomeModal';

export default function AppHeader() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useUser();
  const visibleNavItems = getVisibleNavItems(user?.role);
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('AppHeader - User:', user);
      console.log('AppHeader - User Role:', user?.role);
      console.log('AppHeader - Visible Nav Items:', visibleNavItems);
    }
  }, [user, visibleNavItems]);

  const handleLogout = async () => {
    try {
      // Get token before clearing it
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      // Clear user context immediately (prevents any state updates)
      logout();
      
      // Call logout API in background (don't wait for it) - use token before it was cleared
      if (token) {
        fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore errors - we're logging out anyway
        });
      }
      
      // Use window.location.href for immediate, clean redirect (clears React state)
      // This prevents any flickering or double renders
      window.location.href = '/login';
    } catch {
      // Even if there's an error, clear everything and redirect
      logout();
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    // Check saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b bg-white border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation - Left Side */}
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">
                TALLAC.IO
              </h1>
            </Link>

            {/* Navigation - Desktop Only */}
            <nav className="hidden md:flex items-center gap-2">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.route}
                  href={item.route}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    pathname === item.route
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Menu - Right Side */}
          <div className="flex items-center gap-4">
            {/* Active call pill (if any) */}
            <ActiveCallCard />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            {/* User Menu */}
            <div className="relative group flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
                  {user?.name?.charAt(0) || user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                {user?.role && (
                  <span className="text-xs text-gray-600 hidden md:inline-block whitespace-nowrap">
                    {user.role}
                  </span>
                )}
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                    {user?.full_name || user?.email || 'User'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Call Outcome Modal */}
        <RecordCallOutcomeModal />

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.route}
                  href={item.route}
                  className={`block px-4 py-3 rounded-md text-base font-medium transition-all ${
                    pathname === item.route
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

