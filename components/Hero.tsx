"use client";

import { motion } from "framer-motion";
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
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1 text-sm font-medium text-accent mb-6 backdrop-blur">
              <Sparkles className="mr-2 h-4 w-4" />
              Discover India’s Innovation
            </div>

            <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight mb-6 text-white">
              Curated Products from <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
                Top Indian Startups
              </span>
            </h1>

            <p className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1 text-sm font-medium text-accent mb-6 backdrop-blur">
              Premium, innovative, and sustainable products — proudly made in
              India.
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
