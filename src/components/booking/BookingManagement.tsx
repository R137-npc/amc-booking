import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useMachine } from '../../contexts/MachineContext';
import NewBookingForm from './NewBookingForm';
import { 
  PlusIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const BookingManagement: React.FC = () => {
  const { user, getUserById } = useAuth();
  const { bookings, updateBooking, deleteBooking } = useBooking();
  const { machines, machineTypes } = useMachine();
  const [showNewBookingForm, setShowNewBookingForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [machineFilter, setMachineFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const userBookings = user?.role === 'startup' 
    ? bookings.filter(booking => booking.user_id === user.id)
    : bookings;

  // Apply filters
  let filteredBookings = userBookings.filter(booking => {
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
    if (machineFilter !== 'all' && booking.machine_id !== machineFilter) return false;
    if (typeFilter !== 'all' && booking.booking_type !== typeFilter) return false;
    return true;
  });

  // Apply sorting
  if (sortConfig) {
    filteredBookings = [...filteredBookings].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'machine':
          const aMachine = machines.find(m => m.id === a.machine_id);
          const bMachine = machines.find(m => m.id === b.machine_id);
          aValue = aMachine?.name || '';
          bValue = bMachine?.name || '';
          break;
        case 'type':
          aValue = a.booking_type;
          bValue = b.booking_type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'tokens':
          aValue = a.tokens_consumed;
          bValue = b.tokens_consumed;
          break;
        case 'user':
          const aUser = getUserById(a.user_id);
          const bUser = getUserById(b.user_id);
          aValue = aUser?.name || '';
          bValue = bUser?.name || '';
          break;
        case 'submitted':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'date':
          aValue = new Date(a.start_datetime).getTime();
          bValue = new Date(b.start_datetime).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  } else {
    // Default sort by newest first
    filteredBookings = [...filteredBookings].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4 inline ml-1" /> : 
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'rejected': return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-gray-600" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleApprove = (bookingId: string) => {
    updateBooking(bookingId, { 
      status: 'approved',
      approved_by: user?.id 
    });
  };

  const handleReject = (bookingId: string) => {
    updateBooking(bookingId, { 
      status: 'rejected',
      approved_by: user?.id 
    });
  };

  const handleCancel = (bookingId: string) => {
    if (user?.role === 'startup') {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking?.status === 'pending') {
        deleteBooking(bookingId);
      } else {
        updateBooking(bookingId, { status: 'cancelled' });
      }
    } else {
      updateBooking(bookingId, { status: 'cancelled' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'startup' ? 'My Bookings' : 'Bookings'}
          </h1>
          <button
            onClick={() => setShowNewBookingForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Booking
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select 
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Machines</option>
            {machines.map(machine => (
              <option key={machine.id} value={machine.id}>{machine.name}</option>
            ))}
          </select>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="weekly_planning">Weekly Planning</option>
            <option value="same_week_exceptional">Same Week Exceptional</option>
            <option value="monthly_provisional">Monthly Provisional</option>
          </select>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSort('machine')}
                >
                  Machine {getSortIcon('machine')}
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSort('date')}
                >
                  Date & Time {getSortIcon('date')}
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSort('type')}
                >
                  Type {getSortIcon('type')}
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSort('tokens')}
                >
                  Tokens {getSortIcon('tokens')}
                </th>
                {user?.role !== 'startup' && (
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    onClick={() => handleSort('user')}
                  >
                    Startup {getSortIcon('user')}
                  </th>
                )}
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSort('submitted')}
                >
                  Submitted {getSortIcon('submitted')}
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => {
                const machine = machines.find(m => m.id === booking.machine_id);
                const bookingUser = getUserById(booking.user_id);
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {machine?.name || 'Unknown Machine'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.start_datetime).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.start_datetime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(booking.end_datetime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {booking.booking_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(booking.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.tokens_consumed}
                    </td>
                    {user?.role !== 'startup' && (
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bookingUser?.name || 'Unknown User'}
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user?.role !== 'startup' && booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(booking.id)}
                              className="text-green-600 hover:text-green-900 transition-colors text-xs sm:text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(booking.id)}
                              className="text-red-600 hover:text-red-900 transition-colors text-xs sm:text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {((user?.role === 'startup' && booking.status === 'pending') || user?.role !== 'startup') && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-red-600 hover:text-red-900 transition-colors text-xs sm:text-sm"
                          >
                            {user?.role === 'startup' ? 'Cancel' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {userBookings.length === 0 ? 'No bookings found' : 'No bookings match the current filters'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {user?.role === 'startup' ? 'Create your first booking to get started' : 'No bookings in the system'}
            </p>
          </div>
        )}
      </div>

      {showNewBookingForm && (
        <NewBookingForm onClose={() => setShowNewBookingForm(false)} />
      )}
    </div>
  );
};

export default BookingManagement;