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

    console.log('Raw analysis data received:', data.analysis);
    return this.parseAnalysisResponse(data.analysis);
  }

  private static parseAnalysisResponse(analysis: any): AnalysisResponse {
    const content = analysis.content || '';
    console.log('Parsing content:', content);
    const lines = content.split('\n').filter((line: string) => line.trim());
    
    // Extract signal type more aggressively
    let type = 'BUY Signal'; // Default to BUY
    
    // Look for explicit BUY/SELL mentions in various formats
    const signalTypeSection = content.match(/###\s*SIGNAL TYPE[:\s]*([^\n#]+)/i) ||
                             content.match(/###\s*JELTÍPUS[:\s]*([^\n#]+)/i) ||
                             content.match(/👉\s*([^\n]+)/i);
    
    if (signalTypeSection) {
      const signalText = signalTypeSection[1].trim().toUpperCase();
      console.log('Found signal text:', signalText);
      if (signalText.includes('SELL') || signalText.includes('PUT')) {
        type = 'SELL Signal';
      } else if (signalText.includes('BUY') || signalText.includes('CALL')) {
        type = 'BUY Signal';
      }
    } else {
      // Fallback: scan entire content for BUY/SELL
      const sellCount = (content.toUpperCase().match(/SELL|PUT/g) || []).length;
      const buyCount = (content.toUpperCase().match(/BUY|CALL/g) || []).length;
      
      if (sellCount > buyCount) {
        type = 'SELL Signal';
      }
    }
    console.log('Final signal type:', type);

    // Extract structured data if available
    const entryPoint = analysis.details?.entryPoint || this.extractValue(content, 'ENTRY POINT') || this.extractValue(content, 'BELÉPÉSI PONT');
    const targetPrice = analysis.details?.targetPrice || this.extractValue(content, 'TARGET PRICE') || this.extractValue(content, 'CÉL ÁR');
    const stopLoss = analysis.details?.stopLoss || this.extractValue(content, 'STOP LOSS');
    const riskLevel = analysis.details?.riskLevel || this.extractValue(content, 'RISK ASSESSMENT') || this.extractValue(content, 'KOCKÁZAT');
    const timeframe = analysis.details?.timeframe || this.extractValue(content, 'TIMEFRAME') || this.extractValue(content, 'IDŐKERET') || this.extractValue(content, '⏱');
    const reasoning = analysis.details?.reasoning || this.extractValue(content, 'REASONING') || this.extractValue(content, 'INDOKLÁS') || this.extractValue(content, '➝');

    console.log('Analysis details:', analysis.details);
    console.log('Extracted reasoning:', reasoning);
    console.log('Extracted timeframe:', timeframe);

    // Create detailed analysis points
    const details = this.extractAnalysisDetails(content);

    // Extract confidence more reliably
    let confidence = 75; // Default
    const confidenceMatch = content.match(/###\s*CONFIDENCE[:\s]*(\d+)%?/i) || 
                           content.match(/###\s*MEGBÍZHATÓSÁG[:\s]*(\d+)%?/i) ||
                           content.match(/(\d+)%\s*confidence/i);
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1]) || 75;
    }

    console.log('Final parsed result:', {
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
    });

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
      new RegExp(`\\*\\*${field}\\*\\*[:\\s]*([^\n]+)`, 'i'),
      // Additional English patterns
      new RegExp(`###\\s*SIGNAL\\s*TYPE[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*CONFIDENCE[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*ANALYSIS[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*ENTRY\\s*POINT[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*TARGET\\s*PRICE[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*STOP\\s*LOSS[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*KOCKÁZAT[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*IDŐKERET[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`###\\s*INDOKLÁS[:\\s]*([^#\n]+)`, 'i'),
      new RegExp(`👉\\s*([^\n]+)`, 'i'),
      new RegExp(`➝\\s*([^\n]+)`, 'i'),
      new RegExp(`⏱\\s*([^\n]+)`, 'i')
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