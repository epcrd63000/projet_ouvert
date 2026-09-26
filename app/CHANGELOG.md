# Journal des Modifications (CHANGELOG)

Toutes les modifications notables apportées au projet `app` sont consignées dans ce document.

## [1.0.4] - 2026-09-26 (Budget et Permissions Agenda)

### Corrigé / Ajouté
- Budget : Lecture du rapport final PDF pour intégrer l'historique complet des dépenses. Ajout des colonnes Quantité, Prix Unitaire et Livraison.
- Agenda (Permissions) : Les membres normaux ne voient que leurs propres tâches. Les administrateurs voient toutes les tâches de l'équipe.
- Agenda (Design) : Les tâches appartenant à d'autres membres (vues par les admins) sont affichées avec des pointillés et le nom du membre assigné.



## [1.0.3] - 2026-09-26 (Améliorations UI/UX & Fix Déploiement)

### Corrigé / Ajouté
- Tâches : Auto-assignation au créateur par défaut et assignation multiple libre pour tous.
- Réunions : Bouton "Tout sélectionner" pour les participants, nouveau champ "Lieu" (location), et création automatique d'un événement (Event) lié dans l'agenda.
- Agenda : Ajout d'un bouton pour créer un événement libre (manuel) avec modale dédiée.
- Gantt : Jalons et tâches désormais cliquables pour afficher une modale de détails. Amélioration de la largeur minimale des jalons courts pour assurer la cliquabilité.
- Préparation au déploiement sur Vercel.


## [1.0.1] - 2026-09-26 (Correctifs RÃ©silience RÃ©seau & Driver Neon HTTP)

### CorrigÃ©
- **Bypass du blocage TCP (Port 5432) :**
  - Migration vers `PrismaNeonHTTP` combinÃ© au driver serverless Neon pour faire transiter toutes les requÃªtes en HTTPS standard, contournant les restrictions de pare-feu rÃ©seau.
- **RÃ©solution du crash DateTime (`expected a string in column, found {}`) :**
  - Mise Ã  niveau vers Prisma ORM 6.19.3 (`prisma@6.19.3`, `@prisma/client@6.19.3`, `@prisma/adapter-neon@6.19.3`).
  - Prise en charge native des types temporels (`createdAt`, `updatedAt`, `startDate`, `dueDate`) dans le driver HTTP.
- **Ã‰limination des erreurs Webpack WebSocket :**
  - Suppression de la dÃ©pendance problÃ©matique `ws` et neutralisation des erreurs `bufferUtil.mask is not a function`.

## [1.0.0] - 2026-09-26 (Sprints 7, 8, 9 & 10 : Dashboard, Budget, Notifications & Settings)

### AjoutÃ©
- **Sprint 7 - Dashboard & KPI :**
  - Affichage de donnÃ©es rÃ©elles en temps rÃ©el depuis Prisma pour la vue `/dashboard`.
  - IntÃ©gration de `recharts` pour l'affichage interactif : Avancement par membre (BarChart), Charge de travail (RadarChart), et progression des jalons (PieChart).
  - Composants Client autonomes regroupÃ©s dans `DashboardCharts.tsx`.
- **Sprint 8 - Suivi BudgÃ©taire :**
  - Page dÃ©diÃ©e `/budget` pour lister et ajouter des dÃ©penses.
  - Jauge de progression visuelle pour le budget total allouÃ© (avec composant `Progress` shadcn/ui).
  - Validation et gestion des droits (Admin) via les routes API `/api/budget` (GET/POST/PATCH/DELETE).
  - FonctionnalitÃ© d'export CSV via l'API `/api/budget/export` (tÃ©lÃ©chargement direct).
- **Sprint 9 - Notifications In-App :**
  - Service backend de crÃ©ation centralisÃ©e (`src/lib/notifications.ts`) pour gÃ©rer diffÃ©rents types d'Ã©vÃ¨nements (tÃ¢ches, rÃ©unions, jalons).
  - API de requÃªtage avec filtrage des non-lues (`/api/notifications`).
  - Composant UI `NotificationBell.tsx` dans le header de l'application, utilisant `Popover` pour lister rapidement les derniÃ¨res alertes (SWR natif / polling lÃ©ger).
  - Page `/notifications` pour l'historique complet, avec bouton pour tout marquer comme lu.
