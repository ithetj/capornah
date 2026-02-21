import { createClient } from '@/lib/supabase/server';
import ResultCard from '@/components/ResultCard';
import BlurredResult from '@/components/BlurredResult';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!scan) {
    return { title: 'CAPORNAH' };
  }

  const ogUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og?score=${scan.score}&title=${encodeURIComponent(scan.verdict_title)}`;

  return {
    title: `${scan.verdict_title} - CAPORNAH`,
    description: `Cap Level: ${scan.score}/100`,
    openGraph: {
      title: scan.verdict_title,
      description: `Cap Level: ${scan.score}/100`,
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: scan.verdict_title,
      description: `Cap Level: ${scan.score}/100`,
      images: [ogUrl],
    },
  };
}

export default async function ResultPage({ params, searchParams }: { params: { id: string }, searchParams: { success?: string } }) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get scan
  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!scan) {
    notFound();
  }

  // Check if user has access
  let hasAccess = false;

  if (user) {
    // Check if user is Pro subscriber
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profile?.tier === 'pro') {
      hasAccess = true;
    }

    // Check if scan is already unlocked
    if (scan.unlocked) {
      hasAccess = true;
    }

    // Check if user just completed payment
    if (searchParams.success === 'true') {
      // Mark scan as unlocked
      await supabase
        .from('scans')
        .update({ unlocked: true, unlocked_at: new Date().toISOString() })
        .eq('id', params.id);
      
      hasAccess = true;
    }
  }

  const result = {
    score: scan.score,
    signals: scan.signals,
    verdict: {
      title: scan.verdict_title,
      body: scan.verdict_body,
    },
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/result/${scan.id}`,
  };

  // Show full results if user has access
  if (hasAccess) {
    return <ResultCard result={result} />;
  }

  // Show blurred paywall
  return <BlurredResult score={scan.score} scanId={scan.id} onUnlock={() => {}} />;
}