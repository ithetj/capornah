'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';
import { createClient } from '@/lib/supabase/client';

interface BlurredResultProps {
  score: number;
  scanId: string;
}

export default function BlurredResult({ score, scanId }: BlurredResultProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'onetime'>('onetime');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    }
    checkAuth();
  }, []);

  const handleCheckout = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          scanId: scanId,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) {
        alert(error);
        setLoading(false);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      alert('Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b0b14] to-black" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mx-auto w-full max-w-3xl space-y-6"
      >
        {/* Preview Score */}
        <GlassCard className="p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 mb-4">
              🔒 Results are ready
            </div>

            <div className="relative inline-block">
              <div className="text-7xl font-black mb-2">{score}</div>
              <div className="text-white/50 text-sm">/ 100</div>
            </div>

            <p className="text-white/60 mt-4 text-lg">
              Your scan is complete! Unlock to see the full verdict and patterns.
            </p>
          </div>
        </GlassCard>

        {/* Blurred Preview */}
        <div className="relative">
          <GlassCard className="p-8 blur-sm select-none pointer-events-none">
            <div className="space-y-6">
              <div>
                <div className="h-8 bg-white/10 rounded w-3/4 mb-4" />
                <div className="h-4 bg-white/5 rounded w-full mb-2" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-12 h-12 bg-white/10 rounded-full" />
                    <div className="flex-1">
                      <div className="h-6 bg-white/10 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-white/5 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <div className="text-2xl font-black text-white">Results Locked</div>
            </div>
          </div>
        </div>

        {/* Pricing Options */}
        <GlassCard className="p-8">
          <div className="text-center mb-6">
            {/* Psychological headline */}
            <h2 className="text-3xl font-black mb-3">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                You felt it. Now confirm it.
              </span>
            </h2>
            <p className="text-xl text-white/90 font-bold mb-2">
              Unlock the proof you need
            </p>
            <p className="text-white/60">Full analysis + all detected patterns</p>
          </div>

          {/* Plan Selector */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* One-Time */}
            <button
              onClick={() => setSelectedPlan('onetime')}
              className={`p-6 rounded-2xl border-2 transition text-left ${
                selectedPlan === 'onetime'
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white/70 mb-1">One Report</div>
                  <div className="text-3xl font-black">$4.99</div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'onetime'
                      ? 'border-pink-500 bg-pink-500'
                      : 'border-white/30'
                  }`}
                >
                  {selectedPlan === 'onetime' && <div className="w-3 h-3 bg-white rounded-full" />}
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <span className="text-pink-400">✓</span> This scan only
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400">✓</span> Full verdict + patterns
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400">✓</span> Downloadable results
                </li>
              </ul>
            </button>

            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`p-6 rounded-2xl border-2 transition text-left relative ${
                selectedPlan === 'monthly'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="absolute -top-3 right-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 rounded-full text-xs font-black text-white">
                  BEST VALUE
                </div>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white/70 mb-1">Pro Monthly</div>
                  <div className="text-3xl font-black">$9.99</div>
                  <div className="text-xs text-white/50">/month</div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'monthly'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-white/30'
                  }`}
                >
                  {selectedPlan === 'monthly' && <div className="w-3 h-3 bg-white rounded-full" />}
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> <strong>Unlimited scans</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> All future scans
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Cancel anytime
                </li>
              </ul>
            </button>
          </div>

          {/* CTA Button */}
          <Button
            variant="primary"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-5 text-lg font-bold"
          >
            {loading ? (
              'Loading...'
            ) : selectedPlan === 'onetime' ? (
              <>🔓 Get The Truth — $4.99</>
            ) : (
              <>🚀 Never Miss It Again — $9.99/mo</>
            )}
          </Button>

          <p className="text-center text-white/40 text-xs mt-4">
            Secure checkout • Instant access • 30-day guarantee
          </p>
        </GlassCard>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 text-white/40 text-sm">
          <div className="flex items-center gap-2">
            <span>🔒</span> Secure Payment
          </div>
          <div className="flex items-center gap-2">
            <span>⚡</span> Instant Access
          </div>
          <div className="flex items-center gap-2">
            <span>💯</span> Money-back Guarantee
          </div>
        </div>
      </motion.div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            setIsAuthenticated(true);
            handleCheckout();
          }}
        />
      )}
    </div>
  );
}