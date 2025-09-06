import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, Sparkles, Eye, BarChart3, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { AnalysisResult } from '@/components/analysis/AnalysisResult';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { useTradingStats } from '@/hooks/useTradingStats';

export const ScreenshotAnalyzer = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [currentTradeResult, setCurrentTradeResult] = useState<'win' | 'loss' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { stats: tradeStats, updateStats } = useTradingStats();
  const { isAnalyzing, progress, analysisResult, analyzeImage, clearAnalysis } = useImageAnalysis();

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
              setFileName(`Pasted Image - ${new Date().toLocaleTimeString()}`);
              clearAnalysis();
              toast({
                title: "Image Pasted",
                description: "Screenshot pasted from clipboard (Ctrl+V).",
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
  }, [toast, clearAnalysis]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        clearAnalysis();
        toast({
          title: "Image Uploaded",
          description: "Screenshot uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  }, [toast, clearAnalysis]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    await analyzeImage(uploadedImage);
  };

  const markTradeResult = async (result: 'win' | 'loss') => {
    if (currentTradeResult) return; // Prevent double marking

    setCurrentTradeResult(result);
    
    // Update stats in database
    await updateStats(result === 'win');

    toast({
      title: result === 'win' ? "Winning Trade!" : "Losing Trade",
      description: `Statistics updated. Win rate: ${tradeStats.win_rate.toFixed(1)}%`,
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
    clearAnalysis();
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
              onClick={handleAnalyze}
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
          <AnalysisResult
            result={analysisResult}
            currentTradeResult={currentTradeResult}
            onReanalyze={handleAnalyze}
            onClear={clearImage}
            onMarkTradeResult={markTradeResult}
          />
        )}
      </div>
    </div>
  );
};