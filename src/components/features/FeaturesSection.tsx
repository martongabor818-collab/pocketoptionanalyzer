import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Brain, Target, Zap, TrendingUp, Shield } from 'lucide-react';

const features = [
  {
    icon: <Camera className="h-8 w-8" />,
    title: "Screenshot Analysis",
    description: "Upload your PocketOption trading screenshots and get instant AI-powered analysis of market conditions, trends, and trading opportunities.",
    color: "text-blue-500"
  },
  {
    icon: <Brain className="h-8 w-8" />,
    title: "Advanced AI Analysis",
    description: "Our cutting-edge AI analyzes chart patterns, technical indicators, support/resistance levels, and market sentiment in real-time.",
    color: "text-purple-500"
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Precise Trading Signals",
    description: "Get clear BUY/SELL signals with entry points, target prices, stop-loss levels, and confidence ratings for each trade recommendation.",
    color: "text-green-500"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Instant Results",
    description: "Receive comprehensive trading analysis within seconds. No waiting, no delays - just fast, accurate market insights.",
    color: "text-yellow-500"
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Market Trend Detection",
    description: "Identify bullish and bearish trends, breakout patterns, and market momentum to make informed trading decisions.",
    color: "text-indigo-500"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Risk Management",
    description: "Get risk level assessments and position sizing recommendations to protect your capital and maximize profits.",
    color: "text-red-500"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            AI-Powered Trading Analysis
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your PocketOption trading with our advanced AI screenshot analysis. 
            Simply upload a screenshot of your trading chart and get instant, professional-grade market analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 bg-background rounded-xl ${feature.color}`}>
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              🚀 How to Use Our AI Trading Assistant
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Upload Screenshot</h4>
                  <p className="text-sm text-muted-foreground">
                    Take a screenshot of your PocketOption trading chart and upload it to our platform
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-2">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes patterns, indicators, and market conditions in seconds
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Get Signals</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive clear trading signals with entry points, targets, and risk levels
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};