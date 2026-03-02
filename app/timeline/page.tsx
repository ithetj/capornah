'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass';
import { getCapTier } from '@/lib/capTiers';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Analysis {
  id: string;
  score: number;
  tier: string;
  verdict_title: string;
  metrics: any;
  created_at: string;
}

interface Relationship {
  id: string;
  label: string;
  context: string;
}

interface UserStats {
  level: number;
  level_name: string;
  total_scans: number;
  streak_days: number;
  badges: string[];
}

export default function TimelinePage() {
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadTimeline() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      // Get user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserStats(stats);

      // Get user's primary relationship
      const { data: rel } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setRelationship(rel);

      if (rel) {
        // Get analyses for this relationship
        const { data: analysisData } = await supabase
          .from('analyses')
          .select('*')
          .eq('relationship_id', rel.id)
          .order('created_at', { ascending: false });

        setAnalyses(analysisData || []);
      }

      setLoading(false);
    }

    loadTimeline();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading your timeline...</div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: analyses.slice().reverse().map((a, i) => {
      const date = new Date(a.created_at);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Cap Score',
        data: analyses.slice().reverse().map(a => a.score),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Trust',
        data: analyses.slice().reverse().map(a => a.metrics?.trust || 50),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.6)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        min: 0,
        max: 100,
        ticks: { color: 'rgba(255,255,255,0.6)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  // Calculate trends
  const latestScore = analyses[0]?.score || 0;
  const previousScore = analyses[1]?.score || latestScore;
  const scoreTrend = latestScore - previousScore;

  const avgScore = analyses.length > 0 
    ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-white/60 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Scan
          </button>
          <h1 className="text-4xl font-black text-white mb-2">
            📊 Relationship Timeline
          </h1>
          <p className="text-white/60">
            {relationship?.label || 'Your Relationship'} • {analyses.length} scans tracked
          </p>
        </div>

        {/* User Stats Card */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-pink-400">{userStats.level}</div>
                  <div className="text-sm text-white/60">{userStats.level_name}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400">{userStats.total_scans}</div>
                  <div className="text-sm text-white/60">Total Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-orange-400">{userStats.streak_days}</div>
                  <div className="text-sm text-white/60">Day Streak 🔥</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-blue-400">{userStats.badges.length}</div>
                  <div className="text-sm text-white/60">Badges Earned</div>
                </div>
              </div>

              {/* Badges */}
              {userStats.badges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-sm text-white/60 mb-2">Achievements</div>
                  <div className="flex gap-2 flex-wrap">
                    {userStats.badges.map(badge => (
                      <div 
                        key={badge}
                        className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full text-sm border border-pink-500/30"
                      >
                        {badge === '7_day_warrior' && '⚔️ 7 Day Warrior'}
                        {badge === 'monthly_master' && '👑 Monthly Master'}
                        {badge === 'week_streak' && '🔥 Week Streak'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <GlassCard className="p-6">
            <div className="text-sm text-white/60 mb-1">Latest Score</div>
            <div className="text-3xl font-black text-white mb-2">{latestScore}/100</div>
            <div className={`text-sm ${scoreTrend > 0 ? 'text-red-400' : scoreTrend < 0 ? 'text-green-400' : 'text-white/60'}`}>
              {scoreTrend > 0 && `↑ +${scoreTrend} from last scan`}
              {scoreTrend < 0 && `↓ ${scoreTrend} from last scan`}
              {scoreTrend === 0 && 'No change'}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-sm text-white/60 mb-1">Average Score</div>
            <div className="text-3xl font-black text-white mb-2">{avgScore}/100</div>
            <div className="text-sm text-white/60">
              {getCapTier(avgScore).label} {getCapTier(avgScore).emoji}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-sm text-white/60 mb-1">Trend</div>
            <div className="text-3xl font-black text-white mb-2">
              {scoreTrend < 0 ? '📉 Improving' : scoreTrend > 0 ? '📈 Declining' : '➡️ Stable'}
            </div>
            <div className="text-sm text-white/60">Based on last 2 scans</div>
          </GlassCard>
        </div>

        {/* Chart */}
        {analyses.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Score Progression</h2>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Timeline List */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Scan History</h2>
          
          {analyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-white/60 mb-4">No scans yet for this relationship</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl"
              >
                Run Your First Scan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis, index) => {
                const tier = getCapTier(analysis.score);
                const date = new Date(analysis.created_at);
                
                return (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/result/${analysis.id}`)}
                    className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition border border-white/10 hover:border-pink-500/50"
                  >
                    {/* Date */}
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm text-white/60">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Score Circle */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                      <div className="text-2xl font-black text-white">{analysis.score}</div>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="font-bold text-white mb-1">{analysis.verdict_title}</div>
                      <div className="text-sm text-white/60">
                        {tier.label} {tier.emoji}
                      </div>
                    </div>

                    {/* Metrics */}
                    {analysis.metrics && (
                      <div className="hidden md:flex gap-3">
                        <div className="text-center">
                          <div className="text-xs text-white/60">Trust</div>
                          <div className="text-sm font-bold text-green-400">{analysis.metrics.trust}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-white/60">Clarity</div>
                          <div className="text-sm font-bold text-blue-400">{analysis.metrics.clarity}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-white/60">Cap</div>
                          <div className="text-sm font-bold text-red-400">{analysis.metrics.manipulation}</div>
                        </div>
                      </div>
                    )}

                    <div className="text-white/40">→</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl text-lg hover:shadow-lg hover:shadow-pink-500/50 transition"
          >
            🔍 Run Another Scan
          </button>
        </div>
      </div>
    </div>
  );
}