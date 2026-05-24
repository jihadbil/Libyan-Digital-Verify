import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, setAuthToken, setRefreshToken, getAuthToken, UserResponse } from "./api";

type AuthContextType = {
  user: UserResponse | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      authApi.me()
        .then((u) => setUser(u))
        .catch(() => {
          setAuthToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password);
    setAuthToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    setUser(res.user);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {}
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
