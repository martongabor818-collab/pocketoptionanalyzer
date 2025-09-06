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

    const detailedPrompt = `You are a professional trading chart analyst. Analyze this trading chart image and provide specific technical analysis.

IMPORTANT: Look carefully at the price levels, candlestick patterns, moving averages, support/resistance levels, and any visible indicators in the chart.

Respond in this EXACT format:

### SIGNAL TYPE
[Write either "BUY", "SELL", or "NEUTRAL" based on technical analysis]

### CONFIDENCE
[Write a number between 60-95]%

### ANALYSIS
- **Current Price:** [State the current price level you can see]
- **Support Level:** [Identify the nearest support price level]  
- **Resistance Level:** [Identify the nearest resistance price level]
- **Trend Direction:** [Bullish/Bearish/Sideways with explanation]
- **Moving Averages:** [Describe MA positions and any crossovers]
- **Chart Pattern:** [Identify patterns like breakout, triangle, channel, etc.]
- **Momentum:** [Describe price momentum and volume if visible]
- **Key Observation:** [Most important technical factor for the signal]

### ENTRY POINT
[Give specific price level for entry, like "174.50" or "Current market price"]

### TARGET PRICE
[Give specific target price level, like "175.20"]

### STOP LOSS  
[Give specific stop loss price level, like "174.00"]

### RISK ASSESSMENT
[Write "LOW", "MEDIUM", or "HIGH"] - [Brief explanation why]

### TIMEFRAME
[Write timeframe like "5-15 minutes", "1-2 hours", "few hours", etc.]

### REASONING
[2-3 sentences explaining the main technical reasons for this signal based on what you observe in the chart]

CRITICAL: Base your analysis on what you can actually see in the chart image. Provide specific price levels, not generic advice.`;

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
  const regex = new RegExp(`${fieldName}:?\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}