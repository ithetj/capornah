const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up CAPORNAH files...\n');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content.trim());
  console.log('✅ Created: ' + filePath);
}

// API Route: Analyze
writeFile('app/api/analyze/route.ts', `
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
`);

// API Route: OG Image
writeFile('app/api/og/route.tsx', `
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') || '0';
  const title = searchParams.get('title') || 'Unknown';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #222 2%, transparent 0%), radial-gradient(circle at 75px 75px, #222 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: 60 }}>
          <div style={{ fontSize: 120, fontWeight: 900, color: '#fff', textAlign: 'center' }}>
            {score}/100
          </div>
          <div style={{ fontSize: 64, color: '#ff0080', textAlign: 'center', fontWeight: 700, maxWidth: 800 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, color: '#666', marginTop: 60, letterSpacing: 4 }}>
            CAPORNAH
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
`);

// Component: ScanForm
writeFile('components/ScanForm.tsx', `
'use client';

import { useState } from 'react';
import { Context } from '@/types';

interface ScanFormProps {
  onScanComplete: (result: any) => void;
  onLoading: (loading: boolean) => void;
}

export default function ScanForm({ onScanComplete, onLoading }: ScanFormProps) {
  const [messages, setMessages] = useState(['']);
  const [context, setContext] = useState<Context>('dating');
  const [error, setError] = useState('');

  const contexts: { value: Context; label: string; emoji: string }[] = [
    { value: 'dating', label: 'Dating', emoji: '💘' },
    { value: 'friend', label: 'Friend', emoji: '👯' },
    { value: 'work', label: 'Work', emoji: '💼' },
    { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  ];

  const addMessage = () => {
    if (messages.length < 10) {
      setMessages([...messages, '']);
    }
  };

  const updateMessage = (index: number, value: string) => {
    const newMessages = [...messages];
    newMessages[index] = value;
    setMessages(newMessages);
  };

  const removeMessage = (index: number) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index));
    }
  };

  const handleScan = async () => {
    setError('');
    const validMessages = messages.filter((m) => m.trim().length > 0);

    if (validMessages.length === 0) {
      setError('Please add at least one message');
      return;
    }

    onLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: validMessages, context }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Something went wrong');
        onLoading(false);
        return;
      }

      onScanComplete(data);
    } catch (err) {
      setError('Failed to analyze. Try again.');
      onLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          CAPORNAH
        </h1>
        <p className="text-gray-400 text-sm">Text pattern entertainment. For the plot.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3 text-gray-300">Context</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contexts.map((ctx) => (
            <button
              key={ctx.value}
              onClick={() => setContext(ctx.value)}
              className={'p-4 rounded-xl font-medium transition-all ' + (context === ctx.value ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white scale-105' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
            >
              <div className="text-2xl mb-1">{ctx.emoji}</div>
              <div className="text-sm">{ctx.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3 text-gray-300">Messages (1-10)</label>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={msg}
                onChange={(e) => updateMessage(i, e.target.value)}
                className="flex-1 p-4 bg-gray-900 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none"
                placeholder={'Message ' + (i + 1)}
                rows={3}
              />
              {messages.length > 1 && (
                <button onClick={() => removeMessage(i)} className="px-3 text-gray-500 hover:text-red-400 transition">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {messages.length < 10 && (
          <button onClick={addMessage} className="mt-3 text-sm text-gray-400 hover:text-pink-400 transition">
            + Add message
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleScan}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition-all transform hover:scale-[1.02]"
      >
        SCAN THE VIBES
      </button>

      <p className="text-xs text-gray-500 text-center">Entertainment only. Not actual lie detection.</p>
    </div>
  );
}
`);

// Component: ScanAnimation
writeFile('components/ScanAnimation.tsx', `
'use client';

import { motion } from 'framer-motion';

export default function ScanAnimation() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-8">
        <motion.div
          className="text-6xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          🔍
        </motion.div>

        <div className="space-y-4">
          <motion.h2
            className="text-2xl font-bold text-white"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Analyzing the vibes...
          </motion.h2>

          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-pink-500 rounded-full"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// Component: ResultCard
writeFile('components/ResultCard.tsx', `
'use client';

import { motion } from 'framer-motion';
import { AnalysisResult } from '@/types';

interface ResultCardProps {
  result: AnalysisResult & { scanId?: string; shareUrl?: string };
}

export default function ResultCard({ result }: ResultCardProps) {
  const { score, signals, verdict, shareUrl } = result;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'from-red-500 to-orange-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const handleShare = async () => {
    if (shareUrl) {
      if (navigator.share) {
        await navigator.share({
          title: verdict.title,
          text: 'Cap Level: ' + score + '/100',
          url: shareUrl,
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-6"
      >
        <div className="flex justify-center">
          <div className={'relative w-48 h-48 rounded-full bg-gradient-to-br ' + getScoreColor(score) + ' p-1'}>
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-black text-white">{score}</div>
                <div className="text-sm text-gray-400">/ 100</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-3xl font-black text-pink-500 mb-4">{verdict.title}</h2>
          <p className="text-gray-300 whitespace-pre-line leading-relaxed">{verdict.body}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Detected Patterns</h3>
          {signals.map((signal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900 rounded-xl p-4 border border-gray-800"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{signal.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{signal.title}</h4>
                  <p className="text-sm text-gray-400">{signal.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-800 text-white font-semibold py-3 rounded-xl hover:bg-gray-700 transition"
          >
            Scan Again
          </button>
          {shareUrl && (
            <button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition"
            >
              Share Results
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
`);

// Home Page
writeFile('app/page.tsx', `
'use client';

import { useState } from 'react';
import ScanForm from '@/components/ScanForm';
import ScanAnimation from '@/components/ScanAnimation';
import ResultCard from '@/components/ResultCard';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (loading) {
    return <ScanAnimation />;
  }

  if (result) {
    return <ResultCard result={result} />;
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <ScanForm onScanComplete={setResult} onLoading={setLoading} />
    </div>
  );
}
`);

// Result Page
writeFile('app/result/[id]/page.tsx', `
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
`);

// Layout
writeFile('app/layout.tsx', `
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CAPORNAH - Text Vibe Scanner',
  description: 'Text pattern entertainment. For the plot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
`);

// Globals CSS
writeFile('app/globals.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #000;
  color: #fff;
}
`);

// Next config
writeFile('next.config.mjs', `
const nextConfig = {
  images: {
    domains: [],
  },
};

export default nextConfig;
`);

// TSConfig
writeFile('tsconfig.json', `
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`);

console.log('\n✨ All files created successfully!\n');
console.log('Next steps:');
console.log('1. Make sure .env.local has all API keys');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000\n');