-- ============================================================
-- ARTISANFLOW : 05 - TRIGGERS & STORAGE
-- ============================================================

-- ──────────────────────────────────────────────
-- TRIGGERS : Mise à jour automatique de updated_at
-- ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_quotes ON public.quotes;
CREATE TRIGGER set_updated_at_quotes
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_interventions ON public.interventions;
CREATE TRIGGER set_updated_at_interventions
    BEFORE UPDATE ON public.interventions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────
-- TRIGGER : Création automatique du profil
-- quand un utilisateur s'inscrit via Auth
-- ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────
-- STORAGE : Bucket pour les signatures
-- ──────────────────────────────────────────────
-- À créer manuellement dans le Dashboard Supabase :
-- 1. Aller dans Storage > New Bucket
-- 2. Nom : "signatures"
-- 3. Public : OUI (les URLs sont partagées dans les devis)
-- 4. Allowed MIME types : image/png, image/jpeg, image/webp
-- 5. Max file size : 2 MB

-- Politique Storage (à ajouter via Dashboard ou SQL) :
-- INSERT : service_role uniquement (upload via Admin Client)
-- SELECT : public (lecture des signatures sur les devis)

-- ──────────────────────────────────────────────
-- REALTIME : Activation pour les notifications
-- ──────────────────────────────────────────────
-- Activation automatique via SQL :
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Ajouter ou rafraîchir les tables cœurs à la publication
-- Note : On utilise SET pour s'assurer que la liste est exacte même après plusieurs exécutions
ALTER PUBLICATION supabase_realtime SET TABLE 
    public.quotes, 
    public.profiles, 
    public.invoices, 
    public.interventions;

-- Configurer REPLICA IDENTITY FULL pour permettre la comparaison old/new dans l'app
-- (Indispensable pour les toasts de notification)
ALTER TABLE public.quotes REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;

-- ──────────────────────────────────────────────
-- BACKFILL : Synchronisation des profils existants
-- ──────────────────────────────────────────────
-- Assure que tous les utilisateurs Auth ont une ligne dans public.profiles
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────
-- EXTENSIONS REQUISES
-- ──────────────────────────────────────────────
-- Ces extensions sont activées par défaut sur Supabase.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
