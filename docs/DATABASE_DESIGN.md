# Architecture de Données : Guide des Types Stratégiques 🏰🛡️

Ce document définit les règles d'or pour le typage des données au sein de la plateforme **ArtisanFlow**, garantissant performance, précision mathématique et évitant les erreurs de calcul.

## Pourquoi choisir `number` (Numeric/Integer) pour les indicateurs ?

Pour des champs comme `annual_revenue` (CA) et `num_contacts` (Volume), le choix du type numérique est critique pour l'intelligence métier.

### 1. Avantages de la Rigueur Numérique
- **Calculs Immédiats** : Contrairement au texte (`string`), les nombres permettent des additions et agrégations SQL instantanées. 
  - *Exemple :* `1000 + 500 = 1500` (Number) vs `"1000" + "500" = "1000500"` (String Error).
- **Tris Logiques** : Assure que `2` arrive bien avant `10` dans les listes triées.
- **Filtres de Performance** : Permet à PostgreSQL d'optimiser les requêtes de segmentation (ex: *"Montre-moi seulement les artisans avec > 10 contacts"*).

### 2. Le Référentiel "Qui fait quoi ?"

| Champ | Type SQL Idéal | Pourquoi ? |
| :--- | :--- | :--- |
| **`annual_revenue`** | **`numeric`** | Pour la précision monétaire (centimes) sans erreur d'arrondi. |
| **`num_contacts`** | **`integer`** | On ne peut pas avoir 1.5 contact. Ultra-rapide pour le tri. |
| **`email`, `name`** | **`text / string`** | Informations d'identité, pas de valeurs mathématiques. |
| **`status`** | **`Enum`** | Étiquettes fixes pour une intégrité absolue des workflow. |

## Règle d'Or de l'Artisan Développeur
> **"Si tu peux le compter, le sommer ou le comparer (plus grand/plus petit), utilise un `number`. Si c'est juste pour l'afficher ou l'écrire, utilise un `string`."**

---
🔍 *Ce guide fait partie du standard de sécurité Grade 3 (Bouclier de l'Artisan).*
