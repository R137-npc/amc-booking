import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useMachine } from '../../contexts/MachineContext';
import { 
  CpuChipIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const IMAAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings } = useBooking();
  const { machines } = useMachine();

  const confirmedBookings = bookings.filter(booking => booking.status === 'approved');
  const totalMachines = machines.length;
  const availableMachines = machines.filter(machine => machine.status === 'available');
  const maintenanceMachines = machines.filter(machine => machine.status === 'maintenance');

  const thisWeekBookings = confirmedBookings.filter(booking => {
    const bookingDate = new Date(booking.start_datetime);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return bookingDate >= weekStart && bookingDate <= weekEnd;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          IMA Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage resource availability and monitor institutional usage
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CpuChipIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Machines</p>
              <p className="text-2xl font-bold text-gray-900">{totalMachines}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week's Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{thisWeekBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{maintenanceMachines.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{availableMachines.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Schedule</h2>
        <div className="space-y-4">
          {thisWeekBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bookings this week</p>
              <p className="text-sm mt-1">All machines are available for institutional use</p>
            </div>
          ) : (
            thisWeekBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CpuChipIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Machine #{booking.machine_id}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.start_datetime).toLocaleDateString()} - {booking.booking_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Confirmed
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(booking.start_datetime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Machine Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Machines</h2>
          <div className="space-y-3">
            {availableMachines.map((machine) => (
              <div key={machine.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CpuChipIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{machine.name}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full hover:bg-yellow-200 transition-colors">
                    Schedule Training
                  </button>
                  <button className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full hover:bg-red-200 transition-colors">
                    Maintenance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Schedule</h2>
          <div className="space-y-3">
            {maintenanceMachines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <WrenchScrewdriverIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No maintenance scheduled</p>
                <p className="text-sm mt-1">All machines are operational</p>
              </div>
            ) : (
              maintenanceMachines.map((machine) => (
                <div key={machine.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <WrenchScrewdriverIcon className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{machine.name}</span>
                  </div>
                  <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors">
                    Mark Available
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IMAAdminDashboard;