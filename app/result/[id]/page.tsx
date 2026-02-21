import { createClient } from '@/lib/supabase/server';
import ResultCard from '@/components/ResultCard';
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

  const ogUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/og?score=' + scan.score + '&title=' + encodeURIComponent(scan.verdict_title);

  return {
    title: scan.verdict_title + ' - CAPORNAH',
    description: 'Cap Level: ' + scan.score + '/100',
    openGraph: {
      title: scan.verdict_title,
      description: 'Cap Level: ' + scan.score + '/100',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: scan.verdict_title,
      description: 'Cap Level: ' + scan.score + '/100',
      images: [ogUrl],
    },
  };
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!scan) {
    notFound();
  }

  const result = {
    score: scan.score,
    signals: scan.signals,
    verdict: {
      title: scan.verdict_title,
      body: scan.verdict_body,
    },
    shareUrl: process.env.NEXT_PUBLIC_APP_URL + '/result/' + scan.id,
  };

  return <ResultCard result={result} />;
}