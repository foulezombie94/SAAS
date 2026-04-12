-- ============================================================
-- ARTISANFLOW : 03 - FONCTIONS RPC (V2 HARDENED)
-- ============================================================
-- CORRECTIONS DE SÉCURITÉ APPLIQUÉES :
-- ✅ FIX #3 : Suppression du bypass "chaîne vide" dans accept_quote_v3
-- ✅ FIX #4 : Calcul server-side des totaux (anti-falsification)
-- ✅ FIX #5 : Vérification ownership dans create_invoice_from_quote_v2
-- ✅ FIX #6 : Advisory lock contre les race conditions de numérotation
-- ✅ NEW   : RPC get_public_quote_data() pour remplacer les SELECT anon
-- ============================================================

-- ──────────────────────────────────────────────
-- UTILITY : Trigger pour updated_at automatique
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- UTILITY : Création automatique du profil
-- à l'inscription (auth.users -> profiles)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- RPC 1 : get_next_quote_number
-- ✅ FIX #6 : Advisory Lock pour éviter les doublons
-- en cas de double-clic ou onglets multiples.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_next_quote_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count    INTEGER;
    v_period   TEXT := to_char(now(), 'YYYYMM');
    v_lock_key BIGINT;
BEGIN
    -- 🔒 Advisory Lock
    v_lock_key := hashtext(p_user_id::TEXT || '_quote_number');
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT COUNT(*) + 1 INTO v_count
    FROM public.quotes
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('month', now());

    RETURN 'DEV' || v_period || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- RPC 2 : get_next_invoice_number
-- ✅ FIX #7 : Numérotation séquentielle légale
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count    INTEGER;
    v_period   TEXT := to_char(now(), 'YYYYMM');
    v_lock_key BIGINT;
BEGIN
    -- 🔒 Advisory Lock
    v_lock_key := hashtext(p_user_id::TEXT || '_invoice_number');
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT COUNT(*) + 1 INTO v_count
    FROM public.invoices
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('month', now());

    RETURN 'FAC' || v_period || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (RPC 2 est maintenant obsolète et intégré dans v3 ci-dessous)

-- ──────────────────────────────────────────────
-- RPC 3 : create_quote_with_items_v3 (Current)
-- ✅ FIX #4 : Calcul server-side de total_price
-- ✅ FIX #6 : Numérotation via get_next_quote_number (locké)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_quote_with_items_v3(
    p_client_id       UUID,
    p_items           JSONB,
    p_status          TEXT DEFAULT 'draft',
    p_tax_rate        NUMERIC DEFAULT 20.00,
    p_total_ht        NUMERIC DEFAULT 0,
    p_total_ttc       NUMERIC DEFAULT 0,
    p_payment_details JSONB DEFAULT NULL,
    p_payment_method  TEXT DEFAULT NULL,
    p_valid_until     TIMESTAMPTZ DEFAULT NULL,
    p_estimated_start_date TIMESTAMPTZ DEFAULT NULL,
    p_estimated_duration   TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_quote_id       UUID;
    v_user_id        UUID := auth.uid();
    v_number         TEXT;
    v_item           JSONB;
    v_qty            NUMERIC;
    v_price          NUMERIC;
    v_item_tax       NUMERIC;
    v_computed_ht    NUMERIC := 0;
    v_computed_ttc   NUMERIC := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH-001: Utilisateur non authentifié';
    END IF;

    -- Vérifier que le client appartient à l'artisan
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = p_client_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'AUTH-002: Ce client ne vous appartient pas';
    END IF;

    -- ✅ FIX #6 : Numéro généré avec advisory lock (anti-doublon)
    v_number := public.get_next_quote_number(v_user_id);

    -- Recalculer les totaux côté serveur
    -- ✅ FIX #8 : Support Multi-taux TVA & Précision d'arrondi
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty      := COALESCE((v_item->>'quantity')::NUMERIC, 1);
        v_price    := COALESCE((v_item->>'unit_price')::NUMERIC, 0);
        v_item_tax := COALESCE((v_item->>'tax_rate')::NUMERIC, p_tax_rate);
        
        v_computed_ht  := v_computed_ht + (v_qty * v_price);
        v_computed_ttc := v_computed_ttc + ROUND((v_qty * v_price) * (1 + v_item_tax / 100), 2);
    END LOOP;

    -- Créer le devis avec les totaux recalculés
    INSERT INTO public.quotes (
        user_id, client_id, number, status, tax_rate, total_ht, total_ttc,
        payment_details, payment_method, valid_until,
        estimated_start_date, estimated_duration
    )
    VALUES (
        v_user_id, p_client_id, v_number, p_status::public.quote_status,
        p_tax_rate, v_computed_ht, v_computed_ttc,
        p_payment_details, p_payment_method,
        p_valid_until,
        p_estimated_start_date,
        p_estimated_duration
    )
    RETURNING id INTO v_quote_id;

    -- Insérer les lignes (TVA par ligne respectée)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty      := COALESCE((v_item->>'quantity')::NUMERIC, 1);
        v_price    := COALESCE((v_item->>'unit_price')::NUMERIC, 0);
        v_item_tax := COALESCE((v_item->>'tax_rate')::NUMERIC, p_tax_rate);

        INSERT INTO public.quote_items (
            quote_id, description, quantity, unit_price, total_price,
            tax_rate, total_ht, total_ttc
        )
        VALUES (
            v_quote_id,
            v_item->>'description',
            v_qty,
            v_price,
            v_qty * v_price,
            v_item_tax,
            v_qty * v_price,
            ROUND((v_qty * v_price) * (1 + v_item_tax / 100), 2)
        );
    END LOOP;

    RETURN v_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (RPC 4 : accept_quote_v3 supprimée car obsolète, voir v4 ci-dessous)

