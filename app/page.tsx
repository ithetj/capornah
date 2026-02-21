'use client';

import { useState } from 'react';
import ScanForm from '@/components/ScanForm';
import ScanAnimation from '@/components/ScanAnimation';
import ResultCard from '@/components/ResultCard';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  console.log('🏠 Home render:', { loading, hasResult: !!result });

  if (loading) {
    return <ScanAnimation />;
  }

  if (result) {
    return <ResultCard result={result} />;
  }

  return (
    <ScanForm 
      onScanComplete={(data) => {
        console.log('✅ Received result:', data);
        setLoading(false); // Make sure loading is false
        setResult(data);
      }} 
      onLoading={(isLoading) => {
        console.log('⏳ Loading state:', isLoading);
        setLoading(isLoading);
        if (!isLoading) {
          // Don't clear result when loading stops
        }
      }} 
    />
  );
}