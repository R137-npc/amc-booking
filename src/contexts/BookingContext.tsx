import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Booking } from '../types';

// Use the same storage system as AuthContext
const STORAGE_VERSION = '1.0';
const STORAGE_KEY_PREFIX = 'amc_booking_system_v' + STORAGE_VERSION + '_';

const getStoredData = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Error loading stored data:', error);
    return defaultValue;
  }
};

const saveStoredData = (key: string, data: any) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'created_at'>) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  getBookingsByUser: (userId: string) => Booking[];
  getBookingsByMachine: (machineId: string) => Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

// Mock bookings data
const mockBookings: Booking[] = [];

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(() => getStoredData('bookings', mockBookings));

  // Save to localStorage whenever bookings change
  useEffect(() => {
    saveStoredData('bookings', bookings);
  }, [bookings]);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'created_at'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === id ? { ...booking, ...updates } : booking
      )
    );
    
    // Update user token consumption when booking status changes
    const booking = bookings.find(b => b.id === id);
    if (booking && updates.status) {
      // This will trigger a recalculation of user tokens in the auth context
      const event = new CustomEvent('bookingStatusChanged', { 
        detail: { userId: booking.user_id, bookingId: id, newStatus: updates.status }
      });
      window.dispatchEvent(event);
    }
  };

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(booking => booking.id !== id));
  };

  const getBookingsByUser = (userId: string) => {
    return bookings.filter(booking => booking.user_id === userId);
  };

  const getBookingsByMachine = (machineId: string) => {
    return bookings.filter(booking => booking.machine_id === machineId);
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      addBooking,
      updateBooking,
      deleteBooking,
      getBookingsByUser,
      getBookingsByMachine
    }}>
      {children}
    </BookingContext.Provider>
  );
};