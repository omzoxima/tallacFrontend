'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Activity, Building2, MapPin, UserCog, BookOpen } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { getVisibleNavItems } from '@/utils/permissions';

const iconMap = {
  dashboard: Home,
  prospects: Users,
  activities: Activity,
  team: UserCog,
  location: MapPin,
  company: Building2,
  'knowledge-base': BookOpen,
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
          const isActive = pathname === item.route;
          return (
            <Link
              key={item.route}
              href={item.route}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[60px] touch-manipulation transition-all duration-200 group ${
                isActive 
                  ? 'text-blue-500' 
                  : 'text-gray-400 active:text-blue-400'
              }`}
              aria-label={item.name}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-b-full" />
              )}
              
              {/* Icon container with background on active */}
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-500/20 scale-110' 
                  : 'bg-transparent group-active:bg-gray-700/50 group-active:scale-105'
              }`}>
                <Icon className={`w-6 h-6 transition-all duration-200 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Pulse animation for active state */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-blue-500/10 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

