import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useMachine } from '../../contexts/MachineContext';
import { 
  UsersIcon, 
  CpuChipIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const AMCAdminDashboard: React.FC = () => {
  const { user, getUserById } = useAuth();
  const { bookings } = useBooking();
  const { machines, machineTypes } = useMachine();
  const { updateBooking } = useBooking();

  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const totalBookings = bookings.length;
  const approvedBookings = bookings.filter(booking => booking.status === 'approved');
  const rejectedBookings = bookings.filter(booking => booking.status === 'rejected');

  const availableMachines = machines.filter(machine => machine.status === 'available');
  const maintenanceMachines = machines.filter(machine => machine.status === 'maintenance');

  const totalTokensConsumed = approvedBookings.reduce((sum, booking) => sum + booking.tokens_consumed, 0);

  const handleApproveBooking = (bookingId: string) => {
    updateBooking(bookingId, { 
      status: 'approved',
      approved_by: user?.id 
    });
  };

  const handleRejectBooking = (bookingId: string) => {
    updateBooking(bookingId, { 
      status: 'rejected',
      approved_by: user?.id 
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AMC Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage users, approve bookings, and monitor system usage
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CpuChipIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Machines</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{availableMachines.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tokens Consumed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalTokensConsumed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            {pendingBookings.length} pending
          </span>
        </div>
        <div className="space-y-4">
          {pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No pending approvals</p>
              <p className="text-sm mt-1">All bookings are up to date</p>
            </div>
          ) : (
            pendingBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <ClockIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      Machine #{booking.machine_id} - {booking.booking_type}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {new Date(booking.start_datetime).toLocaleDateString()} - {booking.tokens_consumed} tokens
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleApproveBooking(booking.id)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleRejectBooking(booking.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Machine Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Machine Status</h2>
        <div className="space-y-4">
          {machineTypes.map((type) => {
            const typeMachines = machines.filter(m => m.machine_type_id === type.id);
            const availableCount = typeMachines.filter(m => m.status === 'available').length;
            const maintenanceCount = typeMachines.filter(m => m.status === 'maintenance').length;
            const offlineCount = typeMachines.filter(m => m.status === 'offline').length;
            
            return (
              <div key={type.id} className="p-4 border rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{type.name}</h3>
                  <span className="text-sm text-gray-600 mt-1 sm:mt-0">{typeMachines.length} total</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-green-600">{availableCount}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-yellow-600">{maintenanceCount}</div>
                    <div className="text-xs text-gray-600">Maintenance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-red-600">{offlineCount}</div>
                    <div className="text-xs text-gray-600">Offline</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AMCAdminDashboard;