- **Sprint 10 - ParamÃ¨tres Administrateur (Settings) :**
  - Page `/settings` (protÃ©gÃ©e Admin) affichant une vue d'ensemble des utilisateurs enregistrÃ©s et de leurs rÃ´les respectifs.

### CorrigÃ©
- **SÃ©curitÃ© et StabilitÃ© :**
  - Ajout de l'instruction `export const dynamic = "force-dynamic"` sur les routes API `/api/notifications` et `/api/budget/export` pour rÃ©soudre les erreurs `DYNAMIC_SERVER_USAGE` lors du build Next.js.
  - SÃ©curisation de la route `POST /api/budget` en vÃ©rifiant que seul un utilisateur ayant le rÃ´le `ADMIN` peut crÃ©er de nouvelles dÃ©penses.
  - Ajout de l'appel effectif au service de notifications (`createNotification`) lors de l'assignation de tÃ¢ches (`POST /api/tasks`) pour rendre la cloche fonctionnelle.

## [0.5.0] - 2026-09-26 (Sprints 5 & 6 : RÃ©unions, Agenda et Gantt)### AjoutÃ©
- **Sprint 5 - Gestion des RÃ©unions :**
  - ModÃ¨le de validation Zod (`createMeetingSchema`, `updateMeetingSchema`) dans `src/lib/validations/meeting.ts`.
  - API Routes :
    - `GET /api/meetings` et `POST /api/meetings` (rÃ©servÃ© aux Admin).
    - `GET`, `PATCH` et `DELETE` sur `/api/meetings/[id]` (sÃ©curisation du `PATCH` : les membres ne peuvent modifier que le compte-rendu via `notes`, tandis que l'Admin peut modifier la date, le titre et les participants).
  - UI de l'espace RÃ©unions :
    - Page principale `/meetings` listant les rÃ©unions prÃ©vues et terminÃ©es, avec bouton de crÃ©ation (Admin).
    - Modale de crÃ©ation interactive pour la saisie du titre, de la date, du statut et la sÃ©lection des participants.
    - Page de dÃ©tail `/meetings/[id]` affichant les participants et permettant l'ajout ou la modification collaborative d'un compte rendu de rÃ©union (champ `notes` mappÃ© depuis le modÃ¨le Prisma).
- **Sprint 6 - Agenda et Diagramme de Gantt :**
  - Route d'API agrÃ©gÃ©e `GET /api/events` transformant les rÃ©unions et les Ã©chÃ©ances de tÃ¢ches (`dueDate`) au format Ã©vÃ¨nement standard.
  - Route d'API `GET /api/milestones` pour rÃ©cupÃ©rer les 11 `GanttMilestone` prÃ©-seedÃ©s.
  - Vue Agenda (`/agenda`) : IntÃ©gration de la librairie `react-big-calendar` avec support complet `date-fns` et traduction franÃ§aise pour afficher un calendrier mensuel, hebdomadaire et journalier interactif.
  - Vue Gantt (`/gantt`) : ImplÃ©mentation d'une frise chronologique dÃ©taillÃ©e et responsive sur-mesure calculant dynamiquement les bornes de dates pour positionner visuellement les Jalons (milestones) sous forme de barres horizontales et les Ã©chÃ©ances de tÃ¢ches sous forme de marqueurs, Ã  la maniÃ¨re d'un diagramme de Gantt lÃ©ger.


## [0.3.0] - 2026-09-25 (Milestone 3 : Authentication & Protected Routes)

### AjoutÃ©
- DÃ©claration des types Ã©tendus NextAuth dans `src/types/next-auth.d.ts` :
  - Extension des interfaces `Session`, `User` et `JWT` avec l'UUID `id` et l'Ã©numÃ©ration Prisma `Role` (`ADMIN` | `MEMBER`).
- Architecture Split Configuration NextAuth.js v5 (Auth.js) :
  - `src/lib/auth.config.ts` : Configuration Edge-safe sans dÃ©pendances Node.js / Prisma, enrichissement des callbacks `jwt` et `session`, stratÃ©gie de session JWT 30 jours, `trustHost: true`.
  - `src/lib/auth.ts` : Configuration serveur Node.js complÃ¨te avec `CredentialsProvider`, validation des formulaires par schÃ©ma Zod, vÃ©rification des hashs bcrypt (`bcryptjs.compare`), protection dÃ©fensive contre les caractÃ¨res de contrÃ´le / null bytes et capture des exceptions.
  - `src/app/api/auth/[...nextauth]/route.ts` : Route API App Router exportant les handlers `GET` et `POST`.
- Middleware de protection globale des routes (`src/middleware.ts`) :
  - Interception de toutes les routes de l'application via matcher regex (Ã  l'exception de `/api/auth`, `/api/health`, `_next/static`, `_next/image`, `favicon.ico` et mÃ©dias).
  - Redirection automatique HTTP 307 de la racine `/` vers `/dashboard` (si connectÃ©) ou `/login` (si anonyme).
  - Redirection des utilisateurs dÃ©jÃ  connectÃ©s visitant `/login` vers `/dashboard`.
  - Verrouillage des routes privÃ©es (`/dashboard`, `/projects`, `/api/protected`) vers `/login?callbackUrl=...`.
