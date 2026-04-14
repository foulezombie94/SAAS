# Guide de Débogage et Standards UI - Artisan Flow

Ce guide documente les meilleures pratiques et les solutions aux problèmes courants rencontrés lors du développement de l'interface Artisan Flow.

## 🚀 Solutions aux Problèmes de Style (Cache & Priorité)

Si vos changements de styles (ex: couleur d'un bouton) ne s'affichent pas, vérifiez ces 4 points dans l'ordre :

### 1. Le Cache du Navigateur
Le navigateur peut conserver une ancienne version du CSS.
- **Solution** : Effectuez un "Hard Refresh" avec `CTRL + F5` (Windows) ou `CMD + Shift + R` (Mac).

### 2. Le Cache Next.js (Dossier .next)
Le serveur de développement peut parfois ne pas recompiler certains fichiers de style.
- **Solution** : 
  1. Arrêtez le terminal (`CTRL + C`).
  2. Supprimez le dossier caché `.next` à la racine.
  3. Relancez via `npm run dev`.

### 3. Conflit de Classes Tailwind
Si deux classes de même type (ex: deux `bg-`) sont présentes, la priorité peut être ambiguë.
- **Solution** : Assurez-vous d'avoir supprimé l'ancienne classe. Utilisez l'astuce du point d'exclamation `!bg-yellow-500` pour forcer la priorité en cas de doute.
- **Note Architecture** : Le composant `Button` a été refactorisé pour utiliser des utilitaires explicites, permettant à `tailwind-merge` de résoudre ces conflits automatiquement.

### 4. JIT (Just-In-Time) et Scan des Chemins
Tailwind 4/5 scanne vos fichiers pour générer le CSS nécessaire. Si un fichier n'est pas dans les dossiers surveillés, ses classes n'existeront pas.
- **Vérification** : Dans Tailwind 4, assurez-vous que vos fichiers sont bien dans `src/`.

---

## 📄 Standards de Développement (Expertise)

### 1. Sécurité du DOM (React)
Ne **jamais** manipuler le DOM réel (`document.querySelector`) directement dans le cycle de vie React.
- **Application** : Pour la génération de PDF via `html2canvas`, toute modification de style temporaire doit se faire exclusivement dans le paramètre `onclone`. Cela évite de casser l'interface utilisateur en cas d'erreur.

### 2. Type Safety (Unknown Pattern)
L'utilisation de `any` dans les blocs `catch` est proscrite. 
- **Standard** : Utilisez `catch (error: unknown)` et validez l'instance :
  ```typescript
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    toast.error(message);
  }
  ```

### 3. Validation des API
Ne faites jamais confiance aveuglément à une réponse réseau.
- **Standard** : Vérifiez toujours `response.ok` avant de tenter un `response.json()`. Gérez les erreurs 500/404 de manière explicite pour fournir un feedback clair à l'utilisateur.

### 4. Génération PDF
Le moteur actuel utilise `html2canvas` + `jsPDF` côté client avec une isolation stricte des styles. 
- **Évolution préconisée** : Pour une fidélité textuelle parfaite et des performances accrues (notamment sur mobile), une migration vers une génération **côté serveur** (Node.js + Puppeteer) est recommandée pour les versions de production à grande échelle.
