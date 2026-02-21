'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ScanForm from '@/components/ScanForm';
import ScanAnimation from '@/components/ScanAnimation';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleScanComplete = (data: any) => {
    console.log('✅ Received result:', data);
    
    // Stop loading
    setLoading(false);
    
    // Check if we have a scanId
    if (!data.scanId) {
      console.error('No scanId in response:', data);
      alert('Error: Failed to save scan. Please try again.');
      return;
    }

    // Redirect based on locked status
    if (data.locked) {
      // Free user - show paywall
      console.log('Redirecting to paywall...');
      router.push(`/result/${data.scanId}`);
    } else {
      // Pro user - show full results
      console.log('Redirecting to full results...');
      router.push(`/result/${data.scanId}?unlocked=true`);
    }
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