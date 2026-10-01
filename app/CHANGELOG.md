# Changelog

## [1.1.0] — 2026-10-01

### 🔒 Sécurité
- Mise à jour de `next-auth` vers v5.0.0-beta.32 (correction vulnérabilités critiques @auth/core)
- Restriction des `remotePatterns` dans `next.config.mjs` (suppression du wildcard `**`)
- Ajout des en-têtes de sécurité HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

### 🗄️ Schéma Prisma
- Migration des champs financiers de `Float` vers `Decimal` (BudgetEntry.amount, unitPrice, deliveryCost + Project.totalBudget)
- Ajout de `onDelete: SetNull` sur les relations `createdBy` de 5 modèles pour la suppression d'utilisateurs
- Ajout de `onDelete: Cascade` sur la relation parent/sous-tâches (suppression récursive)
- Ajout de `updatedAt` sur TaskAssignment, MeetingAttendee, GanttMilestone, BudgetEntry
- Ajout du champ `reminderHoursBefore` sur User pour les rappels configurables
- Ajout des types de notification `TASK_DELETED` et `MEETING_CANCELLED`
- Suppression du `previewFeatures = ["driverAdapters"]` deprecated

### 🔧 Routes API Backend
- **`POST /api/events`** : Ajout de la validation Zod
- **`GET /api/events`** : Ajout des filtres de date `?start=...&end=...`
- **`GET /api/budget`** et **`GET /api/notifications`** : Ajout de la pagination
- **Budget** : Ouverture à tous, recalcul automatique du totalBudget
- **Meetings POST** : Ouverture à tous, notifications MEETING_SCHEDULED
- **Tasks DELETE** : Accessible aux ADMIN + assignés, notification TASK_DELETED
- **Tasks PATCH** : Notification TASK_COMPLETED auto + completedAt
- **Meetings DELETE** : Suppression Event calendrier + notification MEETING_CANCELLED
- Standardisation de toutes les erreurs en JSON
- Centralisation de `requireAuth()` sur toutes les routes

### 📄 Documentation
- Création `.env.example` et `lib/validations/event.ts`
- Ajout de `notifyUsers()` dans `lib/notifications.ts`

### 🐛 Corrections
- Fix conversions Decimal dans Dashboard et Budget
- Fix compatibilité TypeScript avec next-auth v5 beta
- Nettoyage de `test-hash.js`
