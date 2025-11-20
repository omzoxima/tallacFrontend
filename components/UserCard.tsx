'use client';

import { MapPin } from 'lucide-react';

interface UserCardProps {
  user: any;
  isSelected?: boolean;
  viewMode?: 'card' | 'list';
  onClick?: () => void;
}

export default function UserCard({
  user,
  isSelected = false,
  viewMode = 'card',
  onClick,
}: UserCardProps) {
  const getStatusBorderClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'Active': 'border-transparent hover:border-green-500',
      'Inactive': 'border-transparent hover:border-red-500'
    };
    return statusMap[status] || 'border-transparent hover:border-gray-500';
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'Active': 'bg-green-600 text-white',
      'Inactive': 'bg-red-600 text-white'
    };
    return statusMap[status] || 'bg-gray-500 text-white';
  };

  const getRoleBadgeClass = (role: string) => {
    const roleMap: Record<string, string> = {
      'Corporate Admin': 'bg-red-600/20 text-red-300 border border-red-500/30',
      'Business Coach': 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
      'Territory Admin': 'bg-orange-600/20 text-orange-300 border border-orange-500/30',
      'Territory Manager': 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
      'Sales User': 'bg-green-600/20 text-green-300 border border-green-500/30'
    };
    return roleMap[role] || 'bg-gray-600/20 text-gray-300 border border-gray-500/30';
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`bg-gray-800 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl border-2 cursor-pointer p-4 grid gap-4 items-center ${
          getStatusBorderClass(user.status)
        } ${isSelected ? 'ring-2 ring-green-500 border-green-500' : 'border-gray-700'}`}
        style={{ gridTemplateColumns: '2.5fr 1fr 0.8fr' }}
      >
        {/* Column 1: User Info */}
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
            {getInitials(user.full_name || user.name || user.email)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-white truncate">
              {user.full_name || user.name || user.email || 'Unknown'}
            </h4>
            <p className="text-sm text-gray-400 truncate">{user.email || 'No email'}</p>
            {user.tallac_role && (
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${getRoleBadgeClass(user.tallac_role)}`}>
                {user.tallac_role}
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Territory Count */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white mb-1">{user.territory_count || 0}</p>
          <p className="text-xs text-gray-400 truncate">
            {user.territory_count === 1 ? 'Territory' : 'Territories'}
          </p>
        </div>

        {/* Column 3: Status */}
        <div className="min-w-0">
          {user.status ? (
            <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${getStatusBadgeClass(user.status)}`}>
              {user.status}
            </span>
          ) : (
            <span className="text-xs text-gray-500">-</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl border-2 cursor-pointer flex flex-col ${
        getStatusBorderClass(user.status)
      } ${isSelected ? 'ring-2 ring-green-500 border-green-500' : 'border-gray-700'}`}
    >
      <div className="p-4">
        {/* Header Row: Avatar + Info + Status */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar + Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-gray-700">
              {getInitials(user.full_name || user.name || user.email)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white truncate mb-0.5">
                {user.full_name || user.name || user.email || 'Unknown'}
              </h4>
              <p className="text-xs text-gray-400 truncate mb-2">{user.email || 'No email'}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {user.tallac_role && (
                  <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-md ${getRoleBadgeClass(user.tallac_role)}`}>
                    {user.tallac_role}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  {user.territory_count || 0} {user.territory_count === 1 ? 'Territory' : 'Territories'}
                </span>
              </div>
            </div>
          </div>
          {/* Status Badge */}
          {user.status && (
            <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(user.status)}`}>
              {user.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

