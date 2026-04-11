# ArtisanFlow - SaaS de Facturation Artisanale

ArtisanFlow est une plateforme SaaS haute performance conçue pour les artisans, optimisée pour la vitesse, la sécurité et la synchronisation en temps réel.

## 🚀 Architecture de Performance (Senior++)

L'application utilise une couche de données hybride "Zero-Leak" garantissant un trafic minimal et une cohérence maximale.

### 1. Système de Cache `useSyncCache`
Un moteur de synchronisation propriétaire avec :
- **Déduplication au Niveau Instance** : Empêche les requêtes redondantes (ex: React Strict Mode).
- **Anti-Race Condition** : Protection par `requestId` monotone.
- **Optimisation LocalStorage** : Comparaison de timestamps avant lecture/écriture pour minimiser les I/O.
- **Stabilité Totale** : Utilisation de Refs pour le `fetcher` et les dépendances, éliminant les boucles de re-fetch infinies.

### 2. Notification & Sync "Source of Truth"
Le `NotificationProvider` assure la cohérence du dashboard via :
- **Stratégie d'Invalidation** : Contrairement à l'optimisme pur qui peut diverger, chaque événement Realtime (Supabase) déclenche une réconciliation systématique avec le backend.
- **Déduplication Persistante** : Utilisation de `localStorage` (`AF_EVT_*`) pour filtrer les événements doublés même après un rafraîchissement de page.
- **Page Visibility API** : Suspension intelligente du polling en arrière-plan pour économiser la batterie et les ressources serveur.

## 🔒 Sécurité & Fiabilité
- **Middleware Hardening** : CSP robuste, gestion des nonces et protection contre les injections XSS.
- **Session Sync** : Rafraîchissement automatique de la session Supabase lors des changements de plan ou de profil.
- **Audio Guard** : Protection anti-spam pour les alertes sonores de notification.

## 🛠️ Développement

### Installation
```bash
npm install
```

### Lancement
```bash
npm run dev
```

---
*Architecture maintenue par Antigravity & ArtisanFlow Expert Team.*
