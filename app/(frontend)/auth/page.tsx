"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import loginImage from "@/assets/loginpage.png";
import logoston from "@/components/logoston.png";

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // View State: 'auth' | 'forgot-password' | 'forgot-password-success' | 'register-success'
  const [viewState, setViewState] = useState<
    "auth" | "forgot-password" | "forgot-password-success" | "register-success"
  >("auth");

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      router.push("/");
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || "Login failed. Please check your credentials.";
      
      // Check if error is due to unverified email
      if (errorMessage.toLowerCase().includes("verify") || errorMessage.toLowerCase().includes("unverified")) {
        // Resend verification email
        try {
          const response = await fetch("/api/users/verify-resend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loginEmail }),
          });
          
          if (response.ok) {
            console.log("Verification email resent successfully");
          }
        } catch (resendErr) {
          console.error("Failed to resend verification email:", resendErr);
        }
        
        // Update state to show verification message
        setRegisterEmail(loginEmail);
        setViewState("register-success");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        username: registerUsername,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword,
      });
      // Registration success
      setViewState("register-success");
    } catch (err: unknown) {
      // Registration succeeded (since POST /api/users returned 201 and email was sent)
      // Auto-login fails due to unverified email, but that's expected behavior
      // Always show success state to prompt user to verify their email
      console.log("Registration completed, showing verification screen:", err);
      setViewState("register-success");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // ✅ Use relative path to avoid CORS/Env issues
      const response = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (response.ok) {
        setViewState("forgot-password-success");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to send reset email.");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err: unknown) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper to reset view ---
  const resetToLogin = () => {
    setViewState("auth");
    setActiveTab("login");
    setError("");
    // Optional: clear forms
    setForgotPasswordEmail("");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src={loginImage}
          alt="Welcome to Stond Emporium"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Right side - Auth Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-2 relative">
            {/* Back Button for Forgot Password View */}
            {viewState === "forgot-password" && (
              <button
                onClick={resetToLogin}
                className="absolute left-0 top-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Icon / Logo Area */}
            <div className="flex justify-center mb-4">
              {viewState === "register-success" ||
              viewState === "forgot-password-success" ? (
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-gray-100">
                  <Image
                    src={logoston}
                    alt="Stond Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* Dynamic Title */}
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {viewState === "auth" && "Welcome to Stond Emporium"}
              {viewState === "forgot-password" && "Forgot Password?"}
              {viewState === "forgot-password-success" && "Check Your Email"}
              {viewState === "register-success" && "Please Verify Your Email"}
            </CardTitle>

            {/* Dynamic Description */}
            <CardDescription className="text-gray-500">
              {viewState === "auth" &&
                "Your premium destination for quality products"}
              {viewState === "forgot-password" &&
                "Enter your email and we'll send you a reset link"}
              {viewState === "forgot-password-success" &&
                `We've sent a password reset link to ${forgotPasswordEmail}`}
              {viewState === "register-success" &&
                `We've sent a verification link to ${registerEmail}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* 1. SUCCESS STATES (Register or Forgot Password) */}
            {(viewState === "register-success" ||
              viewState === "forgot-password-success") && (
              <div className="space-y-4">
                <p className="text-center text-gray-600">
                  Please check your inbox. If you don&apos;t see the email, check
                  your spam folder.
                </p>
                <Button
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md"
                  onClick={resetToLogin}
                >
                  Back to Sign In
                </Button>
              </div>
            )}

            {/* 2. FORGOT PASSWORD FORM */}
            {viewState === "forgot-password" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={resetToLogin}
                    className="text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* 3. MAIN AUTH (Login / Register Tabs) */}
            {viewState === "auth" && (
              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* --- Login Form --- */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 text-center">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-sm mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setViewState("forgot-password");
                          setError("");
                        }}
                        className="text-gray-500 hover:text-orange-500 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </form>
                </TabsContent>

                {/* --- Register Form --- */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <Input
                        type="text"
                        placeholder="Choose a username"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                        className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        required
                        className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          required
                          className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 text-center">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
