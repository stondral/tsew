"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "unauthorized" | "mismatch">("loading");
  const [error, setError] = useState("");
  const [invitedEmail, setInvitedEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No invitation token found.");
      return;
    }

    const acceptInvite = async () => {
      try {
        const res = await fetch("/api/seller/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          // Redirect after 3 seconds
          setTimeout(() => {
            router.push("/seller/dashboard");
          }, 3000);
        } else if (res.status === 401) {
          setStatus("unauthorized");
        } else if (res.status === 403) {
          setStatus("mismatch");
          setInvitedEmail(data.invitedEmail || "");
        } else {
          setStatus("error");
          setError(data.error || "Failed to accept invitation.");
        }
      } catch {
        setStatus("error");
        setError("An unexpected error occurred.");
      }
    };

    acceptInvite();
  }, [token, router]);

  const handleLogoutAndSwitch = async () => {
     try {
       await fetch('/api/users/logout', { method: 'POST' });
       window.location.href = `/auth?redirect=/seller/invite/accept?token=${token}`;
     } catch {
       router.push(`/auth?redirect=/seller/invite/accept?token=${token}`);
     }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="text-center bg-amber-500 text-white p-10">
          <div className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black">Team Invitation</CardTitle>
          <CardDescription className="text-amber-100">Joining a seller team on Stond Emporium</CardDescription>
        </CardHeader>
        <CardContent className="p-10 text-center">
          {status === "loading" && (
            <div className="space-y-6">
              <Loader2 className="h-12 w-12 text-amber-500 animate-spin mx-auto" />
              <p className="font-bold text-slate-600 dark:text-slate-300">Validating your invitation...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Invitation Accepted!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Welcome to the team. You are being redirected to your dashboard...
                </p>
              </div>
              <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-12 rounded-xl">
                <Link href="/seller/dashboard">Go to Dashboard Now</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="h-16 w-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Invalid Invitation</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{error}</p>
              </div>
              <Button asChild variant="outline" className="w-full border-slate-200 font-black h-12 rounded-xl">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          )}

          {status === "mismatch" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="h-16 w-16 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Email Mismatch</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                  This invitation was sent to <span className="font-bold text-slate-900 dark:text-white">{invitedEmail}</span>. 
                  You are currently logged in with a different account.
                </p>
              </div>
              <Button 
                onClick={handleLogoutAndSwitch}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-12 rounded-xl"
              >
                Switch Account
              </Button>
            </div>
          )}

          {status === "unauthorized" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <div className="h-20 w-20 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Users className="h-10 w-10 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Almost there!</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                    To join the team, you&apos;ll need a Stond Emporium account. <br/>
                  Please try registering again or contact support if the problem
                persists.
              </p>  </div>
              </div>
              
              <div className="grid gap-3 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-14 rounded-xl shadow-lg shadow-amber-500/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Link href={`/auth?redirect=/seller/invite/accept?token=${token}`}>Sign In to Accept</Link>
                </Button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-slate-50 dark:bg-slate-900 px-4 text-slate-400">OR</span></div>
                </div>

                <Button asChild variant="outline" className="w-full border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-500 font-black h-14 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-white dark:bg-slate-900">
                  <Link href={`/auth?redirect=/seller/invite/accept?token=${token}`}>Create New Account</Link>
                </Button>
              </div>

              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                 Step 1 of 2: Authentication
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center">
         <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
       </div>
    }>
      <ThemeProvider>
        <AcceptInviteInner />
      </ThemeProvider>
    </Suspense>
  );
}
