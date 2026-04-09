import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: string; // GAS uses string IDs
  username: string;
  role: string;
  name: string;
  email?: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
  updateUser: (updatedUser: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
let memoryToken: string | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sessionStorage is acceptable as a fallback — cleared when tab closes
    const stored = sessionStorage.getItem('tcydo_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        memoryToken = parsed.token;
        setUser(parsed.user);
      } catch { sessionStorage.removeItem('tcydo_session'); }
    }
    setLoading(false);
  }, []);

  const login = (user: User, token: string) => {
    memoryToken = token;
    sessionStorage.setItem('tcydo_session',  JSON.stringify({ user, token }));
    setUser(user);
  };

  const logout = () => {
    memoryToken = null;
    sessionStorage.removeItem('tcydo_session');
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      sessionStorage.setItem('tcydo_session', JSON.stringify({ user: newUser, token: memoryToken }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
export function getToken() { return memoryToken; }