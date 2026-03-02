'use client';

import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-32 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/60">
            Unlock unlimited scans and advanced features
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-8 border-2 border-white/10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="text-4xl font-black text-white mb-1">$0</div>
                <div className="text-white/60 text-sm">Forever</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-white/80">
                  <span className="text-green-400">✓</span> 3 scans per day
                </li>
                <li className="flex items-center gap-2 text-white/80">
                  <span className="text-green-400">✓</span> Basic Cap Score
                </li>
                <li className="flex items-center gap-2 text-white/80">
                  <span className="text-green-400">✓</span> Pattern detection
                </li>
                <li className="flex items-center gap-2 text-white/40">
                  <span className="text-white/20">✗</span> Limited history
                </li>
              </ul>

              <button
                onClick={() => router.push('/')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition border border-white/20"
              >
                Get Started Free
              </button>
            </GlassCard>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-8 border-2 border-pink-500/50 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-1 rounded-full text-xs font-black text-white">
                  MOST POPULAR
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="text-4xl font-black text-white mb-1">$9.99</div>
                <div className="text-white/60 text-sm">per month</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-white">
                  <span className="text-pink-400">✓</span> <strong>Unlimited scans</strong>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-pink-400">✓</span> Full timeline & history
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-pink-400">✓</span> Advanced metrics
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-pink-400">✓</span> Level progression
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-pink-400">✓</span> Priority support
                </li>
              </ul>

              <button
                onClick={() => alert('Coming soon! Currently in test mode.')}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition shadow-lg shadow-pink-500/50"
              >
                🚀 Upgrade to Pro
              </button>

              <p className="text-center text-white/40 text-xs mt-4">
                Cancel anytime • 30-day money-back guarantee
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <GlassCard className="p-6">
              <h3 className="font-bold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-white/60 text-sm">
                Yes! Cancel your Pro subscription anytime. You'll keep access until the end of your billing period.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-bold text-white mb-2">What happens to my data if I cancel?</h3>
              <p className="text-white/60 text-sm">
                Your scan history and timeline remain saved. You'll just be limited to 3 scans per day on the free plan.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-bold text-white mb-2">Is my data secure?</h3>
              <p className="text-white/60 text-sm">
                Absolutely. All scans are encrypted and stored securely. We never share your data with third parties.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}