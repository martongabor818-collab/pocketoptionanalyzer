import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  priceId: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "24-Hour Pass",
    price: "€7.00",
    description: "Perfect for testing",
    features: [
      "🎯 Total access to premium signals",
      "📊 Complete coverage of all assets",
      "🧠 Advanced AI analysis in real-time",
      "⚡ Instant push notifications"
    ],
    popular: true,
    icon: <Star className="h-6 w-6" />,
    priceId: "24_hour_pass"
  },
  {
    name: "48-Hour Pass",
    price: "€12.00",
    description: "Smart choice for weekend traders",
    features: [
      "🎯 Total access to premium signals",
      "📊 Complete coverage of all assets",
      "🧠 Advanced AI analysis in real-time",
      "⚡ Instant push notifications",
      "🎧 Priority customer support 24/7"
    ],
    icon: <Zap className="h-6 w-6" />,
    priceId: "48_hour_pass"
  },
  {
    name: "Weekly",
    price: "€30.00",
    description: "Best choice for active traders",
    features: [
      "🎯 Total access to premium signals",
      "📊 Complete coverage of all assets",
      "🧠 Advanced AI analysis in real-time",
      "⚡ Instant push notifications",
      "🎧 Priority customer support 24/7",
      "📈 In-depth market analysis",
      "🛡️ Risk management strategies"
    ],
    popular: true,
    icon: <Zap className="h-6 w-6" />,
    priceId: "weekly_plan"
  },
  {
    name: "Monthly",
    price: "€85.00",
    description: "Most economical for long-term",
    features: [
      "🎯 Total access to premium signals",
      "📊 Complete coverage of all assets",
      "🧠 Advanced AI analysis in real-time",
      "⚡ Instant push notifications",
      "🎧 Dedicated VIP customer support",
      "📊 Institutional-grade market analysis",
      "🔧 Advanced risk management strategies",
      "👨‍💼 Personal trading advisor"
    ],
    icon: <Crown className="h-6 w-6" />,
    priceId: "monthly_plan"
  }
];

export const PricingSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-background to-secondary/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary">
            Unlock premium trading signals and improve your strategy.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div 
              key={tier.name} 
              className={`relative bg-white rounded-2xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                tier.popular ? 'border-blue-500 transform scale-105' : 'border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    ⭐ Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-blue-600 mb-3">{tier.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                </div>
                <p className="text-gray-600 text-sm font-medium">
                  {tier.description}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200" 
                onClick={() => handleSubscribe(tier.priceId)}
              >
                Get Started Now
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 text-sm">
            All plans include access to real-time signals, technical analysis, and market insights.
          </p>
        </div>
      </div>
    </section>
  );
};