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

interface TokenPayload {
  userId: string;
  exp?: number; // seconds since epoch, standard JWT claim
}

/** `jwtDecode` only decodes -- it never checks the signature or expiry, so
 *  without this a token that expired days ago would still read as "valid"
 *  here and the UI would show the user as logged in until their first API
 *  call 401s (there was previously no code path that ever caught that). */
function isExpired(payload: TokenPayload): boolean {
  return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode<TokenPayload>(storedToken);
        if (isExpired(decodedToken)) {
          localStorage.removeItem('authToken');
        } else {
          // Note: the JWT only carries userId -- name/email aren't in it,
          // so real values come from GET /api/auth/users?ids= wherever a
          // page actually needs to display them, not from this context.
          setUser({ id: decodedToken.userId, name: 'User', email: 'user@example.com' });
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false);

    // A response interceptor (see api/axios.ts) clears the token and
    // dispatches this on any 401 -- catches a token expiring mid-session,
    // not just the page-load case above.
    const onUnauthorized = () => {
      localStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = (newToken: string) => {
    try {
      const decodedToken = jwtDecode<TokenPayload>(newToken);
      if (isExpired(decodedToken)) {
        console.error('Received an already-expired token on login');
        return;
      }
      localStorage.setItem('authToken', newToken);
      setUser({ id: decodedToken.userId, name: 'User', email: 'user@example.com' });
      setToken(newToken);
    } catch (error) {
      console.error('Failed to decode token on login:', error);
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
