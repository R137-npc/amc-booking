import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CalendarDaysIcon, 
  CpuChipIcon, 
  ChartBarIcon, 
  UsersIcon,
  CreditCardIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
      { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
    ];

    if (user?.role === 'startup') {
      return [
        ...commonItems,
        { id: 'bookings', label: 'My Bookings', icon: ClockIcon },
        { id: 'tokens', label: 'Token Balance', icon: CreditCardIcon },
      ];
    }

    if (user?.role === 'amc_admin') {
      return [
        ...commonItems,
        { id: 'bookings', label: 'Booking Management', icon: ClockIcon },
        { id: 'users', label: 'User Management', icon: UsersIcon },
        { id: 'machines', label: 'Machine Management', icon: CpuChipIcon },
        { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
        { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
      ];
    }

    if (user?.role === 'ima_admin') {
      return [
        ...commonItems,
        { id: 'bookings', label: 'Booking Management', icon: ClockIcon },
        { id: 'machines', label: 'Manage Availability', icon: CpuChipIcon },
        { id: 'analytics', label: 'Reports', icon: DocumentTextIcon },
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full flex-shrink-0">
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;