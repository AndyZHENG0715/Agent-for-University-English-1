import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthState } from '../lib/types';
import { mockUsers } from '../lib/mock-data';

interface AuthContextType extends AuthState {
  login: (accessCode: string) => boolean;
  logout: () => void;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });

  const login = (accessCode: string): boolean => {
    const user = mockUsers.find(u => u.accessCode === accessCode);
    if (user) {
      setAuthState({
        user,
        isAuthenticated: true
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false
    });
  };

  const toggleRole = () => {
    if (authState.user) {
      const currentRole = authState.user.role;
      const newRole = currentRole === 'teacher' ? 'student' : 'teacher';
      
      // Find a user with the opposite role
      const newUser = mockUsers.find(u => u.role === newRole);
      if (newUser) {
        setAuthState({
          user: newUser,
          isAuthenticated: true
        });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
