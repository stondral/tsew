"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  role: "admin" | "seller" | "user" | "sellerEmployee";
  plan?: "starter" | "pro" | "elite";
  subscriptionId?: string;
  subscriptionStatus?: "active" | "inactive" | "pending" | "cancelled";
  nextBillingDate?: string;
  billingCycle?: "monthly" | "yearly";
}

interface RegisterData {
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResult {
  sessionId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      // Payload returns { user, exp, token } (token may be omitted depending on config)
      setUser(data?.user ?? null);
    } catch (err) {
      console.error("AuthContext: fetchUser failed:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Login failed");
    }

    await fetchUser();
  };

  const register = async (registerData: RegisterData): Promise<RegisterResult> => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(registerData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.errors?.[0]?.message || data?.message || "Registration failed";
      throw new Error(message);
    }

    if (!data?.sessionId) {
      throw new Error("Registration succeeded but no verification session was created.");
    }

    // Do not auto-login here; email verification may be required.
    return { sessionId: data.sessionId as string };
  };

  const logout = async () => {
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  const refresh = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
