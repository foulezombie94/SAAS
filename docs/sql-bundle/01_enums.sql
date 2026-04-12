-- ============================================================
-- ARTISANFLOW : 01 - ENUMS (Types Personnalisés)
-- ============================================================
-- Exécuter EN PREMIER avant toutes les autres migrations.
-- ============================================================

-- Statuts de Devis (Cycle de vie complet)
DO $$ BEGIN
    CREATE TYPE public.quote_status AS ENUM (
        'draft',      -- Brouillon (non envoyé)
        'sent',       -- Envoyé au client
        'accepted',   -- Signé par le client
        'rejected',   -- Refusé par le client
        'invoiced',   -- Facture générée
        'paid',       -- Payé (via Stripe ou virement)
        'overdue',    -- En retard de paiement
        'cancelled',  -- Annulé par l'artisan
        'expired'     -- Expiré (dépassé la validité)
    );
EXCEPTION
    WHEN duplicate_object THEN RAISE NOTICE 'Type quote_status existe déjà.';
END $$;

-- Statuts de Facture
DO $$ BEGIN
    CREATE TYPE public.invoice_status AS ENUM (
        'draft',      -- Brouillon
        'sent',       -- Envoyée au client
        'paid',       -- Payée
        'overdue',    -- En retard
        'cancelled'   -- Annulée
    );
EXCEPTION
    WHEN duplicate_object THEN RAISE NOTICE 'Type invoice_status existe déjà.';
END $$;
