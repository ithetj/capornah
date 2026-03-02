'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        // Get user stats for level display
        const { data: stats } = await supabase
          .from('user_stats')
          .select('level, level_name, streak_days')
          .eq('user_id', user.id)
          .single();

        setUserStats(stats);
      }
    }
    checkAuth();
  }, []);

  // Don't show nav on result pages or timeline (they have their own navigation)
  if (pathname?.startsWith('/result/') || pathname === '/timeline') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => router.push('/')}
          className="text-2xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition"
        >
          CAPORNAH
        </button>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* User Stats Badge */}
              {userStats && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-white/60">Level</div>
                  <div className="text-sm font-bold text-pink-400">{userStats.level}</div>
                  {userStats.streak_days > 0 && (
                    <>
                      <div className="w-px h-4 bg-white/20"></div>
                      <div className="text-sm">🔥 {userStats.streak_days}</div>
                    </>
                  )}
                </div>
              )}

              {/* Timeline Button */}
              <button
                onClick={() => router.push('/timeline')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition border border-white/20 hover:border-white/40 text-sm font-medium"
              >
                📊 <span className="hidden sm:inline">Timeline</span>
              </button>

              {/* Go Pro Button */}
              <button
                onClick={() => router.push('/pricing')}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-bold transition text-sm shadow-lg shadow-pink-500/20"
              >
                ⚡ <span className="hidden sm:inline">Go Pro</span>
              </button>
            </>
          ) : (
            <>
              {/* Pricing Link */}
              <button
                onClick={() => router.push('/pricing')}
                className="px-4 py-2 text-white/80 hover:text-white transition text-sm font-medium"
              >
                Pricing
              </button>

              {/* Sign In Button */}
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-bold transition text-sm"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}