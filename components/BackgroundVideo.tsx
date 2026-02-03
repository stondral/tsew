"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function BackgroundVideo() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if video is already loaded (e.g. from cache)
    if (videoRef.current) {
      if (videoRef.current.readyState >= 3) {
        setIsVideoLoaded(true);
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen -z-50 overflow-hidden bg-black">
      {/* Placeholder Image */}
      <AnimatePresence>
        {!isVideoLoaded && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-10"
          >
            <Image
              src="/slide-screenshot.png"
              alt="Hero Preview"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Video */}
      <motion.video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setIsVideoLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVideoLoaded ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="w-full h-full object-cover"
      >
        <source src="/herovideo.mp4" type="video/mp4" />
      </motion.video>
      
      {/* Subtle Overlay to maintain contrast */}
      <div className="absolute inset-0 bg-black/40 z-[5]" />
    </div>
  );
}
