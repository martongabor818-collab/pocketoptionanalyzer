import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, Sparkles, Eye, Download, Trash2, X, TrendingUp, TrendingDown, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTradingStats } from '@/hooks/useTradingStats';

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

export const ScreenshotAnalyzer = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentTradeResult, setCurrentTradeResult] = useState<'win' | 'loss' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { stats: tradeStats, loading: statsLoading, updateStats } = useTradingStats();

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
    if (!user) {
      toast({
        title: "Bejelentkezés szükséges",
        description: "Kérlek jelentkezz be a képelemzéshez.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedImage) {
      toast({
        title: "Nincs kép",
        description: "Kérlek tölts fel egy képet először.",
        variant: "destructive",
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
      const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
        body: { imageData: uploadedImage }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Failed to analyze screenshot');
      }

      if (!data?.analysis) {
        throw new Error('Invalid response from analysis service');
      }

      // Parse the AI response into structured format
      const analysis = data.analysis.content;
      const lines = analysis.split('\n').filter(line => line.trim());
      const type = lines.find(line => line.includes('BUY') || line.includes('SELL') || line.includes('CALL') || line.includes('PUT'))?.replace(/^\d+\.?\s*/, '') || 'Általános tartalom';
      const content = lines.slice(0, 3).join(' ');
      const details = lines.slice(1).filter(line => line.trim() && !line.includes('Válasz')).map(line => line.replace(/^\d+\.?\s*/, '').trim());

      setAnalysisResult({
        type: type.replace(/[^:]*:\s*/, ''),
        content: content,
        confidence: data.analysis.confidence || 95,
        details: details.slice(0, 6)
      });

      // Analysis count is now tracked automatically in the database

      toast({
        title: "Elemzés befejezve",
        description: "A screenshot AI elemzése sikeresen befejeződött.",
      });

    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      console.error('API hiba:', error);
      
      let errorMessage = 'Az API hívás sikertelen.';
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          errorMessage = 'Hitelesítési hiba. Kérlek jelentkezz be újra.';
        } else if (error.message.includes('Invalid image')) {
          errorMessage = 'Érvénytelen képformátum vagy méret. Használj JPEG, PNG, GIF vagy WebP formátumot, maximum 10MB méretben.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Túl sok kérés. Kérlek próbáld újra később.';
        }
      }
      
      toast({
        title: "Hiba történt",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const markTradeResult = async (result: 'win' | 'loss') => {
    if (currentTradeResult) return; // Prevent double marking

    setCurrentTradeResult(result);
    
    // Update stats in database
    await updateStats(result === 'win');

    toast({
      title: result === 'win' ? "Nyerő trade!" : "Vesztes trade",
      description: `Statisztika frissítve. Nyerési arány: ${tradeStats.win_rate.toFixed(1)}%`,
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
            AI-Powered Trading Signals
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            PocketOption Trading AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your M5 chart screenshot and get instant BUY/SELL signals with AI-powered analysis, 
            timing recommendations, and confidence levels.
          </p>
        </div>

        {/* Subscription Banner */}
        <SubscriptionBanner />

        {/* Statistics */}
        <Card className="p-6 bg-gradient-secondary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Trading Statistics
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-primary">{tradeStats.total_trades}</div>
              <div className="text-sm text-muted-foreground">Analyses</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-green-500">{tradeStats.wins}</div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-red-500">{tradeStats.losses}</div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-primary">{tradeStats.win_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
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
                    {isDragActive ? 'Drop the file here' : 'Upload Screenshot'}
                  </h3>
                  <p className="text-muted-foreground">
                    Drag & drop your M5 chart here, click to browse, or use <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+V</kbd> to paste
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports PNG, JPG, JPEG, GIF, BMP, WebP formats
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded screenshot"
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
                  Analyzing...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  Analyze Screenshot
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
                <span className="text-sm font-medium">AI analysis in progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                AI is processing the chart and analyzing market patterns...
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
                  Trading Signal
                </h3>
                <Badge className="bg-success/20 text-success-foreground border-success/40">
                  {analysisResult.confidence}% confidence
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