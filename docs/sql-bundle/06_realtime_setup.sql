-- ============================================================
-- ARTISANFLOW : 06 - REALTIME SETUP
-- ============================================================
-- Ce script configure la publication Supabase Realtime pour 
-- permettre la synchronisation instantanée du Dashboard.
-- ============================================================

-- 1. Nettoyage de la publication existante (si applicable)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 2. Création de la publication pour les tables clés
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.quotes, 
    public.profiles, 
    public.invoices, 
    public.interventions;

-- 3. Configuration de REPLICA IDENTITY FULL
-- Indispensable pour que Supabase envoie l'état 'old' et 'new' 
-- permettant de détecter précisément les changements de statut.
ALTER TABLE public.quotes REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.interventions REPLICA IDENTITY FULL;

-- 4. Note sur l'activation
-- Assurez-vous que l'extension 'pg_net' ou la configuration Realtime
-- est activée dans votre tableau de bord Supabase (Database -> Replication).
