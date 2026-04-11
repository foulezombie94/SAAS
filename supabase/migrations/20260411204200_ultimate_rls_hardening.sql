-- 🛰️ ULTIMATE SAAS RLS HARDENING MIGRATION
-- Pattern: (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL)
-- No plan-based logic in RLS.

-- 1. Hardening INTERVENTIONS
DROP POLICY IF EXISTS "Users can only see their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can insert their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can update their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can delete their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can manage their own interventions" ON public.interventions;

CREATE POLICY "Users can manage their own interventions" ON public.interventions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 2. Hardening PROFILES (No self-delete allowed via RLS)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Hardening CORE TABLES (Adding user_id IS NOT NULL to WITH CHECK)
-- Clients
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
CREATE POLICY "Users can manage own clients" ON public.clients
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Quotes
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.quotes;
CREATE POLICY "Users can manage own quotes" ON public.quotes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Invoices
DROP POLICY IF EXISTS "Users can manage their own invoices" ON public.invoices;
CREATE POLICY "Users can manage their own invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 4. Cleanup legacy plan-based policies
DROP POLICY IF EXISTS "Artisans can see their quotes based on JWT Plan" ON public.quotes;
DROP POLICY IF EXISTS "Users can view invoices based on JWT Plan" ON public.invoices;
DROP POLICY IF EXISTS "Users can see clients based on JWT Plan" ON public.clients;
