# ArtisanFlow - SQL Bundle V2 (Security Hardened)

## 🛡️ Corrections de Sécurité & Purge (Audit Terminé)

| # | Sévérité | Faille | Correction |
|---|---|---|---|
| 1 | 🚨 CRITIQUE | `USING(true)` sur profiles → fuite IBAN, SMTP, emails | **Supprimé.** Accès public via RPC `get_public_quote_data()` |
| 2 | 🚨 CRITIQUE | SELECT anon sur quotes sans vérifier le token | **Supprimé.** Aucun accès anon direct aux tables |
| 3 | 🚨 CRITIQUE | Purge bancaire (IBAN/BIC/Bank_name) | **Nettoyé.** Passage exclusif à **Stripe Connect**. |
| 4 | ⚠️ MOYEN | Totaux falsifiables depuis le front-end | **Corrigé.** Calcul `qty * unit_price` côté serveur |
| 5 | ⚠️ MOYEN | `create_invoice_from_quote_v2` sans vérif ownership | **Corrigé.** Vérification `auth.uid() = user_id` |
| 6 | ⚠️ MOYEN | Race condition sur la numérotation | **Corrigé.** `pg_advisory_xact_lock()` par artisan |
| 7 | 🛠️ BEST | FK sans ON DELETE → orphelins | **Corrigé.** CASCADE ou SET NULL sur toutes les FK |
| 8 | 🛠️ BEST | Pas de CHECK sur les montants | **Ajouté.** `CHECK >= 0` sur tous les champs financiers |

## 🚀 Quoi de neuf dans la V2 ?

1.  **SÉCURITÉ ZERO-LEAK** : Le public ne peut plus "SELECT" directement les tables via RLS. Toutes les données passent par des RPC (fonctions) sécurisées qui vérifient les tokens.
2.  **PURGE BANCAIRE** : Suppression des colonnes `iban`, `bic` et `bank_name`. ArtisanFlow utilise désormais exclusivement **Stripe Connect**.
3.  **DOUBLE SIGNATURE** : Support natif pour la signature de l'artisan ET du client avant validation du devis.
4.  **NUMÉROTATION LÉGALE** : Utilisation de verrous consultatifs (Advisory Locks).

## Contenu du Bundle

| Fichier | Contenu | Ordre |
|---|---|---|
| `01_enums.sql` | Types (quote_status, invoice_status) | 1er |
| `02_tables.sql` | 8 tables + CHECK + ON DELETE + 14 index | 2ème |
| `03_functions.sql` | RPC Sécurisées (get_public_quote_data, accept_quote_v4) | 3ème |
| `04_rls_security.sql` | RLS Zero-Trust (aucun accès anon direct) | 4ème |
| `05_triggers_storage.sql` | Triggers, Storage, Realtime | 5ème |

## Comment utiliser

1. Ouvrir le **SQL Editor** dans Supabase Dashboard
2. Exécuter les fichiers **dans l'ordre** (01 → 05)
3. Créer le bucket Storage "signatures" (voir 05)
4. Activer Realtime sur `quotes` (voir 05)

---
