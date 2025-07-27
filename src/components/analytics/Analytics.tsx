import React from 'react';
import { useBooking } from '../../contexts/BookingContext';
import { useMachine } from '../../contexts/MachineContext';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CpuChipIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';

const Analytics: React.FC = () => {
  const { bookings } = useBooking();
  const { machines, machineTypes } = useMachine();

  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const totalTokensConsumed = approvedBookings.reduce((sum, b) => sum + b.tokens_consumed, 0);
  
  // Machine utilization analysis
  const machineUtilization = machines.map(machine => {
    const machineBookings = approvedBookings.filter(b => b.machine_id === machine.id);
    const totalHours = machineBookings.reduce((sum, booking) => {
      const start = new Date(booking.start_datetime);
      const end = new Date(booking.end_datetime);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    return {
      machine,
      bookings: machineBookings.length,
      totalHours,
      tokensGenerated: machineBookings.reduce((sum, b) => sum + b.tokens_consumed, 0)
    };
  });

  // Booking type distribution
  const bookingTypeStats = {
    weekly_planning: bookings.filter(b => b.booking_type === 'weekly_planning').length,
    same_week_exceptional: bookings.filter(b => b.booking_type === 'same_week_exceptional').length,
    monthly_provisional: bookings.filter(b => b.booking_type === 'monthly_provisional').length
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold">{bookings.length}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Approved Bookings</p>
                <p className="text-3xl font-bold">{approvedBookings.length}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Tokens Consumed</p>
                <p className="text-3xl font-bold">{totalTokensConsumed}</p>
              </div>
              <CpuChipIcon className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Active Machines</p>
                <p className="text-3xl font-bold">{machines.filter(m => m.status === 'available').length}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Machine Utilization */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Machine Utilization</h3>
          <div className="space-y-4">
            {machineUtilization.map((item) => (
              <div key={item.machine.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CpuChipIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.machine.name}</p>
                    <p className="text-sm text-gray-600">{item.bookings} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{item.totalHours.toFixed(1)} hours</p>
                  <p className="text-sm text-gray-600">{item.tokensGenerated} tokens</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Type Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weekly Planning</span>
                <span className="font-medium text-gray-900">{bookingTypeStats.weekly_planning}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Same Week Exceptional</span>
                <span className="font-medium text-gray-900">{bookingTypeStats.same_week_exceptional}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Provisional</span>
                <span className="font-medium text-gray-900">{bookingTypeStats.monthly_provisional}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-medium text-green-600">{bookings.filter(b => b.status === 'approved').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="font-medium text-red-600">{bookings.filter(b => b.status === 'rejected').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;