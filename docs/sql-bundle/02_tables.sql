-- ============================================================
-- ARTISANFLOW : 02 - TABLES (V2 HARDENED)
-- ============================================================
-- CORRECTIONS APPLIQUÉES :
-- ✅ FIX : ON DELETE CASCADE/SET NULL sur toutes les FK
-- ✅ FIX : Contraintes CHECK sur les champs financiers
-- ============================================================

-- ──────────────────────────────────────────────
-- TABLE 1 : PROFILES (Identité Artisan)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    -- Identité
    id                         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email                      TEXT NOT NULL,
    first_name                 TEXT,
    last_name                  TEXT,
    full_name                  TEXT,
    company_name               TEXT,
    siret                      TEXT,
    address                    TEXT,
    phone                      TEXT,
    legal_form                 TEXT,   -- SASU, SARL, EI, etc.
    tva_intra                  TEXT,   -- N° TVA Intracommunautaire
    preferred_language         TEXT DEFAULT 'fr',

    -- Business Metadata
    annual_revenue             TEXT,
    num_contacts               TEXT,
    business_description       TEXT,

    -- Abonnement SaaS (Stripe Billing)
    is_pro                     BOOLEAN DEFAULT false,
    plan                       TEXT DEFAULT 'free',
    stripe_customer_id         TEXT,
    stripe_subscription_id     TEXT,
    current_period_end         TIMESTAMPTZ,

    -- Stripe Connect (Réception de paiements clients)
    stripe_account_id          TEXT,
    stripe_charges_enabled     BOOLEAN DEFAULT false,
    stripe_details_submitted   BOOLEAN DEFAULT false,
    statement_descriptor       TEXT,

    -- Configuration Email (SMTP Personnalisé)
    smtp_host                  TEXT,
    smtp_port                  INTEGER DEFAULT 465,
    smtp_user                  TEXT,
    smtp_pass                  TEXT,   -- ⚠️ Chiffré côté App (lib/encryption.ts)
    smtp_from                  TEXT,

    -- Notifications
    last_seen_notifications_at TIMESTAMPTZ,
    notification_preferences   JSONB DEFAULT '{"quotes_viewed": true, "quotes_accepted": true, "payments_received": true, "quotes_expired": true}'::jsonb,

    -- Timestamps
    updated_at                 TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- TABLE 2 : CLIENTS (CRM Artisan)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id        UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name           TEXT NOT NULL,
    email          TEXT,
    phone          TEXT,
    address        TEXT,
    city           TEXT,
    postal_code    TEXT,
    country        TEXT DEFAULT 'France',
    site_address   TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- TABLE 3 : QUOTES (Devis / Cœur Métier)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotes (
    id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id                   UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    client_id                 UUID REFERENCES public.clients ON DELETE CASCADE NOT NULL,
    number                    TEXT NOT NULL,
    status                    public.quote_status DEFAULT 'draft',

    -- Financier (avec contraintes d'intégrité)
    total_ht                  NUMERIC(15,2) DEFAULT 0 CHECK (total_ht >= 0),
    total_ttc                 NUMERIC(15,2) DEFAULT 0 CHECK (total_ttc >= 0),
    tax_rate                  NUMERIC(5,2) DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),

    -- Lien Public Sécurisé (Zero-Leak)
    public_token              TEXT,
    public_token_expires_at   TIMESTAMPTZ,

    -- Signature Électronique (Double Signature Requise)
    signature_url             TEXT, -- Legacy / Backup
    artisan_signature_url     TEXT,
    client_signature_url      TEXT,

    -- Paiement
    stripe_session_id         TEXT,
    payment_method            TEXT,
    payment_details           JSONB,
    paid_at                   TIMESTAMPTZ,

    -- Validité & Tracking
    valid_until               TIMESTAMPTZ,
    estimated_start_date      DATE,
    estimated_duration        TEXT,
    last_viewed_at            TIMESTAMPTZ,

    -- Timestamps
    created_at                TIMESTAMPTZ DEFAULT now(),
    updated_at                TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- TABLE 4 : QUOTE_ITEMS (Lignes de Devis)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_items (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id       UUID REFERENCES public.quotes ON DELETE CASCADE NOT NULL,
    description    TEXT NOT NULL,
    quantity       NUMERIC(15,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price     NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    total_price    NUMERIC(15,2) CHECK (total_price >= 0),
    tax_rate       NUMERIC(5,2) DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    total_ht       NUMERIC(15,2),
    total_ttc      NUMERIC(15,2),
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- TABLE 5 : INVOICES (Factures)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id            UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    client_id          UUID REFERENCES public.clients ON DELETE CASCADE NOT NULL,
    quote_id           UUID REFERENCES public.quotes ON DELETE SET NULL,  -- ✅ FIX : SET NULL si le devis est supprimé
    number             TEXT NOT NULL,
    status             public.invoice_status DEFAULT 'draft',
    total_ht           NUMERIC(15,2) DEFAULT 0 CHECK (total_ht >= 0),
    total_ttc          NUMERIC(15,2) DEFAULT 0 CHECK (total_ttc >= 0),
    tax_rate           NUMERIC(5,2) DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    due_date           DATE,
    stripe_session_id  TEXT,
    created_at         TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- TABLE 6 : INVOICE_ITEMS (Lignes de Facture)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id     UUID REFERENCES public.invoices ON DELETE CASCADE NOT NULL,
    description    TEXT NOT NULL,
    quantity       NUMERIC(15,2) DEFAULT 1 CHECK (quantity > 0),
    unit_price     NUMERIC(15,2) DEFAULT 0 CHECK (unit_price >= 0),
    total_price    NUMERIC(15,2) CHECK (total_price >= 0),
    tax_rate       NUMERIC(5,2) DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    total_ht       NUMERIC(15,2),
    total_ttc      NUMERIC(15,2),
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- TABLE 7 : INTERVENTIONS (Calendrier Chantier)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interventions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    client_id       UUID REFERENCES public.clients ON DELETE SET NULL,   -- ✅ FIX : SET NULL
    quote_id        UUID REFERENCES public.quotes ON DELETE SET NULL,    -- ✅ FIX : SET NULL (l'intervention reste)
    title           TEXT NOT NULL,
    description     TEXT,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    status          TEXT DEFAULT 'planned',
    reminder_sent   BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),

    -- ✅ Contrainte : fin après début
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- ──────────────────────────────────────────────
-- TABLE 8 : WEBHOOK_LOGS (Audit Stripe)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type     TEXT,
    payload        JSONB,
    error          TEXT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- INDEX DE PERFORMANCE
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON public.quotes(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON public.interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_client_id ON public.interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
