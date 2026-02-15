"use client";

export default function BackgroundVideo() {
  return (
    <div className="fixed inset-0 w-screen h-screen -z-50 overflow-hidden">
      {/* Ultra-fast gradient background - no loading required */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
      
      {/* Animated gradient overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/20 via-transparent to-blue-900/20 animate-pulse" 
           style={{ animationDuration: '8s' }} />
      
      {/* Subtle noise texture for depth */}
      <div className="absolute inset-0 opacity-[0.015]" 
           style={{ 
             backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
             backgroundRepeat: 'repeat'
           }} />
      
      {/* Contrast overlay */}
      <div className="absolute inset-0 bg-black/40 z-[5]" />
    </div>
  );
}
