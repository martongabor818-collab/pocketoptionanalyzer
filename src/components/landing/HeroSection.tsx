import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart3, TrendingUp, Zap } from 'lucide-react';

export const HeroSection = () => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    pricingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-secondary overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <Badge variant="secondary" className="mb-6 text-sm">
          <Zap className="h-4 w-4 mr-2" />
          AI-Powered Trading Signals
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Master PocketOption
          <br />
          <span className="text-foreground">with AI Precision</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Get real-time trading signals with advanced AI analysis. 
          Upload your M5 charts and receive instant BUY/SELL recommendations 
          with confidence levels and precise timing.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" className="text-lg px-8" onClick={scrollToPricing}>
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
            <BarChart3 className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Smart Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Advanced EMA, RSI, and Bollinger Band analysis with AI-enhanced pattern recognition
            </p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
            <TrendingUp className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Precise Timing</h3>
            <p className="text-sm text-muted-foreground">
              Get exact entry timing with 2-5 minute trade recommendations based on signal strength
            </p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
            <Zap className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Instant Results</h3>
            <p className="text-sm text-muted-foreground">
              Upload screenshot, get signal in seconds. Track your wins and improve your trading strategy
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};