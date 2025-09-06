import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AnalysisService, type AnalysisResponse } from '@/components/analysis/AnalysisService';

export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const analyzeImage = async (imageData: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze images.",
        variant: "destructive",
      });
      return;
    }

    if (!imageData) {
      toast({
        title: "No Image",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting image analysis...');
    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResult(null);
    
    // Animate progress
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
      console.log('Calling analysis service...');
      const result = await AnalysisService.analyzeImage(imageData);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      console.log('Analysis completed:', result);
      setAnalysisResult(result);

      toast({
        title: "Analysis Complete",
        description: "AI analysis has been completed successfully.",
      });

    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      console.error('Analysis error:', error);
      
      let errorMessage = 'Analysis failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication error. Please sign in again.';
        } else if (error.message.includes('Invalid image')) {
          errorMessage = 'Invalid image format. Please use JPEG, PNG, GIF, or WebP format, max 10MB.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please try again later.';
        }
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setProgress(0);
  };

  return {
    isAnalyzing,
    progress,
    analysisResult,
    analyzeImage,
    clearAnalysis
  };
};