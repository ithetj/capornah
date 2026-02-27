'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult } from '@/types';
import { getCapTier, getPointsToNextTier } from '@/lib/capTiers';
import html2canvas from 'html2canvas';

interface ResultCardProps {
  result: AnalysisResult & { scanId?: string; shareUrl?: string };
}

export default function ResultCard({ result }: ResultCardProps) {
  const { score, signals, verdict, shareUrl } = result;
  const resultRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const tier = getCapTier(score);
  const pointsToNext = getPointsToNextTier(score);
  const highRiskPatterns = signals.filter(s => s.severity === 'high').length;
  const totalPatterns = signals.length;

  const handleShare = async () => {
    if (shareUrl) {
      if (navigator.share) {
        await navigator.share({
          title: `${tier.label} ${tier.emoji} - ${score}/100`,
          text: `Cap Level: ${score}/100 - ${tier.label}`,
          url: shareUrl,
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied! 📋');
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!resultRef.current) return;
    
    setDownloading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `capornah-${score}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
        setDownloading(false);
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-gray-900 to-black">
      <motion.div
        ref={resultRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {/* Score Hero Section */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 bg-gradient-to-r ${tier.bgGradient} blur-3xl`} />
          <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-8 text-center">
            
            {/* Score Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-800"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: score / 100 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    strokeDasharray={`${2 * Math.PI * 70}`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="text-pink-500" stopColor="currentColor" />
                      <stop offset="100%" className="text-purple-500" stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-5xl font-black text-white"
                    >
                      {score}
                    </motion.div>
                    <div className="text-sm text-gray-400 font-medium">/100</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Cap Tier Badge */}
            <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${tier.color} text-white font-bold text-sm mb-2`}>
              {tier.tag}
            </div>

            {/* Cap Tier Label */}
            <h1 className="text-4xl md:text-5xl font-black text-pink-500 mb-2">
              {tier.label} {tier.emoji}
            </h1>

            {/* Official Branding */}
            <p className="text-gray-500 text-sm font-medium mb-4">
              Cap Scale™ Rating
            </p>

            {/* Distance to Next Tier */}
            {pointsToNext !== null && (
              <p className="text-gray-400 text-sm">
                <span className="text-orange-400 font-bold">{pointsToNext} points</span> away from {getCapTier(score + pointsToNext + 1)?.label} {getCapTier(score + pointsToNext + 1)?.emoji}
              </p>
            )}

            {/* Pattern Summary */}
            <div className="mt-6 inline-block bg-white/5 border border-white/10 rounded-xl px-6 py-3">
              <p className="text-white/90 text-sm">
                👀 We found <span className="font-bold text-pink-400">{totalPatterns}</span> behavior pattern{totalPatterns !== 1 ? 's' : ''}
                {highRiskPatterns > 0 && (
                  <>
                    {' '} — <span className="font-bold text-red-400">{highRiskPatterns}</span> could impact trust long term
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Verdict Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mb-6"
        >
          <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
            {verdict.body}
          </p>
        </motion.div>

        {/* Signals */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
            📊 Detected Patterns
          </h3>
          <div className="grid gap-4">
            {signals.map((signal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className={`bg-gradient-to-br from-gray-900 to-black border rounded-xl p-5 hover:border-pink-500/50 transition-all group ${
                  signal.severity === 'high' ? 'border-red-500/50' :
                  signal.severity === 'medium' ? 'border-orange-500/50' :
                  'border-gray-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform">
                    {signal.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg group-hover:text-pink-400 transition-colors">
                        {signal.title}
                      </h4>
                      {signal.severity === 'high' && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold">
                          HIGH RISK
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {signal.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all border border-gray-700 hover:border-gray-600"
          >
            🔍 Scan Again
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
          >
            {downloading ? '⏳ Saving...' : '💾 Save'}
          </button>
          
          {shareUrl && (
            <button
              onClick={handleShare}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-pink-500/50"
            >
              📤 Share
            </button>
          )}
        </div>

        {/* Watermark */}
        <div className="text-center mb-4">
          <div className="text-2xl font-black text-pink-500 mb-1">
            {tier.label} {tier.emoji}
          </div>
          <div className="text-sm font-bold text-white/60">
            CAPORNAH.COM
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-600">
          🎭 Entertainment only. Not actual lie detection.
        </p>
      </motion.div>
    </div>
  );
}