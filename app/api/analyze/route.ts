import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeMessages } from '@/lib/claude';
import { Context } from '@/types';
import { getCapTier } from '@/lib/capTiers';

// ============================================
// HELPER FUNCTIONS FOR RETENTION
// ============================================

// Level thresholds for gamification
const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Casual Analyzer', scans: 0 },
  { level: 2, name: 'Pattern Aware', scans: 10 },
  { level: 3, name: 'Emotional Strategist', scans: 30 },
  { level: 4, name: 'Truth Architect', scans: 75 },
  { level: 5, name: 'Relationship Master', scans: 150 },
];

// Calculate metrics from signals
function calculateMetrics(signals: any[]) {
  const manipulation = signals.filter(s => 
    ['gaslighting', 'deflection', 'lovebomb'].some(p => 
      s.title.toLowerCase().includes(p)
    )
  ).length * 25;

  const avoidance = signals.filter(s =>
    ['vague', 'evasive', 'deflect', 'avoid'].some(p =>
      s.title.toLowerCase().includes(p)
    )
  ).length * 25;

  const clarity = 100 - avoidance;
  const trust = Math.max(0, 100 - manipulation - (avoidance / 2));
  const emotional_stability = Math.max(30, 100 - (manipulation / 2) - avoidance);

  return {
    trust: Math.round(trust),
    clarity: Math.round(clarity),
    manipulation: Math.round(Math.min(100, manipulation)),
    emotional_stability: Math.round(emotional_stability),
    avoidance: Math.round(Math.min(100, avoidance))
  };
}

