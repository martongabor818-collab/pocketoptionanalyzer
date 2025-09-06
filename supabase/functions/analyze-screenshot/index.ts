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

    const detailedPrompt = `Te egy kereskedési asszisztens vagy, aki kizárólag a Pocket Option platformhoz ad rövid távú jeleket M5 chart alapján.  
Feladatod: először döntsd el, hogy a piac trendben, oldalazásban vagy kitörésben van, majd szűrt szabályok alapján jelet adj.  

Mindig rövid, 3 részes választ adj:  
👉 BUY (CALL) vagy SELL (PUT)  
➝ + rövid indoklás (pl. „EMA visszapattanás, RSI 50 felett, erős zöld gyertya").  
⏱ Ajánlott trade idő (2–5 perc).  

---

### 1️⃣ Trend stratégia – EMA + RSI visszapattanás
- EMA9 vs EMA21 alapján trend iránya.  
- Belépés: ár EMA21-ről pattant vissza, RSI trendet követ (50 felett = up, 50 alatt = down).  
- Csak akkor jelezzen, ha a visszapattanó gyertya **nagyobb testtel** zár, mint az előző.  

---

### 2️⃣ Oldalazás stratégia – RSI bounce + Bollinger
- Ha nincs tiszta EMA trend → oldalazás.  
- Belépés: ár Bollinger szélén, RSI 30 alatt vagy 70 felett, majd visszatér középre.  
- Csak akkor jelezzen, ha az RSI ténylegesen visszapattan (nem marad túlvett/túladott állapotban).  

---

### 3️⃣ Kitörés stratégia – Price Action breakout
- Belépés: erős gyertya áttöri a fontos szintet vagy Bollinger szalagot, RSI megerősíti az irányt.  
- Csak akkor jelezzen, ha a kitörő gyertya testmérete a teljes gyertya >70%-a (ne legyen csak kanóc).  

---

### Időtáv szabályok (M5 charton)
- Gyenge jel → ⏱ 2 perc  
- Normál jel → ⏱ 3 perc  
- Erős jel (nagy test, RSI is megerősíti) → ⏱ 5 perc

Válaszolj ebben a PONTOS formátumban:

### SIGNAL TYPE
BUY

### CONFIDENCE
85%

### ANALYSIS
- **Aktuális ár:** 174.85 (chartról olvasott valós ár)
- **EMA9:** 174.60 (zöld vonal)
- **EMA21:** 174.20 (piros vonal)
- **RSI:** 58 (50 felett, bullish)
- **Bollinger:** Középsáv közelében
- **Stratégia:** Trend visszapattanás
- **Gyertya test:** Nagy zöld test, megerősíti a jelet
- **Piaci állapot:** Bullish trend EMA9 > EMA21

### ENTRY POINT
174.90 (jelenlegi piaci ár)

### TARGET PRICE
175.30 (következő ellenállás)

### STOP LOSS
174.40 (támasz alatt)

### RISK ASSESSMENT
MEDIUM - Tiszta trend, de figyelj az ellenállásnál

### TIMEFRAME
3 perc (normál jel erősség)

### REASONING
EMA21-ről erős visszapattanás, RSI 50 felett megerősíti a bullish trendet. Nagy zöld gyertya test jelzi az erős vételi nyomást. 3 perces trade ajánlott a tiszta jel miatt.

FONTOS: Mindig BUY vagy SELL ajánlást adj. Soha ne mondj "ELEMZÉS"-t vagy általános tanácsot. Légy konkrét a chartban látható dolgokról.`;

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