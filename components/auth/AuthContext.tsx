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

      // ✅ Ensure token is also set as cookie for server-side middleware
      if (typeof window !== 'undefined') {
        const expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `payload-token=${token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
        console.log("AuthContext: Token set as cookie");
      }

      // ✅ Decode JWT token locally to verify it's valid
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
          );
          
          // Verify token expiration
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn("AuthContext: Token expired");
            localStorage.removeItem("payload-token");
            document.cookie = "payload-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setUser(null);
            setIsLoading(false);
            return;
          }

          // Token is valid, set basic user info from token
          const basicUser: User = {
            id: payload.id,
            email: payload.email,
            username: payload.email,
            role: payload.role || 'user',
          };
          
          console.log("AuthContext: Token decoded successfully, user:", basicUser.id);
          setUser(basicUser);
          setIsLoading(false);
          
          // Try to fetch full user details from Payload but don't fail if it doesn't work
          try {
            const baseUrl = (typeof window !== "undefined") ? "" : (process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000");
            const response = await fetch(
              `${baseUrl}/api/users/${payload.id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `JWT ${token}`,
                },
                credentials: "include",
              },
            );

            if (response.ok) {
              const userData = await response.json();
              console.log("AuthContext: Full user data loaded", userData);
              setUser(userData);
            }
          } catch (err) {
            console.debug("AuthContext: Could not fetch full user details, using token data", err);
            // Continue with basic user from token
          }
        } else {
          throw new Error('Invalid token format');
        }
      } catch (decodeErr) {
        console.error("AuthContext: Token decode failed:", decodeErr);
        localStorage.removeItem("payload-token");
        document.cookie = "payload-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUser(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("AuthContext: fetchUser error:", error);
      setUser(null);
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
      // ✅ Store in localStorage for client-side usage
      localStorage.setItem("payload-token", data.token);
      
      // ✅ Also set as cookie for server-side middleware (client-side JS can set cookies)
      if (typeof window !== 'undefined') {
        // Set cookie for 7 days
        const expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `payload-token=${data.token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
        console.log('✅ Token stored in localStorage and cookie');
      }
      
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
      
      // ✅ Also clear the cookie
      if (typeof window !== 'undefined') {
        document.cookie = "payload-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        console.log('✅ Token cleared from localStorage and cookie');
      }
      
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
