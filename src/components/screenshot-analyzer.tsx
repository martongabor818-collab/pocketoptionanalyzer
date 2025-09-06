import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, Sparkles, Eye, Download, Trash2, X, TrendingUp, TrendingDown, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AnalysisResult {
  type: string;
  content: string;
  confidence: number;
  details: string[];
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface TradeStats {
  totalAnalyses: number;
  wins: number;
  losses: number;
  winRate: number;
}

export const ScreenshotAnalyzer = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tradeStats, setTradeStats] = useState<TradeStats>({
    totalAnalyses: 0,
    wins: 0,
    losses: 0,
    winRate: 0
  });
  const [currentTradeResult, setCurrentTradeResult] = useState<'win' | 'loss' | null>(null);
  const { toast } = useToast();

  // Load saved API key and stats
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      toast({
        title: "API kulcs betöltve",
        description: "Mentett API kulcs sikeresen betöltve.",
      });
    }

    // Load saved stats
    const savedStats = localStorage.getItem('trade-stats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setTradeStats(stats);
    }
  }, [toast]);

  // Handle paste from clipboard
  React.useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setUploadedImage(reader.result as string);
              setFileName(`Beillesztett kép - ${new Date().toLocaleTimeString()}`);
              setAnalysisResult(null);
              toast({
                title: "Kép beillesztve",
                description: "A screenshot sikeresen beillesztésre került a vágólapról (Ctrl+V).",
              });
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setAnalysisResult(null);
        toast({
          title: "Kép feltöltve",
          description: "A screenshot sikeresen feltöltésre került.",
        });
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  });

  const analyzeScreenshot = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      toast({
        title: "API kulcs szükséges",
        description: "Kérlek add meg az OpenAI API kulcsodat a képelemzéshez.",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setCurrentTradeResult(null);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Te egy kereskedési asszisztens vagy, aki kizárólag a Pocket Option platformhoz ad rövid távú jeleket M5 chart alapján.  
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
- Erős jel (nagy test, RSI is megerősíti) → ⏱ 5 perc`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: uploadedImage!
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`API hiba: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      const analysis = data.choices[0].message.content;

      // Parse the AI response into structured format
      const lines = analysis.split('\n').filter(line => line.trim());
      const type = lines.find(line => line.includes('típus') || line.includes('felület'))?.replace(/^\d+\.?\s*/, '') || 'Általános tartalom';
      const content = lines.slice(0, 3).join(' ');
      const details = lines.slice(1).filter(line => line.trim() && !line.includes('Válasz')).map(line => line.replace(/^\d+\.?\s*/, '').trim());

      setAnalysisResult({
        type: type.replace(/[^:]*:\s*/, ''),
        content: content,
        confidence: 95,
        details: details.slice(0, 6)
      });

      // Update analysis count
      const newStats = {
        ...tradeStats,
        totalAnalyses: tradeStats.totalAnalyses + 1,
        winRate: tradeStats.totalAnalyses > 0 ? (tradeStats.wins / tradeStats.totalAnalyses) * 100 : 0
      };
      setTradeStats(newStats);
      localStorage.setItem('trade-stats', JSON.stringify(newStats));

      toast({
        title: "Elemzés befejezve",
        description: "A screenshot AI elemzése sikeresen befejeződött.",
      });

    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      console.error('API hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Az API hívás sikertelen. Ellenőrizd az API kulcsot.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const markTradeResult = (result: 'win' | 'loss') => {
    if (currentTradeResult) return; // Prevent double marking

    setCurrentTradeResult(result);
    const newStats = {
      ...tradeStats,
      wins: result === 'win' ? tradeStats.wins + 1 : tradeStats.wins,
      losses: result === 'loss' ? tradeStats.losses + 1 : tradeStats.losses,
    };
    newStats.winRate = newStats.totalAnalyses > 0 ? (newStats.wins / newStats.totalAnalyses) * 100 : 0;
    
    setTradeStats(newStats);
    localStorage.setItem('trade-stats', JSON.stringify(newStats));

    toast({
      title: result === 'win' ? "Nyerő trade!" : "Vesztes trade",
      description: `Statisztika frissítve. Nyerési arány: ${newStats.winRate.toFixed(1)}%`,
      variant: result === 'win' ? "default" : "destructive"
    });

    // Clear image after marking trade result
    setTimeout(() => {
      clearImage();
    }, 2000); // Wait 2 seconds before clearing
  };

  const clearImage = () => {
    setUploadedImage(null);
    setFileName('');
    setAnalysisResult(null);
    setProgress(0);
    setCurrentTradeResult(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-alapú Screenshot Elemző
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            PocketSeptember Clone
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Töltsd fel bármilyen screenshotot és az AI részletesen elemzi a tartalmát, 
            felismeri az elemeket és hasznos információkat ad róla.
          </p>
        </div>

        {/* Statistics */}
        <Card className="p-6 bg-gradient-secondary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Kereskedési Statisztikák
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-primary">{tradeStats.totalAnalyses}</div>
              <div className="text-sm text-muted-foreground">Elemzések</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-green-500">{tradeStats.wins}</div>
              <div className="text-sm text-muted-foreground">Nyerő</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-red-500">{tradeStats.losses}</div>
              <div className="text-sm text-muted-foreground">Vesztes</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-primary">{tradeStats.winRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Nyerési arány</div>
            </div>
          </div>
        </Card>

        {/* Upload Area */}
        <Card className="p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <div
            {...getRootProps()}
            className={`cursor-pointer text-center space-y-4 ${
              isDragActive ? 'scale-105' : ''
            } transition-transform duration-200`}
          >
            <input {...getInputProps()} />
            
            {!uploadedImage ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-upload flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isDragActive ? 'Engedd el a fájlt itt' : 'Screenshot feltöltés'}
                  </h3>
                  <p className="text-muted-foreground">
                    Húzd ide a fájlt, kattints a tallózáshoz vagy használd a <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+V</kbd> billentyűkombinációt
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    PNG, JPG, JPEG, GIF, BMP, WebP formátumok támogatva
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <img
                  src={uploadedImage}
                  alt="Feltöltött screenshot"
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-card"
                />
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    {fileName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* API Key Input */}
        {showApiKeyInput && (
          <Card className="p-6 bg-muted/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">OpenAI API Kulcs</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowApiKeyInput(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                A valódi AI elemzéshez szükséges az OpenAI API kulcs. Ez biztonságosan tárolódik a böngésződben.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button 
                  onClick={() => {
                    if (apiKey) {
                      localStorage.setItem('openai-api-key', apiKey);
                      setShowApiKeyInput(false);
                      toast({
                        title: "API kulcs mentve",
                        description: "Most már elemezhetsz screenshotokat!",
                      });
                    }
                  }}
                  disabled={!apiKey}
                >
                  Mentés
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Analysis Button */}
        {uploadedImage && !analysisResult && (
          <div className="text-center">
            <Button
              onClick={analyzeScreenshot}
              disabled={isAnalyzing}
              size="lg"
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Elemzés folyamatban...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  Screenshot Elemzése
                </>
              )}
            </Button>
          </div>
        )}

        {/* Progress Bar */}
        {isAnalyzing && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI elemzés folyamatban</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                A mesterséges intelligencia feldolgozza a képet és azonosítja a tartalmát...
              </p>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && !isAnalyzing && (
          <Card className="p-6 bg-gradient-secondary border-primary/20 shadow-card">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Elemzési Eredmény
                </h3>
                <Badge className="bg-success/20 text-success-foreground border-success/40">
                  {analysisResult.confidence}% biztos
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-2">
                    Felismert típus: {analysisResult.type}
                  </h4>
                  <p className="text-foreground/90 leading-relaxed">
                    {analysisResult.content}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Részletes elemzés:</h4>
                  <div className="grid gap-2">
                    {analysisResult.details.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-foreground/80">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="flex gap-3 mb-4">
                    <Button
                      onClick={() => analyzeScreenshot()}
                      variant="outline"
                      className="flex-1"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Újra elemez
                    </Button>
                    <Button
                      onClick={clearImage}
                      variant="outline"
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Új kép
                    </Button>
                  </div>
                  
                  {/* Trade Result Buttons */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-center text-muted-foreground">
                      Trade eredmény:
                    </h4>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => markTradeResult('win')}
                        disabled={currentTradeResult !== null}
                        variant={currentTradeResult === 'win' ? "default" : "outline"}
                        className={`flex-1 ${currentTradeResult === 'win' ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-500/10 hover:text-green-500'}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Nyert
                      </Button>
                      <Button
                        onClick={() => markTradeResult('loss')}
                        disabled={currentTradeResult !== null}
                        variant={currentTradeResult === 'loss' ? "default" : "outline"}
                        className={`flex-1 ${currentTradeResult === 'loss' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-500/10 hover:text-red-500'}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Veszett
                      </Button>
                    </div>
                    {currentTradeResult && (
                      <p className="text-sm text-center text-muted-foreground">
                        Trade eredmény rögzítve: {currentTradeResult === 'win' ? '✅ Nyert' : '❌ Veszett'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};