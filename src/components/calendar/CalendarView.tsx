import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useMachine } from '../../contexts/MachineContext';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon,
  XMarkIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const CalendarView: React.FC = () => {
  const { user, getUserById } = useAuth();
  const { bookings } = useBooking();
  const { machines, machineTypes } = useMachine();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
  // Filter states
  const [selectedStartup, setSelectedStartup] = useState('all');
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get week days
  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Generate hours (8 AM to 6 PM)
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);

  const weekStart = getWeekStart(currentWeek);
  const weekDays = getWeekDays(weekStart);

  // Get unique startups for filtering (admin only)
  const startups = useMemo(() => {
    if (user?.role === 'startup') return [];
    const uniqueStartups = [...new Set(bookings.map(b => b.user_id))];
    return uniqueStartups.map(id => ({ id, name: `Startup ${id}` }));
  }, [bookings, user?.role]);

  // Filter bookings based on selected filters
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // For startup users, only show their own bookings
    if (user?.role === 'startup') {
      filtered = filtered.filter(booking => booking.user_id === user.id);
    } else {
      // For admins, apply startup filter
      if (selectedStartup !== 'all') {
        filtered = filtered.filter(booking => booking.user_id === selectedStartup);
      }
    }

    // Apply machine filter
    if (selectedMachine !== 'all') {
      filtered = filtered.filter(booking => booking.machine_id === selectedMachine);
    }

    return filtered;
  }, [bookings, selectedStartup, selectedMachine, user]);

  // Get bookings for a specific day and hour
  const getBookingsForSlot = (date: Date, hour: number) => {
    const dayStr = date.toISOString().split('T')[0];
    
    return filteredBookings.filter(booking => {
      const bookingStart = new Date(booking.start_datetime);
      const bookingEnd = new Date(booking.end_datetime);
      const bookingDate = bookingStart.toISOString().split('T')[0];
      const bookingStartHour = bookingStart.getHours();
      const bookingEndHour = bookingEnd.getHours();
      
      return bookingDate === dayStr && hour >= bookingStartHour && hour < bookingEndHour;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(currentWeek.getDate() - 7);
    } else {
      newWeek.setDate(currentWeek.getDate() + 7);
    }
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const handleSlotClick = (bookings: any[], date: Date, hour: number) => {
    if (bookings.length > 0) {
      setSelectedBooking({ bookings, date, hour });
      setShowBookingDetails(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-800';
      case 'pending': return 'text-yellow-800';
      case 'rejected': return 'text-red-800';
      case 'cancelled': return 'text-gray-800';
      default: return 'text-gray-800';
    }
  };

  const formatWeekRange = () => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return `${weekStart.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${weekEnd.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getCurrentHour = () => {
    return new Date().getHours();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Weekly Calendar</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {formatWeekRange()}
            </h2>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Startup Filter (Admin only) */}
              {user?.role !== 'startup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Startup
                  </label>
                  <select
                    value={selectedStartup}
                    onChange={(e) => setSelectedStartup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Startups</option>
                    {startups.map(startup => (
                      <option key={startup.id} value={startup.id}>
                        {startup.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Machine Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Machine
                </label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Machines</option>
                  {machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedStartup('all');
                    setSelectedMachine('all');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <div className="min-w-[900px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
                Time
              </div>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`p-3 text-center text-sm font-medium rounded-lg ${
                    isToday(day)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-semibold">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs mt-1 hidden sm:block">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs mt-1 sm:hidden">
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                {/* Time Column */}
                <div className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="hidden sm:inline">{hour}:00</span>
                  <span className="sm:hidden">{hour}</span>
                </div>
                
                {/* Day Columns */}
                {weekDays.map((day, dayIndex) => {
                  const slotBookings = getBookingsForSlot(day, hour);
                  const isCurrentHour = isToday(day) && hour === getCurrentHour();
                  
                  return (
                    <div
                      key={dayIndex}
                      onClick={() => handleSlotClick(slotBookings, day, hour)}
                      className={`min-h-[60px] p-1 border rounded-lg transition-all cursor-pointer ${
                        isCurrentHour
                          ? 'ring-2 ring-blue-400 bg-blue-50'
                          : 'hover:bg-gray-50'
                      } ${
                        slotBookings.length > 0 ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <div className="space-y-1">
                        {slotBookings.map(booking => {
                          const machine = machines.find(m => m.id === booking.machine_id);
                          const bookingUser = getUserById(booking.user_id);
                          return (
                            <div
                              key={booking.id}
                              className={`text-xs p-1 rounded text-white truncate ${getStatusColor(booking.status)}`}
                              title={`${machine?.name || 'Unknown'} - ${booking.status} - ${bookingUser?.name || 'Unknown User'}`}
                            >
                              <div className="truncate">{machine?.name || 'Unknown'}</div>
                              {user?.role !== 'startup' && (
                                <div className="text-xs opacity-75 truncate">
                                  {bookingUser?.name || 'Unknown'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Approved Bookings</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">Pending Bookings</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Rejected/Cancelled</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
            <span className="text-sm text-gray-700">Current Time</span>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                {selectedBooking.date.toLocaleDateString()} at {selectedBooking.hour}:00
              </h3>
              <button
                onClick={() => setShowBookingDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedBooking.bookings.map((booking: any) => {
                const machine = machines.find(m => m.id === booking.machine_id);
                const machineType = machineTypes.find(mt => mt.id === machine?.machine_type_id);
                const startTime = new Date(booking.start_datetime);
                const endTime = new Date(booking.end_datetime);
                
                return (
                  <div key={booking.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{machine?.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <strong>Time:</strong> {startTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {endTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      <div>
                        <strong>Type:</strong> {machineType?.name}
                      </div>
                      
                      <div>
                        <strong>Booking Type:</strong> {booking.booking_type.replace('_', ' ')}
                      </div>
                      
                      <div>
                        <strong>Tokens:</strong> {booking.tokens_consumed}
                      </div>
                      
                      {user?.role !== 'startup' && (
                        <div>
                          <strong>Startup:</strong> {getUserById(booking.user_id)?.name || 'Unknown User'}
                        </div>
                      )}
                      
                      {booking.justification && (
                        <div>
                          <strong>Justification:</strong> {booking.justification}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;