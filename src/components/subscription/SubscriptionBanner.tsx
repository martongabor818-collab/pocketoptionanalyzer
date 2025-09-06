import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export const SubscriptionBanner = () => {
  const { subscription, loading, checkSubscription } = useSubscription();

  if (loading) {
    return (
      <Card className="mb-6 p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Checking subscription...</span>
        </div>
      </Card>
    );
  }

  if (!subscription?.subscribed) {
    return (
      <Card className="mb-6 p-4 border-primary/20 bg-gradient-upload">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Free Trial</p>
              <p className="text-sm text-muted-foreground">
                Upgrade to unlock unlimited AI analyses and advanced features
              </p>
            </div>
          </div>
          <Button size="sm">
            Upgrade Now
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 p-4 border-primary/50 bg-gradient-primary/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="h-5 w-5 text-primary" />
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium">{subscription.subscription_tier} Plan</p>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {subscription.subscription_end 
                ? `Renews ${new Date(subscription.subscription_end).toLocaleDateString()}`
                : 'Active subscription'
              }
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={checkSubscription}
          className="flex items-center space-x-1"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </Button>
      </div>
    </Card>
  );
};