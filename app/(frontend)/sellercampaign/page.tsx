import React from 'react';

export default function SellerCampaignPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
            STOND <span className="text-amber-500">EMPORIUM</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm md:text-base uppercase tracking-[0.2em]">
            Seller Campaign Presentation
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl">
            <iframe 
              src="https://gamma.app/embed/s83wz47rcc7hv01" 
              style={{ width: '100%', height: '600px', border: 'none' }} 
              allow="fullscreen" 
              title="STOND EMPORIUM"
              className="w-full"
            ></iframe>
          </div>
        </div>

        <div className="pt-8">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
            Explore our vision for the future of commerce
          </p>
        </div>
      </div>
    </div>
  );
}
