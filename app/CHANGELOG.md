# Journal des Modifications (CHANGELOG)

Toutes les modifications notables apportées au projet `app` sont consignées dans ce document.

## [1.0.1] - 2026-09-26 (Correctifs Résilience Réseau & Driver Neon HTTP)

### Corrigé
- **Bypass du blocage TCP (Port 5432) :**
  - Migration vers `PrismaNeonHTTP` combiné au driver serverless Neon pour faire transiter toutes les requêtes en HTTPS standard, contournant les restrictions de pare-feu réseau.
- **Résolution du crash DateTime (`expected a string in column, found {}`) :**
  - Mise à niveau vers Prisma ORM 6.19.3 (`prisma@6.19.3`, `@prisma/client@6.19.3`, `@prisma/adapter-neon@6.19.3`).
  - Prise en charge native des types temporels (`createdAt`, `updatedAt`, `startDate`, `dueDate`) dans le driver HTTP.
- **Élimination des erreurs Webpack WebSocket :**
  - Suppression de la dépendance problématique `ws` et neutralisation des erreurs `bufferUtil.mask is not a function`.

## [1.0.0] - 2026-09-26 (Sprints 7, 8, 9 & 10 : Dashboard, Budget, Notifications & Settings)

### Ajouté
- **Sprint 7 - Dashboard & KPI :**
  - Affichage de données réelles en temps réel depuis Prisma pour la vue `/dashboard`.
  - Intégration de `recharts` pour l'affichage interactif : Avancement par membre (BarChart), Charge de travail (RadarChart), et progression des jalons (PieChart).
  - Composants Client autonomes regroupés dans `DashboardCharts.tsx`.
- **Sprint 8 - Suivi Budgétaire :**
  - Page dédiée `/budget` pour lister et ajouter des dépenses.
  - Jauge de progression visuelle pour le budget total alloué (avec composant `Progress` shadcn/ui).
  - Validation et gestion des droits (Admin) via les routes API `/api/budget` (GET/POST/PATCH/DELETE).
  - Fonctionnalité d'export CSV via l'API `/api/budget/export` (téléchargement direct).
- **Sprint 9 - Notifications In-App :**
  - Service backend de création centralisée (`src/lib/notifications.ts`) pour gérer différents types d'évènements (tâches, réunions, jalons).
  - API de requêtage avec filtrage des non-lues (`/api/notifications`).
  - Composant UI `NotificationBell.tsx` dans le header de l'application, utilisant `Popover` pour lister rapidement les dernières alertes (SWR natif / polling léger).
  - Page `/notifications` pour l'historique complet, avec bouton pour tout marquer comme lu.
- **Sprint 10 - Paramètres Administrateur (Settings) :**
  - Page `/settings` (protégée Admin) affichant une vue d'ensemble des utilisateurs enregistrés et de leurs rôles respectifs.

### Corrigé
- **Sécurité et Stabilité :**
  - Ajout de l'instruction `export const dynamic = "force-dynamic"` sur les routes API `/api/notifications` et `/api/budget/export` pour résoudre les erreurs `DYNAMIC_SERVER_USAGE` lors du build Next.js.
  - Sécurisation de la route `POST /api/budget` en vérifiant que seul un utilisateur ayant le rôle `ADMIN` peut créer de nouvelles dépenses.
  - Ajout de l'appel effectif au service de notifications (`createNotification`) lors de l'assignation de tâches (`POST /api/tasks`) pour rendre la cloche fonctionnelle.

