-- Fix critical RLS policy for subscribers table
-- Remove overly permissive email-based access and restrict to user_id only

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- Create secure RLS policies that only allow access based on user_id
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create secure trading statistics table to replace localStorage
CREATE TABLE IF NOT EXISTS public.user_trading_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_trades INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_trades = 0 THEN 0 
      ELSE ROUND((wins::DECIMAL / total_trades) * 100, 2) 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on trading stats
ALTER TABLE public.user_trading_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trading stats
CREATE POLICY "Users can view their own trading stats" 
ON public.user_trading_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading stats" 
ON public.user_trading_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading stats" 
ON public.user_trading_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_trading_stats_updated_at
BEFORE UPDATE ON public.user_trading_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to safely update trading stats
CREATE OR REPLACE FUNCTION public.update_trading_stats(
  p_user_id UUID,
  p_is_win BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user can only update their own stats
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Insert or update trading stats
  INSERT INTO public.user_trading_stats (user_id, total_trades, wins, losses)
  VALUES (p_user_id, 1, CASE WHEN p_is_win THEN 1 ELSE 0 END, CASE WHEN p_is_win THEN 0 ELSE 1 END)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_trades = user_trading_stats.total_trades + 1,
    wins = user_trading_stats.wins + CASE WHEN p_is_win THEN 1 ELSE 0 END,
    losses = user_trading_stats.losses + CASE WHEN p_is_win THEN 0 ELSE 1 END,
    updated_at = now();
END;
$$;