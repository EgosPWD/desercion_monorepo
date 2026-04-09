import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  SessionData,
} from "../types/api";
import { login, register } from "../api/client";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "./session";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function toSessionData(response: AuthResponse): SessionData {
  return {
    token: response.access_token,
    user: response.user,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialSession = getStoredSession();

  const [user, setUser] = useState<AuthUser | null>(
    initialSession?.user ?? null,
  );
  const [token, setToken] = useState<string | null>(
    initialSession?.token ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const applySession = useCallback((session: SessionData) => {
    setStoredSession(session);
    setUser(session.user);
    setToken(session.token);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  const loginUser = useCallback(
    async (payload: LoginRequest) => {
      setIsLoading(true);
      try {
        const response = await login(payload);
        const session = toSessionData(response);
        applySession(session);
        return session.user;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession],
  );

  const registerUser = useCallback(
    async (payload: RegisterRequest) => {
      setIsLoading(true);
      try {
        const response = await register(payload);
        const session = toSessionData(response);
        applySession(session);
        return session.user;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login: loginUser,
      register: registerUser,
      logout,
    }),
    [user, token, isLoading, loginUser, registerUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
