import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  addUser: (userData: Omit<User, 'id' | 'created_at'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getAllUsers: () => User[];
  setUserPassword: (email: string, password: string) => void;
  getUserById: (id: string) => User | undefined;
  syncData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Hamani AMC Admin',
    email: 'admin@hamani.amc',
    role: 'amc_admin',
    tokens_given: 0,
    tokens_consumed: 0,
    tokens_remaining: 0,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Ramzi IMA Admin',
    email: 'admin@ramzi.ima',
    role: 'ima_admin',
    tokens_given: 0,
    tokens_consumed: 0,
    tokens_remaining: 0,
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Central data management with versioning
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
    // Also save to a backup key with timestamp
    localStorage.setItem(STORAGE_KEY_PREFIX + key + '_backup', JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

const getStoredPasswords = () => {
  return getStoredData('userPasswords', {
    'admin@hamani.amc': 'AMC13719',
    'admin@ramzi.ima': 'IMA12345'
  });
};

const savePasswords = (passwords: { [email: string]: string }) => {
  saveStoredData('userPasswords', passwords);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(() => getStoredData('users', mockUsers));
  const [userPasswords, setUserPasswords] = useState<{ [email: string]: string }>(() => getStoredPasswords());

  // Save users whenever they change
  useEffect(() => {
    saveStoredData('users', users);
  }, [users]);

  // Save passwords whenever they change
  useEffect(() => {
    savePasswords(userPasswords);
  }, [userPasswords]);

  // Sync data across tabs/devices
  const syncData = () => {
    const latestUsers = getStoredData('users', mockUsers);
    const latestPasswords = getStoredPasswords();
    setUsers(latestUsers);
    setUserPasswords(latestPasswords);
  };

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith(STORAGE_KEY_PREFIX)) {
        syncData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Check for stored user session
    const storedUser = getStoredData('currentUser', null);
    if (storedUser) {
      // Verify user still exists in current user list
      const userExists = users.find(u => u.id === storedUser.id);
      if (userExists) {
        setUser(userExists);
      } else {
        // User was deleted, clear session
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'currentUser');
      }
    }
    setIsLoading(false);
  }, [users]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Sync latest data before login attempt
    syncData();
    const latestUsers = getStoredData('users', mockUsers);
    const latestPasswords = getStoredPasswords();
    
    // Mock authentication
    const foundUser = latestUsers.find(u => u.email === email);
    if (foundUser && latestPasswords[email] === password) {
      // Update last login
      const updatedUser = { ...foundUser, last_login: new Date().toISOString() };
      const updatedUsers = latestUsers.map(u => u.id === foundUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      saveStoredData('users', updatedUsers);
      
      setUser(updatedUser);
      saveStoredData('currentUser', updatedUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'currentUser');
  };

  const addUser = (userData: Omit<User, 'id' | 'created_at'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === id ? { ...user, ...updates } : user
      )
    );
    
    // Update current user session if it's the same user
    if (user && user.id === id) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      saveStoredData('currentUser', updatedUser);
    }
  };

  const deleteUser = (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    setUsers(prev => prev.filter(user => user.id !== id));
    
    // Remove password for deleted user
    if (userToDelete) {
      const newPasswords = { ...userPasswords };
      delete newPasswords[userToDelete.email];
      setUserPasswords(newPasswords);
      
      // If current user was deleted, log them out
      if (user && user.id === id) {
        logout();
      }
    }
  };

  const getAllUsers = () => users;

  const setUserPassword = (email: string, password: string) => {
    setUserPasswords(prev => ({ ...prev, [email]: password }));
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      addUser, 
      updateUser, 
      deleteUser, 
      getAllUsers,
      setUserPassword,
      getUserById,
      syncData
    }}>
      {children}
    </AuthContext.Provider>
  );
};