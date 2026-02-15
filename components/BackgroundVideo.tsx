"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function BackgroundVideo() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lazy-load video AFTER page is interactive (doesn't block LCP/FCP)
  useEffect(() => {
    // Wait for page to be fully interactive before loading video
    if (typeof window === "undefined") return;

    const startLoading = () => setShouldLoad(true);

    // Use requestIdleCallback if available, else setTimeout
    if ("requestIdleCallback" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).requestIdleCallback(startLoading);
    } else {
      setTimeout(startLoading, 1000);
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen -z-50 overflow-hidden">
      {/* Instant gradient placeholder - renders in 0ms */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/20 via-transparent to-blue-900/20 animate-pulse"
           style={{ animationDuration: '8s' }} />

      {/* Lazy-loaded video - only starts downloading after page is interactive */}
      {shouldLoad && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={handleCanPlay}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: isVideoReady ? 1 : 0 }}
        >
          <source src="/herovideo.mp4" type="video/mp4" />
        </video>
      )}

      {/* Contrast overlay */}
      <div className="absolute inset-0 bg-black/40 z-[5]" />
    </div>
  );
}
