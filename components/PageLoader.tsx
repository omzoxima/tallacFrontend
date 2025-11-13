'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loading indicator when route changes
    setLoading(true);
    
    // Hide loading after a short delay (allows page to render)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-800">
      <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-progress" />
    </div>
  );
}