- Interface utilisateur d'authentification (`src/app/(auth)/login/page.tsx`) :
  - Composant interactif Client avec enveloppe `<Suspense>` pour compatibilitÃ© stricte `useSearchParams()`.
  - Formulaire de connexion avec gestion d'Ã©tat, affichage des erreurs via `<Alert variant="destructive">`.
  - Boutons d'accÃ¨s rapide (Badges cliquables) prÃ©remplissant les comptes de test seedÃ©s (`etienne@imt.fr` / `password` et `hugo@imt.fr` / `password`).
- Tableau de bord applicatif protÃ©gÃ© (`src/app/(protected)/dashboard/page.tsx`) :
  - Server Component avec contrÃ´le de session asynchrone `await auth()`.
  - Affichage du profil utilisateur connectÃ© (nom, email, badge de rÃ´le `ADMIN` ou `MEMBER`).
  - Formulaire de dÃ©connexion sÃ©curisÃ© via Server Action appelant `signOut({ redirectTo: "/login" })`.
- DÃ©fense en profondeur sur la route racine (`src/app/page.tsx`) :
  - Composant serveur dynamique redirigeant vers `/dashboard` ou `/login` en synergie avec le middleware.

## [0.2.0] - 2026-09-25 (Milestone 2 : Neon & Prisma Database Setup & Seed)

### AjoutÃ©
- Configuration du projet Neon CLI :
  - Installation des compÃ©tences (`neon skills --agent antigravity -y`).
  - Configuration du serveur MCP Neon (`neon mcp -y`).
  - Liaison avec le projet distant `twilight-violet-40207883` sur la branche `production` (`neon link`).
  - Fichier de configuration `neon.ts` dÃ©clarant le bucket privÃ© S3 `uploads` pour Neon Object Storage.
  - DÃ©ploiement rÃ©ussi de la configuration Neon (`neon deploy`).
- SchÃ©ma Prisma complet (`prisma/schema.prisma`) :
  - 10 Ã©numÃ©rations : `Role`, `TaskStatus`, `TaskPriority`, `MeetingStatus`, `MilestoneStatus`, `BudgetCategory`, `BudgetStatus`, `NotificationType`, `EventVisibility`, `EventType`.
  - 11 modÃ¨les de donnÃ©es : `User`, `Project`, `Task`, `TaskAssignment`, `Meeting`, `MeetingAttendee`, `MeetingDecision`, `GanttMilestone`, `BudgetEntry`, `Notification`, `Event`.
  - Double configuration datasource : pooling PgBouncer (`DATABASE_URL`) pour le runtime et connexion directe (`DIRECT_URL`) pour les migrations/DDL.
