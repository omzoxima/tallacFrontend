'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];

  useEffect(() => {
    // Don't do anything while loading
    if (loading) {
      return;
    }

    // ALWAYS allow login page - don't redirect away from it
    if (pathname === '/login') {
      // Only redirect away from login if user is authenticated AND password change is NOT required
      if (user && user.id && !user.password_change_required) {
        router.push('/');
      }
      return;
    }

    // For change-password page - user must be authenticated
    if (pathname === '/change-password') {
      if (!user || !user.id) {
        // No user, redirect to login
        setIsRedirecting(true);
        router.push('/login');
      }
      // If user exists, allow access to change-password page
      return;
    }

    // For all other protected routes (dashboard, prospects, etc.)
    if (!user || !user.id) {
      // No user, redirect to login (NOT change-password)
      setIsRedirecting(true);
      router.push('/login');
      return;
    }

    // User exists and is authenticated
    // NOTE: We DO NOT redirect to change-password here
    // Change password redirect should ONLY happen from login page after successful login
    // If user is on dashboard/prospects and password_change_required is true, 
    // they can still access the page (change password is optional from header)
  }, [user, loading, pathname, router]);

  // ALWAYS allow login page to render immediately - don't wait for anything
  // This ensures login page shows immediately when server starts
  if (pathname === '/login') {
    // Don't show login page if user is already authenticated (unless password change required)
    // This prevents flash of login page after successful login
    if (!loading && user && user.id && !user.password_change_required) {
      return null; // Will redirect to dashboard in useEffect
    }
    return <>{children}</>;
  }

  // Show loading while checking authentication (for all protected routes)
  // This prevents showing header/content before authentication is verified
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  // For change-password page - user must be authenticated
  if (pathname === '/change-password') {
    if (isRedirecting || !user || !user.id) {
      // Will redirect to login in useEffect
      return null;
    }
    // User is authenticated, allow access to change-password page
    return <>{children}</>;
  }

  // For all protected routes (dashboard, prospects, etc.)
  if (isRedirecting) {
    // Redirecting, show loading
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-white">Redirecting...</div>
        </div>
      </div>
    );
  }

  // After loading, if no user, redirect to login
  if (!user || !user.id) {
    // Will redirect to login in useEffect
    return null;
  }

  // User is authenticated - allow access to protected routes
  // NOTE: We don't block access if password_change_required is true
  // Change password redirect should ONLY happen from login page after successful login
  return <>{children}</>;
}

