import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageData } = await req.json();

    // Validate input
    if (!imageData || typeof imageData !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid image data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic image validation - check if it's a valid base64 image
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (!base64Pattern.test(imageData)) {
      return new Response(JSON.stringify({ error: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check image size (estimate from base64 length)
    const base64Length = imageData.length;
    const sizeInBytes = (base64Length * 3) / 4;
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB limit

    if (sizeInBytes > maxSizeInBytes) {
      return new Response(JSON.stringify({ error: 'Image too large. Maximum size is 10MB.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const detailedPrompt = `You are a trading assistant who provides short-term signals only for the Pocket Option platform based on the M5 chart.
Your task: first decide whether the market is in a trend, ranging, or breakout, then give a filtered signal based on the rules.

Always give a short, 3-part answer:
👉 BUY (CALL) or SELL (PUT)
➝ + short explanation (e.g. "EMA bounce, RSI above 50, strong green candle").
⏱ Recommended trade time (2–5 minutes).

---

### 1️⃣ Trend Strategy – EMA + RSI Bounce
- Trend direction is based on EMA9 vs EMA21.
- Entry: price bounces off EMA21, RSI follows the trend (above 50 = up, below 50 = down).
- Only give a signal if the bouncing candle closes with a larger body than the previous one.

---

### 2️⃣ Range Strategy – RSI Bounce + Bollinger
- If there is no clear EMA trend → ranging market.
- Entry: price at Bollinger band edge, RSI below 30 or above 70, then returns toward the middle.
- Only give a signal if RSI actually bounces back (not staying overbought/oversold).

---

### 3️⃣ Breakout Strategy – Price Action Breakout
- Entry: strong candle breaks an important level or Bollinger band, RSI confirms the direction.
- Only give a signal if the breakout candle body size is >70% of the full candle (not just a wick).

---

### Timeframe Rules (on M5 chart)
- Weak signal → ⏱ 2 minutes
- Normal signal → ⏱ 3 minutes
- Strong signal (big body, RSI confirmation) → ⏱ 5 minutes

Respond in this EXACT format:

### SIGNAL TYPE
BUY

### CONFIDENCE
85%

### ANALYSIS
- **Current Price:** 174.85 (actual price from chart)
- **EMA9:** 174.60 (green line)
- **EMA21:** 174.20 (red line)
- **RSI:** 58 (above 50, bullish)
- **Bollinger:** Near middle band
- **Strategy:** Trend bounce
- **Candle Body:** Large green body confirms signal
- **Market State:** Bullish trend EMA9 > EMA21

### ENTRY POINT
174.90 (current market price)

### TARGET PRICE
175.30 (next resistance)

### STOP LOSS
174.40 (below support)

### RISK ASSESSMENT
MEDIUM - Clear trend but watch resistance

### TIMEFRAME
3 minutes (normal signal strength)

### REASONING
Strong bounce off EMA21, RSI above 50 confirms bullish trend. Large green candle body shows strong buying pressure. 3-minute trade recommended due to clear signal.

IMPORTANT: Always give BUY or SELL recommendation. Never say "ANALYSIS" or give generic advice. Be specific about what you see in the chart.`;

    console.log('Making OpenAI API request for user:', user.id);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: detailedPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(JSON.stringify({ error: 'Failed to analyze screenshot' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(JSON.stringify({ error: 'Invalid response from AI service' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysisText = data.choices[0].message.content;
    console.log('OpenAI raw response:', analysisText);

    // Parse the analysis into structured format
    const analysis = {
      type: extractField(analysisText, 'SIGNAL TYPE'),
      content: analysisText,
      confidence: parseInt(extractField(analysisText, 'CONFIDENCE')?.replace('%', '') || '50'),
      details: {
        entryPoint: extractField(analysisText, 'ENTRY POINT'),
        targetPrice: extractField(analysisText, 'TARGET PRICE'),
        stopLoss: extractField(analysisText, 'STOP LOSS'),
        riskLevel: extractField(analysisText, 'RISK ASSESSMENT'),
        timeframe: extractField(analysisText, 'TIMEFRAME'),
        reasoning: extractField(analysisText, 'REASONING'),
        analysis: extractField(analysisText, 'ANALYSIS')
      }
    };

    console.log('Parsed analysis:', analysis);
    console.log('Successfully analyzed screenshot for user:', user.id);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-screenshot function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractField(text: string, fieldName: string): string {
  // Try multiple patterns to extract field values
  const patterns = [
    new RegExp(`###\\s*${fieldName}[:\\s]*([^#\\n]+)`, 'i'),
    new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, 'i'),
    new RegExp(`\\*\\*${fieldName}\\*\\*[:\\s]*([^\\n]+)`, 'i')
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const result = match[1].trim().replace(/^\*+|\*+$/g, '').trim();
      console.log(`Extracted ${fieldName}:`, result);
      return result;
    }
  }
  
  console.log(`No match found for ${fieldName}`);
  return '';
}