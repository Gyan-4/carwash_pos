'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  name: string;
  role: 'admin' | 'cashier';
}

interface AuthContextType {
  user: User | null;
  login: (name: string, role: 'admin' | 'cashier') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (name: string, role: 'admin' | 'cashier') => {
    setUser({ name, role });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}