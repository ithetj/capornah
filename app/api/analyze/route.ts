import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeMessages } from '@/lib/claude';
import { Context } from '@/types';

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
    const { data: scan } = await supabase
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
        unlocked: isPro, // Auto-unlock for Pro users
      })
      .select()
      .single();

    // Update user stats
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

    // Generate share URL
    const shareUrl = scan?.id
      ? `${process.env.NEXT_PUBLIC_APP_URL}/result/${scan.id}`
      : null;

    // Return response based on user tier
    if (isPro) {
      // Pro users get full results immediately
      return NextResponse.json({
        ...analysis,
        scanId: scan?.id,
        shareUrl,
        locked: false,
      });
    } else {
      // Free users get limited preview with paywall
      return NextResponse.json({
        score: analysis.score,
        scanId: scan?.id,
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