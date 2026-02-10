"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import loginImage from "@/assets/loginpage.png";
import { useAuth } from "@/components/auth/AuthContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");
  const { refresh } = useAuth();

  const verificationInFlightRef = useRef(false);
  const completedTokenRef = useRef<string | null>(null);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    // Prevent double-firing in React Strict Mode
    if (completedTokenRef.current === token) return;
    if (verificationInFlightRef.current) return;

    setStatus("loading");
    setMessage("");

    verificationInFlightRef.current = true;
    const controller = new AbortController();

    const verifyEmail = async () => {
      try {
        // ✅ Changed to relative path. This automatically uses the current domain.
        const response = await fetch(`/api/users/verify/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          completedTokenRef.current = token;
          setStatus("success");
          setMessage("Your email has been verified successfully!");

          // Auto-login on this device if the server set an auth cookie
          if (data.loggedIn) {
            setIsAutoLoggingIn(true);
            setMessage("Logging you in automatically...");

            // Refresh auth context to load user data (cookie-based)
            await refresh();

            // Redirect to home page after a brief delay
            setTimeout(() => {
              router.push("/");
            }, 1200);
          }
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(
            data.message ||
              "Verification failed. The link may be expired or invalid.",
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      } finally {
        verificationInFlightRef.current = false;
      }
    };

    verifyEmail();

    return () => {
      controller.abort();
      verificationInFlightRef.current = false;
    };
  }, [token, refresh, router]);

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-2">
        <div className="flex justify-center mb-4">
          {status === "loading" && (
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          )}
          {status === "error" && (
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <XCircle className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {status === "loading" && "Verifying Email..."}
          {status === "success" && (isAutoLoggingIn ? "Logging You In..." : "Email Verified!")}
          {status === "error" && "Verification Failed"}
        </CardTitle>
        <CardDescription className="text-gray-500">
          {message || "Please wait while we verify your email address."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {status === "success" && !isAutoLoggingIn && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              You can now sign in to your account and start shopping!
            </p>
            <Button
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              onClick={() => router.push("/auth")}
            >
              Sign In
            </Button>
          </div>
        )}

        {status === "success" && isAutoLoggingIn && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-green-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to home page...</span>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Please try registering again or contact support if the problem
              persists.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => router.push("/auth")}
              >
                Back to Sign In
              </Button>
              {/* Optional: Add a register button if you have a register route */}
              {/* <Button className="..." onClick={() => router.push("/register")}>Register Again</Button> */}
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>This will only take a moment...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
// ✅ WRAPPER: Handles the Suspense boundary required for useSearchParams
export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src={loginImage}
          alt="Stond Emporium"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Right side - Verification Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <Suspense
          fallback={
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span>Loading verification...</span>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
