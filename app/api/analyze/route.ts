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

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, scans_today, last_scan_reset')
        .eq('id', user.id)
        .single();

      if (profile) {
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

        if (profile.tier === 'free' && profile.scans_today >= 3) {
          return NextResponse.json(
            {
              error: 'Daily limit reached',
              upgrade: true,
              message: 'Free tier = 3 scans/day. Go Pro for unlimited.',
            },
            { status: 429 }
          );
        }
      }
    }

    const analysis = await analyzeMessages(messages, context as Context);

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
      })
      .select()
      .single();

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

    const shareUrl = scan?.id
      ? process.env.NEXT_PUBLIC_APP_URL + '/result/' + scan.id
      : null;

    return NextResponse.json({
      ...analysis,
      scanId: scan?.id,
      shareUrl,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze messages' },
      { status: 500 }
    );
  }
}