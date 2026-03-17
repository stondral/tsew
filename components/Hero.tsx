"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import BackgroundVideo from "./BackgroundVideo";

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      <BackgroundVideo />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-white mb-8 backdrop-blur" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              <Sparkles className="mr-2 h-4 w-4 text-orange-500" />
              Featured Innovations
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tighter mb-8 text-white leading-[1.1]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Curated Products from <br />
              <span className="text-orange-500">
                Top Indian Startups
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl font-display font-medium text-white/60 mb-12 max-w-2xl leading-relaxed tracking-tight" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Premium, innovative, and sustainable products — <br className="hidden md:block" />
              proudly made in India for the global stage.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="rounded-full text-lg px-8 h-14">
                  Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/about-us">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full text-lg px-8 h-14 bg-white/10 backdrop-blur"
                >
                  Meet the Makers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
