import { supabase } from '@/integrations/supabase/client';

export interface AnalysisResponse {
  type: string;
  content: string;
  confidence: number;
  details: string[];
  entryPoint?: string;
  targetPrice?: string;
  stopLoss?: string;
  riskLevel?: string;
  timeframe?: string;
  reasoning?: string;
}

export class AnalysisService {
  static async analyzeImage(imageData: string): Promise<AnalysisResponse> {
    const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
      body: { imageData }
    });

    if (error) {
      console.error('Analysis API error:', error);
      throw new Error(error.message || 'Failed to analyze screenshot');
    }

    if (!data?.analysis) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from analysis service');
    }

    return this.parseAnalysisResponse(data.analysis);
  }

  private static parseAnalysisResponse(analysis: any): AnalysisResponse {
    const content = analysis.content || '';
    const lines = content.split('\n').filter((line: string) => line.trim());
    
    // Extract signal type more aggressively
    let type = 'BUY Signal'; // Default to BUY
    
    // Look for explicit BUY/SELL mentions
    const signalTypeSection = content.match(/###\s*SIGNAL TYPE[:\s]*([^\n#]+)/i);
    if (signalTypeSection) {
      const signalText = signalTypeSection[1].trim().toUpperCase();
      if (signalText.includes('SELL')) {
        type = 'SELL Signal';
      } else if (signalText.includes('BUY')) {
        type = 'BUY Signal';
      }
    } else {
      // Fallback: scan entire content for BUY/SELL
      const sellCount = (content.toUpperCase().match(/SELL/g) || []).length;
      const buyCount = (content.toUpperCase().match(/BUY/g) || []).length;
      
      if (sellCount > buyCount) {
        type = 'SELL Signal';
      }
    }

    // Extract structured data if available
    const entryPoint = analysis.details?.entryPoint || this.extractValue(content, 'ENTRY POINT');
    const targetPrice = analysis.details?.targetPrice || this.extractValue(content, 'TARGET PRICE');
    const stopLoss = analysis.details?.stopLoss || this.extractValue(content, 'STOP LOSS');
    const riskLevel = analysis.details?.riskLevel || this.extractValue(content, 'RISK ASSESSMENT');
    const timeframe = analysis.details?.timeframe || this.extractValue(content, 'TIMEFRAME');
    const reasoning = analysis.details?.reasoning || this.extractValue(content, 'REASONING');

    // Create detailed analysis points
    const details = this.extractAnalysisDetails(content);

    // Extract confidence more reliably
    let confidence = 75; // Default
    const confidenceMatch = content.match(/###\s*CONFIDENCE[:\s]*(\d+)%?/i) || 
                           content.match(/(\d+)%\s*confidence/i);
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1]) || 75;
    }

    return {
      type,
      content: this.getMainContent(content),
      confidence,
      details,
      entryPoint,
      targetPrice,
      stopLoss,
      riskLevel,
      timeframe,
      reasoning
    };
  }

  private static extractValue(text: string, field: string): string {
    const patterns = [
      new RegExp(`###\\s*${field}[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`${field}[:\\s]*([^\n]+)`, 'i'),
      new RegExp(`\\*\\*${field}\\*\\*[:\\s]*([^\n]+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^\*+|\*+$/g, '').trim();
      }
    }
    return '';
  }

  private static extractAnalysisDetails(content: string): string[] {
    const details: string[] = [];
    const sections = content.split('###').filter(section => section.trim());
    
    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.trim());
      
      // Skip header lines and extract bullet points
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
          const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\*+|\*+$/g, '').trim();
          if (cleanLine && cleanLine.length > 10) {
            details.push(cleanLine);
          }
        }
      }
    }

    // If no structured details found, extract key sentences
    if (details.length === 0) {
      const sentences = content.split('.').filter(s => s.trim().length > 20);
      return sentences.slice(0, 6).map(s => s.trim());
    }

    return details.slice(0, 8);
  }

  private static getMainContent(content: string): string {
    // Get the first meaningful paragraph or summary
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 20);
    if (paragraphs.length > 0) {
      return paragraphs[0].replace(/###[^#\n]*/g, '').trim();
    }
    
    // Fallback to first few sentences
    const sentences = content.split('.').filter(s => s.trim().length > 10);
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }
}