-- ============================================================
-- ARTISANFLOW : 04 - ROW LEVEL SECURITY (V2 HARDENED)
-- ============================================================
-- CORRECTIONS DE SÉCURITÉ APPLIQUÉES :
-- ✅ FIX #1 : Suppression de USING(true) sur profiles (fuite massive)
-- ✅ FIX #2 : Suppression des SELECT anon ouverts sur quotes/items/invoices
-- ✅ Toutes les données publiques passent par des RPC SECURITY DEFINER
-- ============================================================

-- ──────────────────────────────────────────────
-- ACTIVATION RLS SUR TOUTES LES TABLES
-- ──────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs  ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- NETTOYAGE : Supprimer TOUTES les anciennes politiques
-- pour repartir de zéro (Idempotent)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles for quotes" ON public.profiles;
DROP POLICY IF EXISTS "Public viewing of profile info via quote token" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public can view quotes via token" ON public.quotes;
DROP POLICY IF EXISTS "Public viewing of quotes via token" ON public.quotes;
DROP POLICY IF EXISTS "Users can manage own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Public can view quote items via quote token" ON public.quote_items;
DROP POLICY IF EXISTS "Public viewing of quote items via parent token" ON public.quote_items;
DROP POLICY IF EXISTS "Users can manage their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public can view invoices via quote" ON public.invoices;
DROP POLICY IF EXISTS "Users can manage own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can manage their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Artisans can see their quotes based on JWT Plan" ON public.quotes;
DROP POLICY IF EXISTS "Users can view invoices based on JWT Plan" ON public.invoices;
DROP POLICY IF EXISTS "Users can see clients based on JWT Plan" ON public.clients;
DROP POLICY IF EXISTS "Users can only see their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can insert their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can update their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can delete their own interventions" ON public.interventions;

-- ──────────────────────────────────────────────
-- PROFILES : Authentifié uniquement, pas de anon
-- ──────────────────────────────────────────────
-- ⛔ SUPPRIMÉ : "Public can view profiles for quotes" USING (true)
--    RAISON : Exposait TOUS les profils (email, IBAN, SMTP) au public.
--    SOLUTION : Les données artisan pour les devis publics sont
--    retournées par la RPC get_public_quote_data() (voir 03_functions.sql)

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- ──────────────────────────────────────────────
-- CLIENTS : CRUD complet, isolé par user_id
-- ──────────────────────────────────────────────
CREATE POLICY "Users can manage own clients" ON public.clients
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- ──────────────────────────────────────────────
-- QUOTES : Authentifié uniquement
-- ──────────────────────────────────────────────
-- ⛔ SUPPRIMÉ : "Public can view quotes via token" USING (public_token IS NOT NULL)
--    RAISON : Ne vérifie pas si l'utilisateur CONNAÎT le token !
--    Un SELECT * retournait TOUS les devis partagés.
--    SOLUTION : Les clients accèdent aux devis via get_public_quote_data(token, id)

CREATE POLICY "Users can manage own quotes" ON public.quotes
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- ──────────────────────────────────────────────
-- QUOTE_ITEMS : Accès via le devis parent (auth only)
-- ──────────────────────────────────────────────
-- ⛔ SUPPRIMÉ : Politique anon sur quote_items
--    RAISON : Même faille que les quotes

CREATE POLICY "Users can manage own quote items" ON public.quote_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_items.quote_id
              AND quotes.user_id = auth.uid()
        )
    );

-- ──────────────────────────────────────────────
-- INVOICES : Authentifié uniquement
-- ──────────────────────────────────────────────
-- ⛔ SUPPRIMÉ : Politique anon sur invoices
--    RAISON : Exposait les factures liées à des devis publics

CREATE POLICY "Users can manage their own invoices" ON public.invoices
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- ──────────────────────────────────────────────
-- INVOICE_ITEMS : Accès via la facture parente (auth only)
-- ──────────────────────────────────────────────
CREATE POLICY "Users can manage own invoice items" ON public.invoice_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND invoices.user_id = auth.uid()
        )
    );

-- ──────────────────────────────────────────────
-- INTERVENTIONS : CRUD complet, isolé
-- ──────────────────────────────────────────────
CREATE POLICY "Users can manage their own interventions" ON public.interventions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- ──────────────────────────────────────────────
-- WEBHOOK_LOGS : AUCUN accès utilisateur
-- ──────────────────────────────────────────────
-- RLS activé + 0 politique = bloqué pour tout le monde.
-- Seul le service_role (Admin Client) peut écrire/lire.
-- C'est le comportement voulu.
