-- Fix the user_trading_stats table by removing the foreign key constraint to auth.users
-- and using .maybeSingle() instead of .single() for better error handling

-- Drop the existing foreign key constraint
ALTER TABLE public.user_trading_stats 
DROP CONSTRAINT IF EXISTS user_trading_stats_user_id_fkey;

-- Make sure user_id column is still NOT NULL but without foreign key
ALTER TABLE public.user_trading_stats 
ALTER COLUMN user_id SET NOT NULL;