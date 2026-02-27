export type Context = 'dating' | 'friend' | 'work' | 'family';

export type Tier = 'free' | 'pro';

export interface Signal {
  emoji: string;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface Verdict {
  title: string;
  body: string;
}

export interface AnalysisResult {
  score: number;
  signals: Signal[];
  verdict: Verdict;
}

export interface Scan {
  id: string;
  user_id?: string;
  context: Context;
  score: number;
  verdict_title: string;
  verdict_body: string;
  signals: Signal[];
  messages: string[];
  share_card_url?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email?: string;
  tier: Tier;
  scans_today: number;
  total_scans: number;
  referral_code: string;
}