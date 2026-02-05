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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("payload-token");
      console.log(
        "AuthContext: Checking for token...",
        token ? "Found" : "Not found",
      );

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const baseUrl = (typeof window !== "undefined") ? "" : (process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000");
      const response = await fetch(
        `${baseUrl}/api/users/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
          },
          credentials: "include",
        },
      );

      console.log(
        "AuthContext: /api/users/me response status:",
        response.status,
      );
      console.log("AuthContext: /api/users/me response ok:", response.ok);

      if (response.ok) {
        const userData = await response.json();
        console.log("AuthContext: User data loaded", userData.user);
        setUser(userData.user);
      } else {
        console.log("AuthContext: Token invalid, removing");
        const errorText = await response.text();
        console.error("AuthContext: Error response:", errorText);
        // Token is invalid, remove it
        localStorage.removeItem("payload-token");
        setUser(null);
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const baseUrl = (typeof window !== "undefined") ? "" : (process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000");
    const response = await fetch(
      `${baseUrl}/api/users/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (data.token) {
      localStorage.setItem("payload-token", data.token);
      await fetchUser();
    }
  };

  const register = async (registerData: RegisterData) => {
    const baseUrl = (typeof window !== "undefined") ? "" : (process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000");
    const response = await fetch(
      `${baseUrl}/api/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          phone: registerData.phone,
          password: registerData.password,
          role: "user", // Default role
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
        // Payload validation errors often come in an 'errors' array
        const message = data.errors?.[0]?.message || data.message || "Registration failed";
        throw new Error(message);
    }

    // Auto login after registration
    // We try to log in, but if it fails (e.g. because email verification is required),
    // we should NOT throw an error, because registration itself was successful.
    try {
        await login(registerData.email, registerData.password);
    } catch (err) {
        console.warn("Auto-login failed after registration (likely due to email verification):", err);
        // Do NOT throw here. Let the UI proceed to the "Success / Verify Email" view.
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("payload-token");
      const baseUrl = (typeof window !== "undefined") ? "" : (process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000");
      if (token) {
        await fetch(`${baseUrl}/api/users/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
          },
          credentials: "include",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("payload-token");
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
