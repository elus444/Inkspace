import { createContext, useState, useEffect, type ReactNode } from 'react';
import { type User } from '../types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const decodedToken: { userId: string, name: string, email: string } = jwtDecode(storedToken);
        setUser({ id: decodedToken.userId, name: "User", email: "user@example.com" }); // Note: Your JWT might not contain name/email. Adjust as needed.
        setToken(storedToken);
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    try {
      const decodedToken: { userId: string } = jwtDecode(newToken);
      setUser({ id: decodedToken.userId, name: "User", email: "user@example.com" });
      setToken(newToken);
    } catch (error) {
       console.error("Failed to decode token on login:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};