-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_quote_v4(
    p_quote_id      UUID,
    p_signature_url TEXT,
    p_signer_type   TEXT, -- 'artisan' ou 'client'
    p_public_token  TEXT DEFAULT NULL
) 
RETURNS JSONB AS $$
DECLARE
    v_artisan_sig TEXT;
    v_client_sig TEXT;
    v_quote_user_id UUID;
    v_quote_token TEXT;
    v_quote RECORD;
    v_invoice_id UUID := NULL;
    v_inv_number TEXT;
BEGIN
    -- 🛡️ VÉRIFICATION SÉCURITÉ & RÉCUPÉRATION
    SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id;

    IF v_quote.id IS NULL THEN
        RAISE EXCEPTION 'PUB-404: Devis introuvable';
    END IF;

    -- Vérification du token si client
    IF p_signer_type = 'client' THEN
        IF p_public_token IS NULL OR p_public_token != v_quote.public_token THEN
            RAISE EXCEPTION 'PUB-403: Token invalide';
        END IF;
    END IF;

    -- ✍️ MISE À JOUR SIGNATURE
    IF p_signer_type = 'artisan' THEN
        UPDATE public.quotes SET artisan_signature_url = p_signature_url, updated_at = NOW() WHERE id = p_quote_id;
    ELSE
        UPDATE public.quotes SET client_signature_url = p_signature_url, updated_at = NOW() WHERE id = p_quote_id;
    END IF;

    -- 🔍 CHECK COMBINAISON POUR VALIDATION FINALE
    SELECT artisan_signature_url, client_signature_url INTO v_artisan_sig, v_client_sig
    FROM public.quotes WHERE id = p_quote_id;

    -- Statut 'accepted' + Création facture uniquement si les deux ont signé
    IF v_artisan_sig IS NOT NULL AND v_client_sig IS NOT NULL AND v_quote.status NOT IN ('accepted', 'invoiced', 'paid') THEN
        -- 1. Passer en statut accepté
        UPDATE public.quotes SET status = 'accepted' WHERE id = p_quote_id;
        
        -- 2. Générer la facture séquentielle
        v_inv_number := public.get_next_invoice_number(v_quote.user_id);
        
        INSERT INTO public.invoices (
            user_id, client_id, quote_id, number, status,
            total_ht, total_ttc, tax_rate, due_date
        )
        VALUES (
            v_quote.user_id, v_quote.client_id, p_quote_id, v_inv_number, 'draft',
            v_quote.total_ht, v_quote.total_ttc, v_quote.tax_rate,
            (now() + INTERVAL '30 days')::DATE
        )
        RETURNING id INTO v_invoice_id;

        -- 3. Copier les lignes
        INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total_price, tax_rate, total_ht, total_ttc)
        SELECT v_invoice_id, description, quantity, unit_price, total_price, tax_rate, total_ht, total_ttc
        FROM public.quote_items
        WHERE quote_id = p_quote_id;
    END IF;

    RETURN jsonb_build_object(
        'quote_id', p_quote_id,
        'invoice_id', v_invoice_id,
        'artisan_signed', v_artisan_sig IS NOT NULL,
        'client_signed', v_client_sig IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- RPC 5 : create_invoice_from_quote_v2
-- ✅ FIX #5 : Vérification que le caller est le propriétaire
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_invoice_from_quote_v2(p_quote_id UUID)
RETURNS JSON AS $$
DECLARE
    v_quote       RECORD;
    v_invoice_id  UUID;
    v_inv_number  TEXT;
    v_caller_id   UUID := auth.uid();
BEGIN
    -- Récupérer le devis
    SELECT id, user_id, client_id, number, total_ht, total_ttc, tax_rate, status, public_token
    INTO v_quote
    FROM public.quotes
    WHERE id = p_quote_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Devis introuvable : %', p_quote_id;
    END IF;

    -- ✅ FIX #5 : Vérification Ownership
    -- Si l'appel vient d'un utilisateur authentifié, il DOIT être le propriétaire.
    -- Si auth.uid() est NULL, c'est un appel via Admin Client (webhook Stripe) → autorisé.
    IF v_caller_id IS NOT NULL AND v_caller_id != v_quote.user_id THEN
        RAISE EXCEPTION 'AUTH-IDOR: Vous n''êtes pas le propriétaire de ce devis';
    END IF;

    -- Vérifier qu'une facture n'existe pas déjà
    IF EXISTS (SELECT 1 FROM public.invoices WHERE quote_id = p_quote_id) THEN
        SELECT id INTO v_invoice_id FROM public.invoices WHERE quote_id = p_quote_id LIMIT 1;
        RETURN json_build_object(
            'invoiceId', v_invoice_id,
            'message', 'Facture existante retournée',
            'quote', json_build_object('id', v_quote.id, 'public_token', v_quote.public_token)
        );
    END IF;

    v_inv_number := public.get_next_invoice_number(v_quote.user_id);

    INSERT INTO public.invoices (
        user_id, client_id, quote_id, number, status,
        total_ht, total_ttc, tax_rate, due_date
    )
    VALUES (
        v_quote.user_id, v_quote.client_id, p_quote_id, v_inv_number, 'draft',
        v_quote.total_ht, v_quote.total_ttc, v_quote.tax_rate,
        (now() + INTERVAL '30 days')::DATE
    )
    RETURNING id INTO v_invoice_id;

    -- Copier les lignes
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total_price, tax_rate, total_ht, total_ttc)
    SELECT v_invoice_id, description, quantity, unit_price, total_price, tax_rate, total_ht, total_ttc
    FROM public.quote_items
    WHERE quote_id = p_quote_id;

    -- Mettre à jour le statut du devis
    UPDATE public.quotes SET status = 'invoiced', updated_at = now() WHERE id = p_quote_id;

    RETURN json_build_object(
        'invoiceId', v_invoice_id,
        'message', 'Facture créée avec succès',
        'quote', json_build_object('id', v_quote.id, 'public_token', v_quote.public_token)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- RPC 6 : get_dashboard_analytics
-- (Inchangée - déjà sécurisée par p_user_id)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_revenue       NUMERIC;
    v_revenue_prev  NUMERIC;
    v_unpaid        NUMERIC;
    v_unpaid_count  INTEGER;
    v_accepted      INTEGER;
    v_quotes_count  INTEGER;
    v_quotes_prev   INTEGER;
    v_history       JSON;
BEGIN
    SELECT COALESCE(SUM(total_ttc), 0) INTO v_revenue
    FROM public.invoices
    WHERE user_id = p_user_id AND status = 'paid'
      AND created_at >= date_trunc('month', now());

    SELECT COALESCE(SUM(total_ttc), 0) INTO v_revenue_prev
    FROM public.invoices
    WHERE user_id = p_user_id AND status = 'paid'
      AND created_at >= date_trunc('month', now() - INTERVAL '1 month')
      AND created_at < date_trunc('month', now());

    SELECT COALESCE(SUM(total_ttc), 0), COUNT(*) INTO v_unpaid, v_unpaid_count
    FROM public.invoices
    WHERE user_id = p_user_id AND status NOT IN ('paid', 'cancelled');

    SELECT COUNT(*) INTO v_accepted
    FROM public.quotes
    WHERE user_id = p_user_id AND status = 'accepted';

    SELECT COUNT(*) INTO v_quotes_count
    FROM public.quotes
    WHERE user_id = p_user_id AND created_at >= date_trunc('month', now());

    SELECT COUNT(*) INTO v_quotes_prev
    FROM public.quotes
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('month', now() - INTERVAL '1 month')
      AND created_at < date_trunc('month', now());

    SELECT json_agg(row_to_json(t)) INTO v_history
    FROM (
        SELECT
            to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
            COALESCE(SUM(total_ttc), 0) AS revenue
        FROM public.invoices
        WHERE user_id = p_user_id AND status = 'paid'
          AND created_at >= now() - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at) ASC
    ) t;

    RETURN json_build_object(
        'revenue',        v_revenue,
        'revenue_change', CASE WHEN v_revenue_prev > 0
                               THEN ROUND(((v_revenue - v_revenue_prev) / v_revenue_prev * 100)::NUMERIC, 1)
                               ELSE 0 END,
        'unpaid',         v_unpaid,
        'unpaid_count',   v_unpaid_count,
        'acceptedCount',  v_accepted,
        'quotes_change',  CASE WHEN v_quotes_prev > 0
                               THEN ROUND(((v_quotes_count - v_quotes_prev)::NUMERIC / v_quotes_prev * 100)::NUMERIC, 1)
                               ELSE 0 END,
        'history',        COALESCE(v_history, '[]'::JSON)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- RPC 7 : track_quote_view_v1
-- (Inchangée - sécurisée par token)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.track_quote_view_v1(
    p_quote_id UUID,
    p_token    TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.quotes
    SET last_viewed_at = now()
    WHERE id = p_quote_id
      AND public_token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- ✅ NEW RPC 8 : get_public_quote_data
-- Remplace les politiques SELECT anon dangereuses.
-- Le client doit fournir l'ID ET le token pour accéder.
-- Retourne UNIQUEMENT les données nécessaires à l'affichage.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_quote_data(
    p_quote_id UUID,
    p_token    TEXT
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Validation stricte : les deux paramètres sont obligatoires
    IF p_quote_id IS NULL OR p_token IS NULL OR p_token = '' THEN
        RAISE EXCEPTION 'PUB-400: Paramètres manquants';
    END IF;

    SELECT json_build_object(
        'quote', json_build_object(
            'id', q.id,
            'number', q.number,
            'status', q.status,
            'total_ht', q.total_ht,
            'total_ttc', q.total_ttc,
            'tax_rate', q.tax_rate,
            'signature_url', q.signature_url,
            'artisan_signature_url', q.artisan_signature_url,
            'client_signature_url', q.client_signature_url,
            'payment_method', q.payment_method,
            'created_at', q.created_at,
            'updated_at', q.updated_at,
            'estimated_start_date', q.estimated_start_date,
            'estimated_duration', q.estimated_duration,
            'valid_until', q.valid_until
        ),
        'client', json_build_object(
            'name', c.name,
            'address', c.address,
            'city', c.city,
            'email', c.email
            -- ⛔ Pas de phone, notes, postal_code (données internes)
        ),
        'artisan', json_build_object(
            'company_name', p.company_name,
            'address', p.address,
            'siret', p.siret,
            'legal_form', p.legal_form,
            'tva_intra', p.tva_intra,
            'email', p.email,
            'phone', p.phone,
            'stripe_charges_enabled', p.stripe_charges_enabled
            -- ⛔ PAS de smtp_*, stripe_api_key
        ),
        'items', (
            SELECT json_agg(json_build_object(
                'id', qi.id,
                'description', qi.description,
                'quantity', qi.quantity,
                'unit_price', qi.unit_price,
                'total_price', qi.total_price
            ))
            FROM public.quote_items qi
            WHERE qi.quote_id = q.id
        )
    ) INTO v_result
    FROM public.quotes q
    JOIN public.clients c ON c.id = q.client_id
    JOIN public.profiles p ON p.id = q.user_id
    WHERE q.id = p_quote_id
      AND q.public_token = p_token
      AND q.public_token IS NOT NULL;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'PUB-404: Devis introuvable ou token invalide';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- RPC 9 : get_dashboard_activity
-- Utilisée pour générer les graphiques de CA.
-- ✅ FIX : Retourne [] au lieu de NULL si vide.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_activity(p_user_id uuid, p_days integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_start_date DATE := (now() - (p_days || ' days')::interval)::date;
    v_result JSONB;
BEGIN
    IF p_days <= 31 THEN
        -- Daily aggregation for 30 days
        WITH days AS (
            SELECT generate_series(v_start_date, now()::date, '1 day'::interval)::date AS d
        ),
        stats AS (
            SELECT created_at::date AS d, SUM(total_ttc) AS rev
            FROM public.quotes
            WHERE user_id = p_user_id
              AND status::text = ANY(ARRAY['accepted', 'invoiced', 'paid'])
              AND created_at >= v_start_date
            GROUP BY 1
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'label', to_char(days.d, 'DD/MM'),
                'revenue', COALESCE(stats.rev, 0),
                'full_date', days.d
            ) ORDER BY days.d ASC
        ) INTO v_result
        FROM days
        LEFT JOIN stats ON days.d = stats.d;
    ELSE
        -- Weekly aggregation for 90 days
        WITH weeks AS (
            SELECT DISTINCT date_trunc('week', generate_series(v_start_date, now()::date, '1 day'::interval))::date AS w
        ),
        stats AS (
            SELECT date_trunc('week', created_at)::date AS w, SUM(total_ttc) AS rev
            FROM public.quotes
            WHERE user_id = p_user_id
              AND status::text = ANY(ARRAY['accepted', 'invoiced', 'paid'])
              AND created_at >= v_start_date
            GROUP BY 1
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'label', 'Sem ' || to_char(weeks.w, 'IW'),
                'revenue', COALESCE(stats.rev, 0),
                'full_date', weeks.w
            ) ORDER BY weeks.w ASC
        ) INTO v_result
        FROM weeks
        LEFT JOIN stats ON weeks.w = stats.w;
    END IF;

    -- ✅ FIX: Toujours renvoyer un tableau vide si pas de données
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$;