- Script de peuplement idempotent (`prisma/seed.ts` et `prisma/seed-data.ts`) :
  - CrÃ©ation/mise Ã  jour du projet unique IMT 2026-2027.
  - Enregistrement des 6 utilisateurs officiels avec hash bcrypt sÃ©curisÃ© (10 tours) pour le mot de passe initial "password" (2 ADMIN : Etienne et Liam ; 4 MEMBER : Hugo, Milane, Solal, Peter).
  - Enregistrement des 11 jalons Gantt officiels IMT prÃ©chargÃ©s.
- Script de vÃ©rification automatisÃ©e de l'Ã©tat de la base de donnÃ©es (`prisma/verify-db.ts`) confirmant :
  - 6 utilisateurs enregistrÃ©s et valides sous bcrypt.
  - 2 administrateurs conformes.
  - 11 jalons Gantt enregistrÃ©s.
  - 11 tables crÃ©Ã©es dans le schÃ©ma public.
- Client Prisma singleton (`src/lib/prisma.ts`) pour Server Components, Server Actions et routes d'API.
- Variables d'environnement configurÃ©es dans `app/.env` (DATABASE_URL, DIRECT_URL, AWS S3 Object Storage, AUTH_SECRET).

## [0.1.0] - 2026-09-25 (Milestone 1 : Next.js 14 Scaffolding & Setup)

### AjoutÃ©
- Initialisation complÃ¨te de l'application Next.js 14.2.23 avec App Router et TypeScript strict.
- Configuration Tailwind CSS 3.4 avec design system shadcn/ui en variables HSL (mode clair et sombre).
- Configuration PostCSS (`postcss.config.mjs`) et configuration Next.js ESM (`next.config.mjs`).
- Fichier de configuration `components.json` pour shadcn/ui avec style `default` et base `slate`.
- Primitives d'interface rÃ©utilisables dans `src/components/ui/` :
  - `Button` : Bouton polymorphique avec support `asChild` (Radix Slot) et variantes de taille/style.
  - `Input` : Champ de formulaire avec focus ring et gestion d'Ã©tat dÃ©sactivÃ©.
  - `Card` : Ensemble modulaire (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter).
  - `Label` : LibellÃ© accessible basÃ© sur `@radix-ui/react-label`.
  - `Alert` : BoÃ®te d'alerte pour messages et erreurs d'authentification.
  - `Badge` : Indicateur visuel pour rÃ´les (`ADMIN`, `MEMBER`) et Ã©tats.
- Utilitaire de fusion conditionnelle de classes CSS `cn()` dans `src/lib/utils.ts`.
- Architecture de routage App Router :
  - `layout.tsx` racine avec polices Google `Inter`, mÃ©tadonnÃ©es en franÃ§ais et `Providers`.
  - `page.tsx` avec redirection immÃ©diate vers `/login`.
  - Groupe de routes d'authentification `(auth)` avec layout centrÃ© et page `/login`.
  - Groupe de routes protÃ©gÃ©es `(protected)` avec layout applicatif (header et navigation) et page `/dashboard`.
  - FrontiÃ¨res systÃ¨me : `loading.tsx`, `not-found.tsx`, `error.tsx`.
  - Points d'accÃ¨s API : sonde de disponibilitÃ© `/api/health` et stub `/api/auth/[...nextauth]`.
- Suite de tests unitaires pour l'utilitaire `cn()` dans `src/lib/__tests__/utils.test.ts`.

### v1.0.2 (Design Audit, Emojis, Agenda & Tâches)
- Audit UI/UX : Suppression totale des émojis remplacés par des icônes Lucide-react dans tous les composants.
- Interface : Masquage du badge de rôle utilisateur dans le Header et le Dashboard pour plus de fluidité.
- Navigation Agenda : Ajout du composant CustomCalendarToolbar pour réparer la navigation (boutons Aujourd'hui, Mois, Semaine) cassée par le reset Tailwind CSS.
- Workflow Tâches : Modification de l'API (/api/tasks) et du modal (TaskModal) pour permettre aux membres de s'assigner eux-mêmes des tâches, tandis que les administrateurs gardent l'accès global.
- Thèmes (Settings) : Création de CustomThemeProvider permettant aux administrateurs de personnaliser les couleurs globales via la page des paramètres.


