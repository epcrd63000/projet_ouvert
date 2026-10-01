# Changelog

## [1.2.2] — 2026-10-01

### 💰 Budget & agenda
- Mise à jour du plafond global à 3 183 € selon les financements APICIL, BDE et FabLab documentés dans le rapport final.
- Ajout d'une commande ciblée `npm run db:update-project-budget` pour actualiser le projet existant sans relancer le seed complet.
- Les créations, modifications et suppressions de dépenses ne changent plus le montant du budget alloué.
- Refonte visuelle de l'agenda : événements à contraste renforcé, grille affinée et commandes adaptées aux petits écrans.

## [1.2.1] — 2026-10-01

### ✅ Module Tâches
- La création standard assigne désormais la tâche à l'utilisateur connecté ; une action réservée aux Admins permet de l'assigner à un ou plusieurs membres.
- Les tâches datées restent synchronisées avec l'agenda et le formulaire propose les deux prochaines réunions comme raccourcis d'échéance.
- Les membres ne peuvent consulter que leurs tâches, même en passant un identifiant utilisateur à l'API.
- Le budget projet utilise l'enveloppe réelle de 3 183 € (APICIL, BDE et FabLab) et reste indépendant du total des dépenses.

## [1.2.0] — 2026-10-01

### 👥 Module Utilisateurs & Paramètres
- **`POST /api/users`** : Création d'utilisateurs par les administrateurs avec hachage bcrypt (10 rounds) et validation Zod.
- **`GET /api/users/[id]`** : Consultation détaillée d'un profil.
- **`PATCH /api/users/[id]`** : Modification de profil (nom, mot de passe, avatar, heures de rappel) et changement de rôle réservé aux administrateurs avec interdiction de rétrograder le dernier administrateur.
- **`DELETE /api/users/[id]`** : Suppression d'utilisateur avec protection absolue du dernier administrateur et cascades Prisma (les tâches/réunions créées sont conservées en statut orphelin).
- **Interface `/settings`** : Ajout du composant interactif `UserManagement` permettant aux administrateurs de créer des comptes, modifier les rôles et supprimer des membres directement.

### 📊 Module Gantt & Jalons
- **`POST /api/milestones`** : Création de jalons ouverte à tous les membres, avec création automatique synchronisée d'un événement de type `MILESTONE` dans le calendrier.
- **`GET /api/milestones/[id]`** : Consultation d'un jalon spécifique.
- **`PATCH /api/milestones/[id]`** : Modification des jalons et mise à jour synchronisée des dates/couleurs sur l'événement calendrier lié.
- **`DELETE /api/milestones/[id]`** : Suppression réservée aux administrateurs avec suppression automatique de l'événement calendrier synchronisé.
- **Interface `/gantt`** : Ajout de la modale de création de jalons, du sélecteur de statut et du bouton de suppression réservé aux administrateurs.

### 📅 Module Calendrier & Événements
- **`GET /api/events`** : Intégration des événements de type `MILESTONE` aux côtés des réunions, tâches et événements manuels.
- **`GET/PATCH/DELETE /api/events/[id]`** : Gestion unitaire des événements avec protection stricte (seuls les événements manuels sont modifiables/supprimables directement par leur créateur ou un administrateur).

### 💰 Module Budget
- **`BudgetClient`** : Ajout d'une modale interactive pour saisir des dépenses réelles (quantité, prix unitaire, frais de port, catégorie, date, commentaire) avec calcul automatique du montant total.
- Ouverture de l'ajout, de la mise à jour de statut et de la suppression à l'ensemble des membres de l'équipe (conformément à la matrice de scénarios).

### 🔔 Module Notifications
- **`PATCH /api/notifications/[id]/read`** : Route modernisée avec retours JSON et `prisma.notification.updateMany`.
- **`NotificationBell`** : Prise en charge transparente des réponses paginées ou directes.

---

## [1.1.0] — 2026-10-01

### 🔒 Sécurité
- Mise à jour de `next-auth` vers v5.0.0-beta.32 (correction vulnérabilités critiques @auth/core).
- Restriction des `remotePatterns` dans `next.config.mjs` (suppression du wildcard `**`).
- Ajout des en-têtes de sécurité HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

### 🗄️ Schéma Prisma
- Migration des champs financiers de `Float` vers `Decimal` (BudgetEntry.amount, unitPrice, deliveryCost + Project.totalBudget).
- Ajout de `onDelete: SetNull` sur les relations `createdBy` de 5 modèles pour la suppression d'utilisateurs.
- Ajout de `onDelete: Cascade` sur la relation parent/sous-tâches (suppression récursive).
- Ajout de `updatedAt` sur TaskAssignment, MeetingAttendee, GanttMilestone, BudgetEntry.
- Ajout du champ `reminderHoursBefore` sur User pour les rappels configurables.
- Ajout des types de notification `TASK_DELETED` et `MEETING_CANCELLED`.
- Suppression du `previewFeatures = ["driverAdapters"]` deprecated.

### 🔧 Routes API Backend
- **`POST /api/events`** : Ajout de la validation Zod.
- **`GET /api/events`** : Ajout des filtres de date `?start=...&end=...`.
- **`GET /api/budget`** et **`GET /api/notifications`** : Ajout de la pagination.
- **Budget** : Ouverture à tous, recalcul automatique du totalBudget.
- **Meetings POST** : Ouverture à tous, notifications MEETING_SCHEDULED.
- **Tasks DELETE** : Accessible aux ADMIN + assignés, notification TASK_DELETED.
- **Tasks PATCH** : Notification TASK_COMPLETED auto + completedAt.
- **Meetings DELETE** : Suppression Event calendrier + notification MEETING_CANCELLED.
- Standardisation de toutes les erreurs en JSON.
- Centralisation de `requireAuth()` sur toutes les routes.

### 📄 Documentation
- Création `.env.example` et `lib/validations/event.ts`.
- Ajout de `notifyUsers()` dans `lib/notifications.ts`.

### 🐛 Corrections
- Fix conversions Decimal dans Dashboard et Budget.
- Fix compatibilité TypeScript avec next-auth v5 beta.
- Nettoyage de `test-hash.js`.
