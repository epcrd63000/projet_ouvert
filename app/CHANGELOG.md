# Changelog


## [2.2.0] - 2026-10-02

### Ajout�
- **�diteur de Compte Rendu (TipTap)** : Int�gration d'un �diteur WYSIWYG robuste pour les r�unions, avec export PDF (html2canvas, jsPDF) et sauvegarde native en Markdown.
- **Export PDF en Lot (Batch Export)** : Possibilit� de s�lectionner plusieurs r�unions depuis la liste et de les exporter dans une archive ZIP g�n�r�e c�t� client (JSZip).
- **Indicateurs de Suivi** : Ajout d'un statut visuel (Rouge/Vert) pour identifier rapidement les comptes rendus t�l�charg�s ou non t�l�charg�s.
- **Prompt IA Int�gr�** : Le prompt de structuration de la r�union est d�sormais accessible et copiable directement en un clic depuis la page de la r�union pour fluidifier l'utilisation de l'IA (ChatGPT/Claude).
- **Mise � jour BDD** : Ajout des champs eportContent et isReportDownloaded sur le mod�le \Meeting\ de Prisma.

## [1.3.0] — 2026-10-02

### ✨ Nouveautés & Modèles IA
- **Bibliothèque de Prompts IA dans les Réunions** : Ajout d'un menu déroulant interactif dans la vue de détail des réunions permettant d'accéder aux modèles IA (`AiPrompt`) et de les copier dans le presse-papier en un clic. Gestion robuste des erreurs réseau (silencieuses remplacées par une alerte UI explicite).
- **Prisma Seed Automatisé** : Ajout d'une configuration formelle `ts-node` pour le script de peuplement dans `package.json`. Introduction de 3 prompts IA de haute qualité (Générateur de Compte Rendu, Générateur de Tâches, Analyse des Risques Techniques) conçus pour le contexte de l'ingénierie du projet "Voilier MINIMOCA".


### 📌 Module Kanban & Tâches
- **Visibilité des tâches personnelles** : Extension du filtre `GET /api/tasks` pour récupérer les tâches assignées à l'utilisateur ET celles créées par lui (`where.OR = [{ assignments: ... }, { createdById: ... }]`), garantissant l'apparition immédiate des tâches dans le Kanban personnel ("Mes tâches").
- **Assignation par défaut** : Assignation automatique au créateur dans l'API `POST /api/tasks` et dans `TaskModal` si aucun membre n'est sélectionné manuellement.
- **Affichage des noms d'utilisateurs sur les cartes Kanban** : Remplacement des badges à lettre unique par des pilules lisibles affichant l'initiale et le nom complet de chaque membre assigné, ainsi que la mention "Créé par [Nom]" pour les tâches sans assigné.
- **Action de suppression rapide** : Ajout d'un bouton de suppression avec confirmation sur les cartes de tâches (autorisé pour les administrateurs, les créateurs et les assignés).
- **Réconciliation des données existantes** : Exécution du script `01_repair_existing_task_assignments.ts` pour associer les tâches historiques orphelines à leur créateur.

## [1.2.1] — 2026-10-02

### 🔐 Authentification & Connexion
- **Correction du processus serveur** : Résolution du conflit de port 3000 monopolisé par un processus Node orphelin sans variables d'environnement (.env), entraînant des rejets systématiques (`CredentialsSignin`).
- **Fiabilisation de la redirection client** : Remplacement de `router.push()` par une navigation standardisée `window.location.href` dans `LoginPage` pour garantir la transmission immédiate du cookie de session `authjs.session-token` au serveur et supprimer les effets de cache de l'App Router.
- **Robustesse Zod** : Nettoyage et normalisation automatique des espaces et de la casse (`trim()`, `toLowerCase()`) sur l'email dans `loginSchema`.
- **Gestion des erreurs URL** : Prise en charge des paramètres d'erreur d'authentification (`?error=...`) dans l'interface de connexion.

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
