export interface Relationship {
  id: string;
  user_id: string;
  label: string;
  context: 'dating' | 'work' | 'friend' | 'family';
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  relationship_id: string | null;
  source: 'text' | 'screenshot' | 'voice';
  score: number;
  tier: string;
  verdict_title: string;
  verdict_body: string;
  signals: any[];
  metrics: {
    trust: number;
    clarity: number;
    manipulation: number;
    emotional_stability: number;
    avoidance: number;
  };
  created_at: string;
}

export interface Pattern {
  id: string;
  user_id: string;
  relationship_id: string;
  analysis_id: string;
  pattern_key: string;
  pattern_title: string;
  severity: 'low' | 'medium' | 'high';
  evidence: any;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  relationship_id: string;
  week_start: string;
  week_end: string;
  avg_score: number;
  score_trend: 'improving' | 'declining' | 'stable';
  top_patterns: Pattern[];
  insights: string[];
  badges: string[];
  forecast: {
    volatility?: string;
    trust_trajectory?: string;
    risk_level?: string;
  };
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  level: number;
  level_name: string;
  total_scans: number;
  streak_days: number;
  last_scan_date: string | null;
  badges: string[];
  created_at: string;
  updated_at: string;
}

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Casual Analyzer', scans: 0 },
  { level: 2, name: 'Pattern Aware', scans: 10 },
  { level: 3, name: 'Emotional Strategist', scans: 30 },
  { level: 4, name: 'Truth Architect', scans: 75 },
  { level: 5, name: 'Relationship Master', scans: 150 },
];

export const BADGES = {
  '7_day_warrior': { 
    emoji: '⚔️', 
    name: '7 Day Warrior', 
    description: 'Completed 7 scans' 
  },
  'monthly_master': { 
    emoji: '👑', 
    name: 'Monthly Master', 
    description: 'Completed 30 scans' 
  },
  'week_streak': { 
    emoji: '🔥', 
    name: 'Week Streak', 
    description: '7 days in a row' 
  },
  'truth_seeker': { 
    emoji: '🔍', 
    name: 'Truth Seeker', 
    description: 'Level 3 reached' 
  },
};export interface Relationship {
    id: string;
    user_id: string;
    label: string;
    context: 'dating' | 'work' | 'friend' | 'family';
    created_at: string;
    updated_at: string;
  }
  
  export interface Analysis {
    id: string;
    user_id: string;
    relationship_id: string | null;
    source: 'text' | 'screenshot' | 'voice';
    score: number;
    tier: string;
    verdict_title: string;
    verdict_body: string;
    signals: any[];
    metrics: {
      trust: number;
      clarity: number;
      manipulation: number;
      emotional_stability: number;
      avoidance: number;
    };
    created_at: string;
  }
  
  export interface Pattern {
    id: string;
    user_id: string;
    relationship_id: string;
    analysis_id: string;
    pattern_key: string;
    pattern_title: string;
    severity: 'low' | 'medium' | 'high';
    evidence: any;
    created_at: string;
  }
  
  export interface WeeklyReport {
    id: string;
    user_id: string;
    relationship_id: string;
    week_start: string;
    week_end: string;
    avg_score: number;
    score_trend: 'improving' | 'declining' | 'stable';
    top_patterns: Pattern[];
    insights: string[];
    badges: string[];
    forecast: {
      volatility?: string;
      trust_trajectory?: string;
      risk_level?: string;
    };
    created_at: string;
  }
  
  export interface UserStats {
    id: string;
    user_id: string;
    level: number;
    level_name: string;
    total_scans: number;
    streak_days: number;
    last_scan_date: string | null;
    badges: string[];
    created_at: string;
    updated_at: string;
  }
  
  export const LEVEL_THRESHOLDS = [
    { level: 1, name: 'Casual Analyzer', scans: 0 },
    { level: 2, name: 'Pattern Aware', scans: 10 },
    { level: 3, name: 'Emotional Strategist', scans: 30 },
    { level: 4, name: 'Truth Architect', scans: 75 },
    { level: 5, name: 'Relationship Master', scans: 150 },
  ];
  
  export const BADGES = {
    '7_day_warrior': { 
      emoji: '⚔️', 
      name: '7 Day Warrior', 
      description: 'Completed 7 scans' 
    },
    'monthly_master': { 
      emoji: '👑', 
      name: 'Monthly Master', 
      description: 'Completed 30 scans' 
    },
    'week_streak': { 
      emoji: '🔥', 
      name: 'Week Streak', 
      description: '7 days in a row' 
    },
    'truth_seeker': { 
      emoji: '🔍', 
      name: 'Truth Seeker', 
      description: 'Level 3 reached' 
    },
  };