// Update user stats (level, streak, badges)
async function updateUserStats(userId: string, supabase: any) {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const lastScanDate = stats?.last_scan_date;
  
  // Check if consecutive day
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const isConsecutive = lastScanDate === yesterdayStr;

  const totalScans = (stats?.total_scans || 0) + 1;
  const streakDays = isConsecutive ? (stats?.streak_days || 0) + 1 : 1;

  // Calculate level
  const level = LEVEL_THRESHOLDS.findLast(l => totalScans >= l.scans);
  
  // Award badges
  const badges = stats?.badges || [];
  if (totalScans === 7 && !badges.includes('7_day_warrior')) {
    badges.push('7_day_warrior');
  }
  if (totalScans === 30 && !badges.includes('monthly_master')) {
    badges.push('monthly_master');
  }
  if (streakDays === 7 && !badges.includes('week_streak')) {
    badges.push('week_streak');
  }

  const newStats = {
    user_id: userId,
    total_scans: totalScans,
    streak_days: streakDays,
    last_scan_date: today,
    level: level?.level || 1,
    level_name: level?.name || 'Casual Analyzer',
    badges: badges
  };

  if (stats) {
    await supabase.from('user_stats').update(newStats).eq('user_id', userId);
  } else {
    await supabase.from('user_stats').insert(newStats);
  }

  return newStats;
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length < 1) {
      return NextResponse.json(
        { error: 'Please provide at least 1 message' },
        { status: 400 }
      );
    }

    if (messages.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 messages allowed' },
        { status: 400 }
      );
    }

    if (!['dating', 'friend', 'work', 'family'].includes(context)) {
      return NextResponse.json({ error: 'Invalid context' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is Pro subscriber
    let isPro = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, scans_today, last_scan_reset')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Check if Pro
        if (profile.tier === 'pro') {
          isPro = true;
        }

        // Reset daily counter if new day
        const lastReset = new Date(profile.last_scan_reset);
        const now = new Date();
        
        if (now.toDateString() !== lastReset.toDateString()) {
          await supabase
            .from('profiles')
            .update({
              scans_today: 0,
              last_scan_reset: now.toISOString(),
            })
            .eq('id', user.id);
          profile.scans_today = 0;
        }

        // Check daily limit for free users
        if (!isPro && profile.scans_today >= 3) {
          return NextResponse.json(
            {
              error: 'Daily limit reached',
              upgrade: true,
              message: '🚨 You hit your 3 scans/day limit. Go Pro for unlimited scans!',
              upgradeUrl: '/pricing'
            },
            { status: 429 }
          );
        }
      }
    }

    // Analyze messages with Claude
    const analysis = await analyzeMessages(messages, context as Context);

    // Save scan to database
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user?.id || null,
        context,
        score: analysis.score,
        verdict_title: analysis.verdict.title,
        verdict_body: analysis.verdict.body,
        signals: analysis.signals,
        messages,
        ip_address: request.headers.get('x-forwarded-for') || null,
        unlocked: isPro,
      })
      .select()
      .single();

    // Check if scan failed to save
    if (scanError || !scan) {
      console.error('Failed to save scan:', scanError);
      return NextResponse.json(
        { error: 'Failed to save scan results. Please try again.' },
        { status: 500 }
      );
    }

    // Update user stats in profiles table (only if user exists)
    if (user) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('scans_today, total_scans')
        .eq('id', user.id)
        .single();

      if (currentProfile) {
        await supabase
          .from('profiles')
          .update({
            scans_today: currentProfile.scans_today + 1,
            total_scans: currentProfile.total_scans + 1,
          })
          .eq('id', user.id);
      }
    }

    // ============================================
    // RETENTION TRACKING - Save to new tables
    // ============================================

    if (user) {
      try {
        const tier = getCapTier(analysis.score);
        
        // 1) Get or create default relationship
        let relationshipId = null;
        
        const { data: existingRel } = await supabase
          .from('relationships')
          .select('id')
          .eq('user_id', user.id)
          .eq('context', context)
          .limit(1)
          .single();

        if (existingRel) {
          relationshipId = existingRel.id;
        } else {
          // Create default relationship
          const relationshipLabel = 
            context === 'work' ? 'Work Contact' : 
            context === 'friend' ? 'Friend' :
            context === 'family' ? 'Family Member' : 'Partner';
          
          const { data: newRel } = await supabase
            .from('relationships')
            .insert({
              user_id: user.id,
              label: relationshipLabel,
              context: context
            })
            .select()
            .single();

          relationshipId = newRel?.id;
        }

        // 2) Update scan with relationship_id
        if (relationshipId && scan?.id) {
          await supabase
            .from('scans')
            .update({ relationship_id: relationshipId })
            .eq('id', scan.id);
        }

        // 3) Calculate metrics
        const metrics = calculateMetrics(analysis.signals);

        // 4) Save to analyses table
        const { data: analysisRecord } = await supabase
          .from('analyses')
          .insert({
            user_id: user.id,
            relationship_id: relationshipId,
            score: analysis.score,
            tier: tier.label,
            verdict_title: analysis.verdict.title,
            verdict_body: analysis.verdict.body,
            signals: analysis.signals,
            metrics: metrics
          })
          .select()
          .single();

        // 5) Save patterns
        if (analysisRecord && relationshipId) {
          const patterns = analysis.signals.map((signal: any) => ({
            user_id: user.id,
            relationship_id: relationshipId,
            analysis_id: analysisRecord.id,
            pattern_key: signal.title.toLowerCase().replace(/\s+/g, '_'),
            pattern_title: signal.title,
            severity: signal.severity || 'medium',
            evidence: { 
              description: signal.description, 
              emoji: signal.emoji 
            }
          }));

          await supabase.from('patterns').insert(patterns);
        }

        // 6) Update user stats (gamification)
        const updatedStats = await updateUserStats(user.id, supabase);

        // 7) Log for debugging
        console.log('✅ Retention data saved:', {
          relationshipId,
          analysisId: analysisRecord?.id,
          patterns: analysis.signals.length,
          userLevel: updatedStats.level_name,
          streak: updatedStats.streak_days
        });

      } catch (retentionError) {
        // Don't break the main flow if retention tracking fails
        console.error('⚠️ Retention tracking error:', retentionError);
      }
    }

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/result/${scan.id}`;

    // Return response based on user tier
    if (isPro) {
      // Pro users get full results immediately
      return NextResponse.json({
        ...analysis,
        scanId: scan.id,
        shareUrl,
        locked: false,
      });
    } else {
      // Free users get limited preview with paywall
      return NextResponse.json({
        score: analysis.score,
        scanId: scan.id,
        shareUrl,
        locked: true,
        message: 'Unlock to see full results'
      });
    }

  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze messages' },
      { status: 500 }
    );
  }
}