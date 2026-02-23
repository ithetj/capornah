'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GlassCard } from './ui/glass';
import { Button } from './ui/button';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setCheckEmail(true);
    setLoading(false);
  };

  if (checkEmail) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
          <p className="text-white/70 mb-6">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-white/50 text-sm mb-6">
            Click the link in the email to sign in. You can close this window.
          </p>
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Sign in to continue</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-white/70 mb-6">
          Sign in to unlock your results or manage your subscription
        </p>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Magic Link 🪄'}
          </Button>
        </form>

        <p className="text-white/40 text-xs text-center mt-6">
          We'll email you a magic link for a password-free sign in
        </p>
      </GlassCard>
    </div>
  );
}