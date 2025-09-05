import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, Sparkles, Eye, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AnalysisResult {
  type: string;
  content: string;
  confidence: number;
  details: string[];
}

export const ScreenshotAnalyzer = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

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
    setIsAnalyzing(true);
    setProgress(0);
    
    // Simulate AI analysis with progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    clearInterval(progressInterval);
    setProgress(100);

    // Mock analysis result
    const mockResults: AnalysisResult[] = [
      {
        type: "Webes felület",
        content: "Ez egy modern webalkalmazás dashboardja vagy felhasználói felülete.",
        confidence: 94,
        details: [
          "Responsz design elemek észlelve",
          "Navigációs menü a bal oldalon",
          "Sötét téma használata", 
          "Interaktív elemek: gombok, inputok",
          "Professzionális tipográfia"
        ]
      },
      {
        type: "Mobil alkalmazás",
        content: "Egy mobilalkalmazás felhasználói felülete natív vagy hibrid technológiával.",
        confidence: 87,
        details: [
          "Mobil-optimalizált layout",
          "Touch-friendly gombok",
          "Állapotsor látható",
          "Tab navigáció az alján",
          "Gesture-alapú interakciók"
        ]
      },
      {
        type: "Szöveges tartalom",
        content: "A screenshot főként szöveges tartalmat tartalmaz, például dokumentum vagy cikk.",
        confidence: 78,
        details: [
          "Strukturált szöveg formázás",
          "Címsorok és bekezdések",
          "Esetlegesen táblázatok",
          "Linkek és kiemelések",
          "Olvasható betűméret"
        ]
      }
    ];

    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    setAnalysisResult(randomResult);
    setIsAnalyzing(false);

    toast({
      title: "Elemzés befejezve",
      description: `A screenshot elemzése ${randomResult.confidence}% biztonsággal befejeződött.`,
    });
  };

  const clearImage = () => {
    setUploadedImage(null);
    setFileName('');
    setAnalysisResult(null);
    setProgress(0);
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
                  <div className="flex gap-3">
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
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};