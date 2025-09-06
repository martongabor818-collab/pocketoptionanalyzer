-- Fix security vulnerability in subscribers table RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Insert subscription info" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- Create secure INSERT policy - only authenticated users can create their own subscription records
CREATE POLICY "Users can insert their own subscription" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create secure UPDATE policy - only service role can update (for edge functions)
-- Edge functions use service role key to bypass RLS for legitimate subscription updates
CREATE POLICY "Service role can update subscriptions" ON public.subscribers
FOR UPDATE
USING (auth.role() = 'service_role');

-- Keep existing SELECT policy as it's properly scoped to user's own data
-- Policy "Users can view their own subscription" is already secure