## [0.5.0] - 2026-09-26 (Sprints 5 & 6 : Réunions, Agenda et Gantt)### Ajouté
- **Sprint 5 - Gestion des Réunions :**
  - Modèle de validation Zod (`createMeetingSchema`, `updateMeetingSchema`) dans `src/lib/validations/meeting.ts`.
  - API Routes :
    - `GET /api/meetings` et `POST /api/meetings` (réservé aux Admin).
    - `GET`, `PATCH` et `DELETE` sur `/api/meetings/[id]` (sécurisation du `PATCH` : les membres ne peuvent modifier que le compte-rendu via `notes`, tandis que l'Admin peut modifier la date, le titre et les participants).
  - UI de l'espace Réunions :
    - Page principale `/meetings` listant les réunions prévues et terminées, avec bouton de création (Admin).
    - Modale de création interactive pour la saisie du titre, de la date, du statut et la sélection des participants.
    - Page de détail `/meetings/[id]` affichant les participants et permettant l'ajout ou la modification collaborative d'un compte rendu de réunion (champ `notes` mappé depuis le modèle Prisma).
- **Sprint 6 - Agenda et Diagramme de Gantt :**
  - Route d'API agrégée `GET /api/events` transformant les réunions et les échéances de tâches (`dueDate`) au format évènement standard.
  - Route d'API `GET /api/milestones` pour récupérer les 11 `GanttMilestone` pré-seedés.
  - Vue Agenda (`/agenda`) : Intégration de la librairie `react-big-calendar` avec support complet `date-fns` et traduction française pour afficher un calendrier mensuel, hebdomadaire et journalier interactif.
  - Vue Gantt (`/gantt`) : Implémentation d'une frise chronologique détaillée et responsive sur-mesure calculant dynamiquement les bornes de dates pour positionner visuellement les Jalons (milestones) sous forme de barres horizontales et les échéances de tâches sous forme de marqueurs, à la manière d'un diagramme de Gantt léger.


## [0.3.0] - 2026-09-25 (Milestone 3 : Authentication & Protected Routes)

### Ajouté
- Déclaration des types étendus NextAuth dans `src/types/next-auth.d.ts` :
  - Extension des interfaces `Session`, `User` et `JWT` avec l'UUID `id` et l'énumération Prisma `Role` (`ADMIN` | `MEMBER`).
- Architecture Split Configuration NextAuth.js v5 (Auth.js) :
  - `src/lib/auth.config.ts` : Configuration Edge-safe sans dépendances Node.js / Prisma, enrichissement des callbacks `jwt` et `session`, stratégie de session JWT 30 jours, `trustHost: true`.
  - `src/lib/auth.ts` : Configuration serveur Node.js complète avec `CredentialsProvider`, validation des formulaires par schéma Zod, vérification des hashs bcrypt (`bcryptjs.compare`), protection défensive contre les caractères de contrôle / null bytes et capture des exceptions.
  - `src/app/api/auth/[...nextauth]/route.ts` : Route API App Router exportant les handlers `GET` et `POST`.
- Middleware de protection globale des routes (`src/middleware.ts`) :
  - Interception de toutes les routes de l'application via matcher regex (à l'exception de `/api/auth`, `/api/health`, `_next/static`, `_next/image`, `favicon.ico` et médias).
  - Redirection automatique HTTP 307 de la racine `/` vers `/dashboard` (si connecté) ou `/login` (si anonyme).
  - Redirection des utilisateurs déjà connectés visitant `/login` vers `/dashboard`.
  - Verrouillage des routes privées (`/dashboard`, `/projects`, `/api/protected`) vers `/login?callbackUrl=...`.
- Interface utilisateur d'authentification (`src/app/(auth)/login/page.tsx`) :
  - Composant interactif Client avec enveloppe `<Suspense>` pour compatibilité stricte `useSearchParams()`.
  - Formulaire de connexion avec gestion d'état, affichage des erreurs via `<Alert variant="destructive">`.
  - Boutons d'accès rapide (Badges cliquables) préremplissant les comptes de test seedés (`etienne@imt.fr` / `password` et `hugo@imt.fr` / `password`).
- Tableau de bord applicatif protégé (`src/app/(protected)/dashboard/page.tsx`) :
  - Server Component avec contrôle de session asynchrone `await auth()`.
  - Affichage du profil utilisateur connecté (nom, email, badge de rôle `ADMIN` ou `MEMBER`).
  - Formulaire de déconnexion sécurisé via Server Action appelant `signOut({ redirectTo: "/login" })`.
- Défense en profondeur sur la route racine (`src/app/page.tsx`) :
  - Composant serveur dynamique redirigeant vers `/dashboard` ou `/login` en synergie avec le middleware.

## [0.2.0] - 2026-09-25 (Milestone 2 : Neon & Prisma Database Setup & Seed)

### Ajouté
- Configuration du projet Neon CLI :
  - Installation des compétences (`neon skills --agent antigravity -y`).
  - Configuration du serveur MCP Neon (`neon mcp -y`).
  - Liaison avec le projet distant `twilight-violet-40207883` sur la branche `production` (`neon link`).
  - Fichier de configuration `neon.ts` déclarant le bucket privé S3 `uploads` pour Neon Object Storage.
  - Déploiement réussi de la configuration Neon (`neon deploy`).
