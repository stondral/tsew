"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "seller" | "user";
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = "/auth",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath);
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Check if user has sufficient permissions
        if (requiredRole === "admin" && user?.role !== "admin") {
          router.push("/unauthorized");
          return;
        }
        if (
          requiredRole === "seller" &&
          !["admin", "seller"].includes(user?.role || "")
        ) {
          router.push("/unauthorized");
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Check role permissions
    if (requiredRole === "admin" && user?.role !== "admin") {
      return null; // Will redirect
    }
    if (
      requiredRole === "seller" &&
      !["admin", "seller"].includes(user?.role || "")
    ) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
}
