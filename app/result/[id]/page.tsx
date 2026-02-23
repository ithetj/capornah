import { createClient } from '@/lib/supabase/server';
import ResultCard from '@/components/ResultCard';
import BlurredResult from '@/components/BlurredResult';
import { notFound } from 'next/navigation';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('id', resolvedParams.id)
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
  };
}

export default async function ResultPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string, unlocked?: string }> 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get scan
  const { data: scan, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!scan || error) {
    notFound();
  }

  // Determine if user has access to full results
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

    // Check if user just completed payment
    if (resolvedSearchParams.success === 'true') {
      // Mark scan as unlocked
      await supabase
        .from('scans')
        .update({ unlocked: true, unlocked_at: new Date().toISOString() })
        .eq('id', resolvedParams.id);
      
      hasAccess = true;
    }

    // Check if scan was already unlocked
    if (scan.unlocked) {
      hasAccess = true;
    }

    // Check if explicitly unlocked (Pro user just scanned)
    if (resolvedSearchParams.unlocked === 'true') {
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
    scanId: scan.id,
  };

  // Show full results if user has access
  if (hasAccess) {
    return <ResultCard result={result} />;
  }

  // Show blurred paywall for everyone else
  return <BlurredResult score={scan.score} scanId={scan.id} onUnlock={() => {}} />;
}
