import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useMachine } from '../../contexts/MachineContext';
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface NewBookingFormProps {
  onClose: () => void;
}

const NewBookingForm: React.FC<NewBookingFormProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { addBooking, bookings } = useBooking();
  const { machines, machineTypes } = useMachine();
  const [formData, setFormData] = useState({
    machine_id: '',
    start_date: '',
    start_time: '',
    end_time: '',
    booking_type: 'weekly_planning' as 'weekly_planning' | 'same_week_exceptional' | 'monthly_provisional',
    justification: ''
  });
  const [error, setError] = useState('');

  const availableMachines = machines.filter(m => m.status === 'available');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    // Validate form
    if (!formData.machine_id || !formData.start_date || !formData.start_time || !formData.end_time) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.booking_type === 'same_week_exceptional' && !formData.justification) {
      setError('Justification is required for same-week exceptional bookings');
      return;
    }

    // Calculate duration and tokens
    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDateTime = new Date(`${formData.start_date}T${formData.end_time}`);
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      setError('End time must be after start time');
      return;
    }

    if (durationHours > 8) {
      setError('Maximum booking duration is 8 hours');
      return;
    }

    const machine = machines.find(m => m.id === formData.machine_id);
    const tokensRequired = Math.ceil(durationHours * (machine?.custom_token_cost || 1));

    // Calculate actual remaining tokens from approved bookings
    const userBookings = bookings.filter(b => b.user_id === user.id && b.status === 'approved');
    const consumedTokens = userBookings.reduce((sum, b) => sum + b.tokens_consumed, 0);
    const actualRemainingTokens = user.tokens_given - consumedTokens;
    
    if (tokensRequired > actualRemainingTokens) {
      setError(`Insufficient tokens. Required: ${tokensRequired}, Available: ${actualRemainingTokens}`);
      return;
    }

    // Create booking
    addBooking({
      user_id: user.id,
      machine_id: formData.machine_id,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      booking_type: formData.booking_type,
      status: 'pending',
      justification: formData.justification || undefined,
      tokens_consumed: tokensRequired
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            New Booking Request
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine *
            </label>
            <select
              value={formData.machine_id}
              onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a machine</option>
              {availableMachines.map(machine => {
                return (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} ({machine.custom_token_cost || 1} tokens/hour)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Type *
            </label>
            <select
              value={formData.booking_type}
              onChange={(e) => setFormData({ ...formData, booking_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly_planning">Weekly Planning</option>
              <option value="same_week_exceptional">Same Week Exceptional</option>
              <option value="monthly_provisional">Monthly Provisional</option>
            </select>
          </div>

          {formData.booking_type === 'same_week_exceptional' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justification *
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please explain why this exceptional booking is needed..."
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBookingForm;