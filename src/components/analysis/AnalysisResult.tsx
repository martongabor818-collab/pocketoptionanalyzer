import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Upload, CheckCircle, XCircle } from 'lucide-react';

interface AnalysisData {
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

interface AnalysisResultProps {
  result: AnalysisData;
  currentTradeResult: 'win' | 'loss' | null;
  onReanalyze: () => void;
  onClear: () => void;
  onMarkTradeResult: (result: 'win' | 'loss') => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  result,
  currentTradeResult,
  onReanalyze,
  onClear,
  onMarkTradeResult
}) => {
  return (
    <Card className="p-6 bg-gradient-secondary border-primary/20 shadow-card">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Trading Signal
          </h3>
          <Badge className="bg-success/20 text-success-foreground border-success/40">
            {result.confidence}% confidence
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className={`text-lg font-semibold mb-2 ${
              result.type.toUpperCase().includes('BUY') 
                ? 'text-green-500' 
                : result.type.toUpperCase().includes('SELL')
                ? 'text-red-500'
                : 'text-primary'
            }`}>
              Signal: {result.type}
            </h4>
            {/* Short Reasoning - Prominently displayed */}
            {result.reasoning && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <h4 className="text-sm font-semibold text-primary mb-2">📋 Short Explanation:</h4>
                <p className="text-foreground font-medium leading-relaxed">
                  {result.reasoning.length > 150 ? result.reasoning.substring(0, 150) + '...' : result.reasoning}
                </p>
              </div>
            )}

            {/* Main Analysis Content */}
            <div className="p-4 rounded-lg bg-card/30 border border-border/50 mb-4">
              <p className="text-foreground/90 leading-relaxed">
                {result.content.length > 200 ? result.content.substring(0, 200) + '...' : result.content}
              </p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {result.timeframe && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Trade Duration:</span>
                  <Badge variant="secondary" className="font-bold">
                    {result.timeframe}
                  </Badge>
                </div>
              )}
              {result.riskLevel && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge variant={result.riskLevel === 'LOW' ? 'default' : result.riskLevel === 'MEDIUM' ? 'secondary' : 'destructive'}>
                    {result.riskLevel}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Key Trading Levels */}
          {(result.entryPoint || result.targetPrice || result.stopLoss) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-card/50 border border-border/50">
              {result.entryPoint && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Entry Point</div>
                  <div className="text-lg font-bold text-primary">{result.entryPoint}</div>
                </div>
              )}
              {result.targetPrice && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Target</div>
                  <div className="text-lg font-bold text-green-500">{result.targetPrice}</div>
                </div>
              )}
              {result.stopLoss && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Stop Loss</div>
                  <div className="text-lg font-bold text-red-500">{result.stopLoss}</div>
                </div>
              )}
            </div>
          )}

          {/* Risk and Timeframe */}
          {(result.riskLevel || result.timeframe) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.riskLevel && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge variant={result.riskLevel === 'LOW' ? 'default' : result.riskLevel === 'MEDIUM' ? 'secondary' : 'destructive'}>
                    {result.riskLevel}
                  </Badge>
                </div>
              )}
              {result.timeframe && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Timeframe:</span>
                  <span className="text-sm text-muted-foreground">{result.timeframe}</span>
                </div>
              )}
            </div>
          )}

          {/* Detailed Analysis */}
          {result.details.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Technical Analysis:</h4>
              <div className="grid gap-2">
                {result.details.slice(0, 8).map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <span className="text-foreground/80 text-sm">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {result.reasoning && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Analysis Reasoning:</h4>
              <p className="text-foreground/80 leading-relaxed text-sm bg-card/30 p-3 rounded-lg">
                {result.reasoning}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-border/50">
            <div className="flex gap-3 mb-4">
              <Button
                onClick={onReanalyze}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Re-analyze
              </Button>
              <Button
                onClick={onClear}
                variant="outline"
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                New Image
              </Button>
            </div>
            
            {/* Trade Result Buttons */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-center text-muted-foreground">
                Mark Trade Result:
              </h4>
              <div className="flex gap-3">
                <Button
                  onClick={() => onMarkTradeResult('win')}
                  disabled={currentTradeResult !== null}
                  variant={currentTradeResult === 'win' ? "default" : "outline"}
                  className={`flex-1 ${currentTradeResult === 'win' ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-500/10 hover:text-green-500'}`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Win
                </Button>
                <Button
                  onClick={() => onMarkTradeResult('loss')}
                  disabled={currentTradeResult !== null}
                  variant={currentTradeResult === 'loss' ? "default" : "outline"}
                  className={`flex-1 ${currentTradeResult === 'loss' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-500/10 hover:text-red-500'}`}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Loss
                </Button>
              </div>
              {currentTradeResult && (
                <p className="text-sm text-center text-muted-foreground">
                  Trade result saved: {currentTradeResult === 'win' ? '✅ Win' : '❌ Loss'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};