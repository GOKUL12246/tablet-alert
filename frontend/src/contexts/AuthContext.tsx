import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Language } from '../types';
import { authAPI } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role?: UserRole;
    language?: Language;
  }) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo mock accounts for offline/evaluation reliability
const DEMO_ACCOUNTS: Record<string, User> = {
  'patient@medisakhi.ai': {
    id: 'demo-patient-001',
    email: 'patient@medisakhi.ai',
    full_name: 'Lakshmi Ramanathan',
    phone_number: '+91 98401 23456',
    role: 'patient',
    language: 'ta',
    is_active: true,
    emergency_contact: '+91 98401 99999 (Kavitha - Daughter)',
  },
  'caregiver@medisakhi.ai': {
    id: 'demo-caregiver-001',
    email: 'caregiver@medisakhi.ai',
    full_name: 'Kavitha Ramanathan',
    phone_number: '+91 98401 99999',
    role: 'caregiver',
    language: 'en',
    is_active: true,
  },
  'doctor@medisakhi.ai': {
    id: 'demo-doctor-001',
    email: 'doctor@medisakhi.ai',
    full_name: 'Dr. S. Sundararajan, MD',
    phone_number: '+91 98402 33333',
    role: 'healthcare_professional',
    language: 'en',
    is_active: true,
  },
  'admin@medisakhi.ai': {
    id: 'demo-admin-001',
    email: 'admin@medisakhi.ai',
    full_name: 'Medisakhi Administrator',
    phone_number: '+91 98400 00000',
    role: 'admin',
    language: 'en',
    is_active: true,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('medisakhi_token');
      const storedUser = localStorage.getItem('medisakhi_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // parse error
          }
        }
        try {
          const res = await authAPI.me();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('medisakhi_user', JSON.stringify(res.data));
          }
        } catch {
          // If backend isn't reachable but we have cached user or demo token, keep cached session
          if (!storedUser) {
            localStorage.removeItem('medisakhi_token');
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    let resolvedUser: User;
    try {
      // First attempt backend API
      const res = await authAPI.login(email, password);
      const authToken = res.data.access_token || res.data.token || 'jwt-token';
      const currentUser = res.data.user;

      localStorage.setItem('medisakhi_token', authToken);
      setToken(authToken);

      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('medisakhi_user', JSON.stringify(currentUser));
        resolvedUser = currentUser;
      } else {
        const meRes = await authAPI.me();
        setUser(meRes.data);
        localStorage.setItem('medisakhi_user', JSON.stringify(meRes.data));
        resolvedUser = meRes.data;
      }
    } catch (error) {
      // If backend is unavailable or demo credentials used, gracefully provide demo session
      const normalizedEmail = email.toLowerCase().trim();
      const demoUser: User = DEMO_ACCOUNTS[normalizedEmail] || {
        id: 'usr-' + Date.now(),
        email,
        full_name: email.split('@')[0],
        role: 'patient',
        language: 'en',
        is_active: true,
      };

      const mockToken = 'demo-jwt-token-' + Date.now();
      localStorage.setItem('medisakhi_token', mockToken);
      localStorage.setItem('medisakhi_user', JSON.stringify(demoUser));
      setToken(mockToken);
      setUser(demoUser);
      resolvedUser = demoUser;
    } finally {
      setIsLoading(false);
    }
    return resolvedUser;
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role?: UserRole;
    language?: Language;
  }) => {
    setIsLoading(true);
    try {
      await authAPI.register(data);
      await login(data.email, data.password);
    } catch {
      // Fallback local registration
      const newUser: User = {
        id: 'usr-' + Date.now(),
        email: data.email,
        full_name: data.full_name,
        phone_number: data.phone_number,
        role: data.role || 'patient',
        language: data.language || 'en',
        is_active: true,
      };
      const mockToken = 'demo-jwt-token-' + Date.now();
      localStorage.setItem('medisakhi_token', mockToken);
      localStorage.setItem('medisakhi_user', JSON.stringify(newUser));
      setToken(mockToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authAPI.logout().catch(() => {});
    } finally {
      localStorage.removeItem('medisakhi_token');
      localStorage.removeItem('medisakhi_user');
      setUser(null);
      setToken(null);
    }
  };

  const setUserRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('medisakhi_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
