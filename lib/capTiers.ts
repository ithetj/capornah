export interface CapTier {
    min: number;
    max: number;
    label: string;
    tag: string;
    emoji: string;
    color: string;
    bgGradient: string;
  }
  
  export const CAP_TIERS: CapTier[] = [
    {
      min: 0,
      max: 19,
      label: "Certified Angel",
      tag: "No Cap",
      emoji: "😇",
      color: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      min: 20,
      max: 34,
      label: "Soft Sus",
      tag: "Watching Closely",
      emoji: "👀",
      color: "from-green-400 to-yellow-500",
      bgGradient: "from-green-400/20 to-yellow-500/20"
    },
    {
      min: 35,
      max: 49,
      label: "Low-Key Cap Energy",
      tag: "Something's Off",
      emoji: "🤨",
      color: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      min: 50,
      max: 64,
      label: "Story Not Adding Up",
      tag: "Inconsistency Detected",
      emoji: "📉",
      color: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/20 to-red-500/20"
    },
    {
      min: 65,
      max: 79,
      label: "Major Cap Energy",
      tag: "High Suspicion",
      emoji: "🚩",
      color: "from-red-500 to-pink-500",
      bgGradient: "from-red-500/20 to-pink-500/20"
    },
    {
      min: 80,
      max: 100,
      label: "Villain Arc Activated",
      tag: "Critical Alert",
      emoji: "🧨",
      color: "from-red-600 to-purple-600",
      bgGradient: "from-red-600/20 to-purple-600/20"
    }
  ];
  
  export function getCapTier(score: number): CapTier {
    return CAP_TIERS.find(tier => score >= tier.min && score <= tier.max) || CAP_TIERS[0];
  }
  
  export function getNextTier(score: number): CapTier | null {
    const currentIndex = CAP_TIERS.findIndex(tier => score >= tier.min && score <= tier.max);
    return currentIndex < CAP_TIERS.length - 1 ? CAP_TIERS[currentIndex + 1] : null;
  }
  
  export function getPointsToNextTier(score: number): number | null {
    const nextTier = getNextTier(score);
    return nextTier ? nextTier.min - score : null;
  }