'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Activity, Building2, UserCog, BookOpen, FolderTree } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { getVisibleNavItems } from '@/utils/permissions';

const iconMap = {
  dashboard: Home,
  prospects: Users,
  activities: Activity,
  'knowledge-base': BookOpen,
  territories: FolderTree,
  partners: Building2,
  users: UserCog,
};

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const visibleNavItems = getVisibleNavItems(user?.role as any);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-lg border-t border-gray-700/50 z-50 safe-area-inset-bottom shadow-2xl">
      <div className="flex items-center justify-around h-20 px-2 pb-safe">
        {visibleNavItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
          const isActive = item.route === '/' 
            ? pathname === '/' 
            : pathname === item.route || pathname.startsWith(item.route + '/');
          return (
            <Link
              key={item.route}
              href={item.route}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[60px] touch-manipulation transition-all duration-200 group ${
                isActive 
                  ? 'text-blue-400' 
                  : 'text-gray-400 active:text-blue-400'
              }`}
              aria-label={item.name}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-blue-400 rounded-b-full shadow-lg shadow-blue-400/60" />
              )}
              
              {/* Icon container with background on active */}
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-500/40 scale-110 ring-2 ring-blue-400/60' 
                  : 'bg-transparent group-active:bg-gray-700/50 group-active:scale-105'
              }`}>
                <Icon className={`w-6 h-6 transition-all duration-200 ${
                  isActive ? 'scale-110 text-blue-300' : 'scale-100 text-gray-400'
                }`} strokeWidth={isActive ? 3 : 2} />
              </div>
              
              {/* Label text */}
              <span className={`text-[10px] mt-0.5 font-medium transition-all whitespace-nowrap ${
                isActive ? 'text-blue-400 font-semibold' : 'text-gray-400'
              }`}>
                {item.name}
              </span>
              
              {/* Pulse animation for active state */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

