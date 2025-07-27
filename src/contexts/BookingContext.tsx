import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';

interface BookingContextType {
  bookings: Booking[];
  isLoading: boolean;
  addBooking: (booking: Omit<Booking, 'id' | 'created_at'>) => Promise<Booking>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  getBookingsByUser: (userId: string) => Promise<Booking[]>;
  getBookingsByMachine: (machineId: string) => Promise<Booking[]>;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bookings from Supabase
  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      setBookings(data as Booking[]);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize bookings
  useEffect(() => {
    loadBookings();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Booking change received:', payload);
          loadBookings(); // Refresh bookings on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newBooking = data as Booking;
      setBookings(prev => [newBooking, ...prev]);
      return newBooking;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === id ? { ...booking, ...updates } : booking
        )
      );
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  };

  const deleteBooking = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings(prev => prev.filter(booking => booking.id !== id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  };

  const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as Booking[];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
  };

  const getBookingsByMachine = async (machineId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('machine_id', machineId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as Booking[];
    } catch (error) {
      console.error('Error fetching machine bookings:', error);
      return [];
    }
  };

  const refreshBookings = async (): Promise<void> => {
    await loadBookings();
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      isLoading,
      addBooking,
      updateBooking,
      deleteBooking,
      getBookingsByUser,
      getBookingsByMachine,
      refreshBookings
    }}>
      {children}
    </BookingContext.Provider>
  );
};