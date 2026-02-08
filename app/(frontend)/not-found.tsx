import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, FileQuestion } from "lucide-react";
import { GoBackButton } from "@/components/ui/go-back-button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center px-4 pt-24 pb-12 font-sans">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
            <div className="relative bg-white p-8 rounded-full shadow-2xl shadow-slate-200/50 border border-slate-100">
              <FileQuestion className="h-24 w-24 text-slate-300" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
          Page Not Found
        </h1>
        
        <p className="text-lg text-slate-600 mb-2 font-medium">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        
        <p className="text-sm text-slate-500 mb-12 max-w-md mx-auto">
          This could be because the page is no longer available, the link is incorrect, or it may have been moved to a different location.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30 rounded-2xl h-14 px-8 font-black text-sm uppercase tracking-wider gap-3 transition-all hover:scale-105"
            >
              <Home className="h-5 w-5" />
              Go to Homepage
            </Button>
          </Link>

          <Link href="/products">
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded-2xl h-14 px-8 font-black text-sm uppercase tracking-wider gap-3 transition-all hover:scale-105"
            >
              <Search className="h-5 w-5" />
              Browse Products
            </Button>
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-12">
          <GoBackButton />
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto opacity-40">
          <div className="h-2 bg-gradient-to-r from-transparent via-slate-200 to-transparent rounded-full" />
          <div className="h-2 bg-gradient-to-r from-transparent via-amber-200 to-transparent rounded-full" />
          <div className="h-2 bg-gradient-to-r from-transparent via-slate-200 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
}
