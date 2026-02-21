'use client';

import { useMemo, useState } from 'react';
import { Context } from '@/types';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import ImageUpload from './ImageUpload';

interface ScanFormProps {
  onScanComplete: (result: any) => void;
  onLoading: (loading: boolean) => void;
}

export default function ScanForm({ onScanComplete, onLoading }: ScanFormProps) {
  const [messages, setMessages] = useState(['']);
  const [context, setContext] = useState<Context>('dating');
  const [error, setError] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleImageText = (extractedText: string) => {
    const lines = extractedText
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 10);

    if (lines.length > 0) {
      setMessages(lines);
      setShowImageUpload(false);
    }
  };

  const contexts: { value: Context; label: string; emoji: string }[] = [
    { value: 'dating', label: 'Dating', emoji: '💘' },
    { value: 'friend', label: 'Friend', emoji: '👯' },
    { value: 'work', label: 'Work', emoji: '💼' },
    { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  ];

  const quickTemplates: Record<Context, string[]> = {
    dating: [
      "Where were you last night?",
      "Who's that in your story?",
      "Are you still talking to your ex?",
      "Why didn't you text back?",
    ],
    friend: [
      "Want to hang this weekend?",
      "Did you forget about our plans?",
      "Are you mad at me?",
      "Can I borrow money?",
    ],
    work: [
      "Can you finish this by EOD?",
      "Did you see my email?",
      "Why weren't you at the meeting?",
      "When will this be done?",
    ],
    family: [
      "Are you coming for dinner?",
      "Did you eat today?",
      "Why don't you call more?",
      "When are you visiting?",
    ],
  };

  const filledCount = useMemo(
    () => messages.filter((m) => m.trim().length > 0).length,
    [messages]
  );

  const addMessage = () => messages.length < 10 && setMessages([...messages, '']);
  const updateMessage = (index: number, value: string) => {
    const next = [...messages];
    next[index] = value;
    setMessages(next);
  };
  const removeMessage = (index: number) => {
    if (messages.length > 1) setMessages(messages.filter((_, i) => i !== index));
  };
  const useTemplate = (template: string) => {
    if (messages.length < 10) setMessages([...messages, template]);
  };

  const handleScan = async () => {
    setError('');
    const validMessages = messages.filter((m) => m.trim().length > 0);
    
    if (validMessages.length === 0) {
      setError('Add at least one message 🙏');
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
        
        // Handle upgrade prompt
        if (data.upgrade) {
          const shouldUpgrade = confirm(data.message + '\n\nGo to pricing page?');
          if (shouldUpgrade) {
            window.location.href = '/pricing';
          }
        }
        return;
      }
  
      // Important: Stop loading and pass data to parent immediately
      // Don't try to access any properties here
      onLoading(false);
      
      // Just pass the raw data to the parent component
      onScanComplete(data);
      
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to analyze. Try again.');
      onLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12">
      {/* premium background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b0b14] to-black" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px] opacity-30" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80">
            🍿 Entertainment-only vibe scan
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span className="text-white/60">Not lie detection</span>
          </div>

          <h1 className="mt-5 text-6xl md:text-7xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              CAPORNAH
            </span>
          </h1>

          <p className="mt-3 text-white/60 text-lg">
            {showImageUpload
              ? 'Drop screenshot. We extract the tea. 📸'
              : 'Paste messages. Pick context. We judge the vibes. 😈'}
          </p>
        </motion.div>

        {/* Screenshot Toggle */}
        <GlassCard className="p-4">
          <button
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="w-full flex items-center justify-between transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {showImageUpload ? '✏️' : '📸'}
              </span>
              <div className="text-left">
                <div className="font-black text-white">
                  {showImageUpload ? 'Type Messages' : 'Upload Screenshot'}
                </div>
                <div className="text-sm text-white/50">
                  {showImageUpload ? 'Switch to manual input' : 'Auto-extract from image'}
                </div>
              </div>
            </div>
            <Chip active={showImageUpload}>
              {showImageUpload ? 'ON' : 'OFF'}
            </Chip>
          </button>
        </GlassCard>

        {showImageUpload ? (
          <ImageUpload onTextExtracted={handleImageText} />
        ) : (
          <>
            {/* Context */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white/70 uppercase tracking-wider">
                    Context
                  </div>
                  <div className="mt-1 text-white/60 text-sm">
                    Choose the scenario for better "cap math."
                  </div>
                </div>
                <Chip active>{filledCount}/10 filled</Chip>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {contexts.map((ctx) => (
                  <button
                    key={ctx.value}
                    onClick={() => setContext(ctx.value)}
                    className="active:scale-[0.98] transition"
                  >
                    <Chip active={context === ctx.value}>
                      <span className="text-lg">{ctx.emoji}</span>
                      {ctx.label}
                    </Chip>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Quick templates */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-white/70 uppercase tracking-wider">
                  Quick Questions
                </div>
                <div className="text-white/50 text-sm">tap to add</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickTemplates[context].map((t, i) => (
                  <button
                    key={i}
                    onClick={() => useTemplate(t)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition active:scale-[0.98]"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Messages */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-white/70 uppercase tracking-wider">
                  Messages
                </div>
                <div className="text-white/50 text-sm">1–10</div>
              </div>

              <div className="mt-4 space-y-3">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex gap-3"
                  >
                    <div className="mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-xs font-black text-white/60 border border-white/10">
                      {i + 1}
                    </div>

                    <textarea
                      value={msg}
                      onChange={(e) => updateMessage(i, e.target.value)}
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition resize-none"
                      placeholder="Paste a message…"
                      rows={3}
                    />

                    {messages.length > 1 && (
                      <button
                        onClick={() => removeMessage(i)}
                        className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 text-white/50 hover:text-red-300 hover:border-red-400/30 hover:bg-red-500/10 transition active:scale-[0.98]"
                        aria-label="Remove message"
                      >
                        ✕
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {messages.length < 10 && (
                <button
                  onClick={addMessage}
                  className="mt-4 text-sm font-bold text-white/50 hover:text-pink-300 transition"
                >
                  + Add another message
                </button>
              )}
            </GlassCard>
          </>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* CTA */}
        <Button variant="primary" onClick={handleScan} className="w-full py-6 text-lg">
          🔍 SCAN THE VIBES
          <span className="ml-2 text-white/80 font-extrabold">({filledCount} msg)</span>
        </Button>

        <p className="text-center text-xs text-white/35">
          🎭 Entertainment only. Not actual lie detection.
        </p>
      </div>
    </div>
  );
}