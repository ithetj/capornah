'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ScanForm from '@/components/ScanForm';
import ScanAnimation from '@/components/ScanAnimation';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleScanComplete = (data: any) => {
    console.log('✅ Received result:', data);
    
    // If results are locked (paywall), redirect to result page
    if (data.locked && data.scanId) {
      router.push(`/result/${data.scanId}`);
      return;
    }

    // If results are unlocked (Pro user or full data), redirect with full results
    if (data.scanId) {
      router.push(`/result/${data.scanId}?unlocked=true`);
      return;
    }

    // Fallback: if no scanId, something went wrong
    console.error('No scanId in response:', data);
  };

  if (loading) {
    return <ScanAnimation />;
  }

  return (
    <ScanForm 
      onScanComplete={handleScanComplete} 
      onLoading={setLoading} 
    />
  );
}