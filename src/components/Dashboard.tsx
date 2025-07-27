import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import StartupDashboard from './dashboard/StartupDashboard';
import AMCAdminDashboard from './dashboard/AMCAdminDashboard';
import IMAAdminDashboard from './dashboard/IMAAdminDashboard';
import CalendarView from './calendar/CalendarView';
import BookingManagement from './booking/BookingManagement';
import TokenManagement from './tokens/TokenManagement';
import UserManagement from './admin/UserManagement';
import MachineManagement from './admin/MachineManagement';
import Analytics from './analytics/Analytics';
import Settings from './settings/Settings';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (user?.role === 'startup') return <StartupDashboard />;
        if (user?.role === 'amc_admin') return <AMCAdminDashboard />;
        if (user?.role === 'ima_admin') return <IMAAdminDashboard />;
        return <div>Dashboard</div>;
      case 'calendar':
        return <CalendarView />;
      case 'bookings':
        return <BookingManagement />;
      case 'tokens':
        return <TokenManagement />;
      case 'users':
        return user?.role === 'amc_admin' ? <UserManagement /> : <div>Access Denied</div>;
      case 'machines':
        return (user?.role === 'amc_admin' || user?.role === 'ima_admin') ? <MachineManagement /> : <div>Access Denied</div>;
      case 'analytics':
        return (user?.role === 'amc_admin' || user?.role === 'ima_admin') ? <Analytics /> : <div>Access Denied</div>;
      case 'settings':
        return user?.role === 'amc_admin' ? <Settings /> : <div>Access Denied</div>;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;