- Schéma Prisma complet (`prisma/schema.prisma`) :
  - 10 énumérations : `Role`, `TaskStatus`, `TaskPriority`, `MeetingStatus`, `MilestoneStatus`, `BudgetCategory`, `BudgetStatus`, `NotificationType`, `EventVisibility`, `EventType`.
  - 11 modèles de données : `User`, `Project`, `Task`, `TaskAssignment`, `Meeting`, `MeetingAttendee`, `MeetingDecision`, `GanttMilestone`, `BudgetEntry`, `Notification`, `Event`.
  - Double configuration datasource : pooling PgBouncer (`DATABASE_URL`) pour le runtime et connexion directe (`DIRECT_URL`) pour les migrations/DDL.
- Script de peuplement idempotent (`prisma/seed.ts` et `prisma/seed-data.ts`) :
  - Création/mise à jour du projet unique IMT 2026-2027.
  - Enregistrement des 6 utilisateurs officiels avec hash bcrypt sécurisé (10 tours) pour le mot de passe initial "password" (2 ADMIN : Etienne et Liam ; 4 MEMBER : Hugo, Milane, Solal, Peter).
  - Enregistrement des 11 jalons Gantt officiels IMT préchargés.
- Script de vérification automatisée de l'état de la base de données (`prisma/verify-db.ts`) confirmant :
  - 6 utilisateurs enregistrés et valides sous bcrypt.
  - 2 administrateurs conformes.
  - 11 jalons Gantt enregistrés.
  - 11 tables créées dans le schéma public.
- Client Prisma singleton (`src/lib/prisma.ts`) pour Server Components, Server Actions et routes d'API.
- Variables d'environnement configurées dans `app/.env` (DATABASE_URL, DIRECT_URL, AWS S3 Object Storage, AUTH_SECRET).

## [0.1.0] - 2026-09-25 (Milestone 1 : Next.js 14 Scaffolding & Setup)

### Ajouté
- Initialisation complète de l'application Next.js 14.2.23 avec App Router et TypeScript strict.
- Configuration Tailwind CSS 3.4 avec design system shadcn/ui en variables HSL (mode clair et sombre).
- Configuration PostCSS (`postcss.config.mjs`) et configuration Next.js ESM (`next.config.mjs`).
- Fichier de configuration `components.json` pour shadcn/ui avec style `default` et base `slate`.
- Primitives d'interface réutilisables dans `src/components/ui/` :
  - `Button` : Bouton polymorphique avec support `asChild` (Radix Slot) et variantes de taille/style.
  - `Input` : Champ de formulaire avec focus ring et gestion d'état désactivé.
  - `Card` : Ensemble modulaire (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter).
  - `Label` : Libellé accessible basé sur `@radix-ui/react-label`.
  - `Alert` : Boîte d'alerte pour messages et erreurs d'authentification.
  - `Badge` : Indicateur visuel pour rôles (`ADMIN`, `MEMBER`) et états.
- Utilitaire de fusion conditionnelle de classes CSS `cn()` dans `src/lib/utils.ts`.
- Architecture de routage App Router :
  - `layout.tsx` racine avec polices Google `Inter`, métadonnées en français et `Providers`.
  - `page.tsx` avec redirection immédiate vers `/login`.
  - Groupe de routes d'authentification `(auth)` avec layout centré et page `/login`.
  - Groupe de routes protégées `(protected)` avec layout applicatif (header et navigation) et page `/dashboard`.
  - Frontières système : `loading.tsx`, `not-found.tsx`, `error.tsx`.
  - Points d'accès API : sonde de disponibilité `/api/health` et stub `/api/auth/[...nextauth]`.
- Suite de tests unitaires pour l'utilitaire `cn()` dans `src/lib/__tests__/utils.test.ts`.

### v1.0.2 (Design Audit, Emojis, Agenda & T�ches)
- Audit UI/UX : Suppression totale des �mojis remplac�s par des ic�nes Lucide-react dans tous les composants.
- Interface : Masquage du badge de r�le utilisateur dans le Header et le Dashboard pour plus de fluidit�.
- Navigation Agenda : Ajout du composant CustomCalendarToolbar pour r�parer la navigation (boutons Aujourd'hui, Mois, Semaine) cass�e par le reset Tailwind CSS.
- Workflow T�ches : Modification de l'API (/api/tasks) et du modal (TaskModal) pour permettre aux membres de s'assigner eux-m�mes des t�ches, tandis que les administrateurs gardent l'acc�s global.
- Th�mes (Settings) : Cr�ation de CustomThemeProvider permettant aux administrateurs de personnaliser les couleurs globales via la page des param�tres.
