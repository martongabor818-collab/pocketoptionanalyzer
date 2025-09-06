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
    name: "Basic",
    price: "$9.99",
    description: "Perfect for beginners",
    features: [
      "10 AI analyses per day",
      "M5 chart signals",
      "Basic trend detection",
      "Email support"
    ],
    icon: <Star className="h-6 w-6" />,
    priceId: "basic_monthly"
  },
  {
    name: "Pro",
    price: "$29.99",
    description: "For serious traders",
    features: [
      "100 AI analyses per day",
      "All timeframes (M1, M5, M15)",
      "Advanced pattern recognition",
      "Risk management signals",
      "Priority support",
      "Trade history tracking"
    ],
    popular: true,
    icon: <Zap className="h-6 w-6" />,
    priceId: "pro_monthly"
  },
  {
    name: "Elite",
    price: "$79.99",
    description: "Professional trading suite",
    features: [
      "Unlimited AI analyses",
      "All timeframes + custom alerts",
      "Machine learning insights",
      "Advanced risk analytics",
      "24/7 priority support",
      "Custom trading strategies",
      "API access",
      "Personal trading coach"
    ],
    icon: <Crown className="h-6 w-6" />,
    priceId: "elite_monthly"
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
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Choose Your Plan
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with our free trial, then choose the plan that fits your trading style
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={tier.name} 
              className={`relative ${tier.popular ? 'border-primary shadow-glow' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {tier.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="text-base">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(tier.priceId)}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
};