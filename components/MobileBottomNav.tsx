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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50">
      <div className="flex items-center justify-around h-16">
        {visibleNavItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
          return (
            <Link
              key={item.route}
              href={item.route}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                pathname === item.route ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

