'use client';

import { useState } from 'react';
import ScanForm from '@/components/ScanForm';
import ScanAnimation from '@/components/ScanAnimation';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b0b14] to-black" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {isAnalyzing ? (
          <ScanAnimation />
        ) : (
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-6xl font-black">
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  CAPORNAH
                </span>
              </h1>
              <p className="text-xl text-white/80">
                Scan the vibes. Skip the BS.
              </p>
            </div>

            <ScanForm onLoading={setIsAnalyzing} />

            <div className="mt-8 text-center text-white/40 text-sm">
              🎭 Entertainment only. Not actual lie detection.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}