import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ScreenshotAnalyzer } from '@/components/screenshot-analyzer';
import { Header } from '@/components/navigation/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { PricingSection } from '@/components/pricing/PricingSection';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <div id="pricing">
          <PricingSection />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <ScreenshotAnalyzer />
      </div>
    </div>
  );
};

export default Index;
