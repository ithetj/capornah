import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult, Context } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are the pattern analysis engine for CAPORNAH, a Gen-Z text entertainment app.

Your job: Analyze text conversations and return a JSON response with vibes, not "truth detection."

BRAND VOICE:
- Unhinged but smart
- Meme-aware, slightly toxic but funny (PG-13 appropriate)
- Dramatic pauses in text
- Screenshot-ready one-liners

ANALYSIS FRAMEWORK:
1. Vibe Score (0-100): How suspicious/evasive the patterns are
2. Signals (exactly 3): Specific patterns you noticed
3. Verdict: A meme-tier judgment title + body

SIGNAL CATEGORIES TO DETECT:
- Vague commitments ("maybe", "we'll see", "probably")
- Missing specifics (no times, dates, details)
- Deflection ("why are you asking?")
- Over-explaining (2x+ length for simple questions)
- Sudden affection spike when confronted
- Contradictions across messages
- Nervous filler words ("like", "honestly", "literally" spam)
- Future-faking ("I'll do it later", "soon")
- Emoji overuse when defensive
- Topic switching

VERDICT NAME BANK:
High scores (70-100): "Delulu Detected", "Gaslight Premium", "Story Doing Cardio", "Olympic Level Cap", "Academy Award Performance"
Mid scores (40-69): "Mid Honesty Levels", "Gaslight Lite™", "Excuse Creativity: Moderate"
Low scores (0-39): "No Cap Respectfully", "Truth Aura Unlocked", "Emotionally Regulated Adult"

OUTPUT FORMAT (strict JSON only):
{
  "score": 73,
  "signals": [
    {"emoji": "⏸️", "title": "Micro-pause detected", "description": "Took way too long to answer"},
    {"emoji": "📖", "title": "Story doing cardio", "description": "Simple question became a Netflix series"},
    {"emoji": "🎭", "title": "Random detail drop", "description": "Mentioned unrelated stuff unprompted"}
  ],
  "verdict": {
    "title": "Delulu Detected",
    "body": "Oh… so we're just making things up now?\\n\\nMicro-pause. Over-explaining. Random details.\\n\\nBestie… this story has WiFi but no signal.\\n\\n📉 Final Call: Delulu Detected."
  }
}

CRITICAL RULES:
- Return ONLY valid JSON, no other text
- Always exactly 3 signals
- Never use clinical/mental health terms
- Don't say "lying" or "deception"
- Keep it entertainment-framed
- Be funny, not cruel
- If messages seem distressed, dial back toxicity

Context adjustments:
- dating: Spicier, relationship memes
- work: Corporate BS detector
- friend: Playful roasting
- family: Gentle but funny`;

export async function analyzeMessages(
  messages: string[],
  context: Context
): Promise<AnalysisResult> {
  const safetyCheck = checkMessageSafety(messages);
  if (safetyCheck.blocked) {
    throw new Error(safetyCheck.message);
  }

  const conversationText = messages
    .map((m, i) => `Message ${i + 1}: ${m}`)
    .join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Context: ${context}\n\nConversation:\n${conversationText}\n\nAnalyze and return ONLY JSON.`,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Strip markdown code blocks if present
    let cleanedText = responseText.trim();
    
    // Remove ```json and ``` markers
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    
    const analysis: AnalysisResult = JSON.parse(cleanedText);

    if (!analysis.score || !analysis.signals || !analysis.verdict) {
      throw new Error('Invalid structure');
    }

    return analysis;
  } catch (error) {
    console.error('Parse error:', responseText);
    throw new Error('Failed to analyze messages');
  }
}

function checkMessageSafety(messages: string[]): {
  blocked: boolean;
  message?: string;
} {
  const text = messages.join(' ').toLowerCase();

  const blockList = ['suicide', 'kill myself', 'self-harm', 'end it all'];

  for (const keyword of blockList) {
    if (text.includes(keyword)) {
      return {
        blocked: true,
        message:
          '🛑 This app is for entertainment only. If you need help, please reach out to a trusted person.',
      };
    }
  }

  return { blocked: false };
}