import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useMachine } from '../../contexts/MachineContext';
import { 
  CalendarDaysIcon, 
  CreditCardIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const StartupDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings } = useBooking();
  const { machines } = useMachine();

  const userBookings = bookings.filter(booking => booking.user_id === user?.id);
  const pendingBookings = userBookings.filter(booking => booking.status === 'pending');
  const confirmedBookings = userBookings.filter(booking => booking.status === 'approved');
  const rejectedBookings = userBookings.filter(booking => booking.status === 'rejected');

  const totalTokensConsumed = confirmedBookings
    .reduce((sum, booking) => sum + booking.tokens_consumed, 0);

  const actualTokensRemaining = user ? user.tokens_given - totalTokensConsumed : 0;

  // Get upcoming bookings (next 7 days)
  const upcomingBookings = userBookings
    .filter(booking => {
      const bookingDate = new Date(booking.start_datetime);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return bookingDate >= today && bookingDate <= nextWeek && booking.status === 'approved';
    })
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Manage your machine bookings and track your token usage
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{confirmedBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tokens Remaining</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{actualTokensRemaining}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tokens Used</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalTokensConsumed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirmed Bookings</h2>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => {
              const machine = machines.find(m => m.id === booking.machine_id);
              const bookingDate = new Date(booking.start_datetime);
              const isToday = bookingDate.toDateString() === new Date().toDateString();
              
              return (
                <div key={booking.id} className={`p-4 rounded-lg border-l-4 ${
                  isToday ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{machine?.name}</p>
                      <p className="text-sm text-gray-600">
                        {bookingDate.toLocaleDateString()} at {bookingDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        isToday ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isToday ? 'Today' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StartupDashboard;