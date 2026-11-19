# ⛵ Projet Ouvert IMT — Plateforme de Pilotage « Voilier MINIMOCA »

Application web collaborative de gestion de projet pour l'équipe CI1 d'IMT Nord Europe (Projet Ouvert 2026-2027, voilier **MINIMOCA** classe RG65 à l'échelle 1:7).

> **Version applicative** : 2.16.3 — **Dernière mise à jour de ce README** : 19/11/2026
> **Dépôt** : `github.com/epcrd63000/projet_ouvert` — **Branche de production** : `main`
> **Historique détaillé** : [`CHANGELOG.md`](CHANGELOG.md)

---

## 0. Guide de lecture (si tu es une IA ou un nouvel intervenant)

Ce dépôt contient **deux choses distinctes** :

| Élément | Emplacement | Nature |
|---|---|---|
| L'application (celle qui est déployée) | [`app/`](app) | Next.js 14 (App Router) + Prisma + Neon |
| Un harnais de tests historiques | [`tests/`](tests) | Scripts Node `.mjs` lancés contre un serveur local |

**Le code qui compte est dans `app/src`.** Tout le reste est documentation, assets ou outillage.

Les 8 points à comprendre avant de toucher au code :

1. **Un seul projet, six utilisateurs.** Il n'y a pas de notion de « multi-projets » : `Project` est une ligne unique (singleton), récupérée avec `prisma.project.findFirst()`. Tout le reste y est rattaché.
2. **Base de données distante.** PostgreSQL hébergé sur **Neon**, accédé via l'adaptateur **HTTP** `@prisma/adapter-neon` — donc **aucune transaction interactive** (voir §16). Ne jamais écrire `$transaction([...])` ni `updateMany` sans vérifier.
3. **Auth maison.** NextAuth v5 (beta) + provider `credentials` maison (prénom OU email + mot de passe bcrypt). Pas de OAuth.
4. **Tout est « force-dynamic ».** Les pages qui lisent la base sont rendues à la requête ; l'invalidation se fait par `revalidatePath()`.
5. **Le contrôle d'accès est double** : un middleware Edge qui bloque les pages non authentifiées, puis des gardes `requireAuth()` / `requireAdmin()` dans chaque route API. Le middleware **n'est pas** une garantie de sécurité côté API.
6. **Les dépendances à la base sont nombreuses** : impossible de lancer l'app sans un `DATABASE_URL` valide (le build passe, le runtime non).
7. **Deux mots de passe coexistent** : `passwordHash` (bcrypt, la vérité) et `tempPassword` (en clair, pour que l'admin puisse le communiquer). Ils doivent rester synchronisés — voir §12 et §16, c'est un ancien bug qui a bloqué toute l'équipe.
8. **Répertoire de travail attendu** : toutes les commandes `npm` de l'app se lancent **dans `app/`**, pas à la racine.

Commandes de vérification rapides (depuis `app/`) :

```bash
npx tsc --noEmit          # typage strict, doit sortir sans erreur
npm run build             # build de production (≈ 2 min)
npm run db:verify         # contrôle de cohérence de la base Neon
npx tsx src/__tests__/06_auth_integration.test.ts   # auth de bout en bout
```

---

## Sommaire

1. [Contexte et objectif](#1-contexte-et-objectif)
2. [Stack technique](#2-stack-technique)
3. [Démarrage rapide](#3-démarrage-rapide)
4. [Architecture générale](#4-architecture-générale)
5. [Arborescence du dépôt](#5-arborescence-du-dépôt)
6. [Arborescence détaillée de `app/src`](#6-arborescence-détaillée-de-appsrc)
7. [Modèle de données](#7-modèle-de-données)
8. [Authentification et permissions](#8-authentification-et-permissions)
9. [Fonctionnalités, page par page](#9-fonctionnalités-page-par-page)
10. [API REST](#10-api-rest)
11. [Modules métier (`src/lib`)](#11-modules-métier-srclib)
12. [Composants (`src/components`)](#12-composants-srccomponents)
13. [Scripts d'exploitation (`app/prisma`)](#13-scripts-dexploitation-appprisma)
14. [Variables d'environnement](#14-variables-denvironnement)
15. [Tests](#15-tests)
16. [Contraintes techniques et pièges](#16-contraintes-techniques-et-pièges)
17. [Dette technique et points de vigilance](#17-dette-technique-et-points-de-vigilance)
18. [Carte « je veux modifier X »](#18-carte-je-veux-modifier-x)
19. [Conventions de code](#19-conventions-de-code)
20. [Documentation et historique](#20-documentation-et-historique)

---

## 1. Contexte et objectif

L'équipe (6 étudiants) doit concevoir et fabriquer un voilier radio-commandé **MINIMOCA** dans le cadre du module Projet Ouvert. La plateforme centralise tout ce que le groupe doit suivre pendant l'année :

- la **planification** (jalons IMT, Gantt, agenda partagé) ;
- le **suivi des tâches** (Kanban personnel + tableau détaillé type « M2V5 ») ;
- les **réunions** (ordre du jour généré avec une IA externe, émargement, comptes rendus, relevé de décisions, export PDF) ;
- le **budget et la trésorerie** (enveloppes APICIL / BDE / Fablab, dépenses, annulations) ;
- la **base de connaissances** (fiches « Infos Importantes », liens utiles, bibliothèque de prompts IA) ;
- la **communication interne** (notifications, diffusion d'alertes, bannières).

### L'équipe

| Membre | Rôle | Identifiant de connexion | Email officiel |
|---|---|---|---|
| Étienne PICARD | ADMIN (chef de projet) | `etienne` | etienne.picard@etu.imt-nord-europe.fr |
| Liam BEAN | ADMIN (second) | `liam` | liam.bean@etu.imt-nord-europe.fr |
| Hugo RAMPAZZO | MEMBER | `hugo` | hugo.rampazzo@etu.imt-nord-europe.fr |
| Milane FARGUES | MEMBER | `milane` | milane.fargues@etu.imt-nord-europe.fr |
| Solal BENQADI | MEMBER | `solal` | solal.benqadi@etu.imt-nord-europe.fr |
| Peter BATLLO | MEMBER | `peter` | peter.batllo@etu.imt-nord-europe.fr |

> Le cahier des charges fonctionnel d'origine est dans [`docs/CAHIER_DES_CHARGES.md`](docs/CAHIER_DES_CHARGES.md). Il décrit la cible V2 ; certaines évolutions (V3) y sont encore listées comme « à venir ».

---

## 2. Stack technique

| Couche | Choix | Version |
|---|---|---|
| Framework | Next.js (App Router, Server Components) | 14.2.23 |
| Langage | TypeScript strict | 5.6 |
| UI | Tailwind CSS + primitives Radix/shadcn + Lucide | 3.4 |
| Graphiques | Recharts | 2.13 |
| Auth | NextAuth v5 (Auth.js, beta) + provider Credentials | 5.0.0-beta.32 |
| ORM | Prisma Client + `@prisma/adapter-neon` (HTTP, serverless) | 6.19.3 |
| Base | PostgreSQL (Neon, branche `production`) | — |
| Mots de passe | bcryptjs (10 rounds) | 2.4.3 |
| Validation | Zod | 3.23 |
| Éditeur riche | Tiptap + tiptap-markdown | 3.31 |
| Calendrier | react-big-calendar | 1.15 |
| PDF / export | jsPDF + html2canvas + JSZip | 4.2 |
| Tableaux | @tanstack/react-table | 8.21 |
| Notifications UI | Sonner | 2.0 |
| Hébergement | Vercel (build auto sur `main`, root directory = `app`) | — |
| Stockage objets | Neon Object Storage (S3-compatible, bucket `uploads`) | — |

---

## 3. Démarrage rapide

### Prérequis

- Node.js 20+
- Un accès à la base Neon du projet (ou une base de test)
- npm (le dépôt contient `app/package-lock.json`)

### Installation

```bash
cd app
npm install            # lance aussi `prisma generate` (postinstall)
cp .env.example .env   # puis renseigner DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run dev            # http://localhost:3000, écoute sur 0.0.0.0 (test mobile)
```

### Scripts npm (dans `app/`)

| Script | Effet |
|---|---|
| `npm run dev` | Serveur de développement (`next dev -H 0.0.0.0`) |
| `npm run dev:mobile` | Identique (alias, pratique pour tester depuis un téléphone sur le LAN) |
| `npm run build` | Build de production |
| `npm run start` | Démarre le build |
| `npm run lint` | ESLint (config `next/core-web-vitals`) |
| `npm run prisma:generate` | Régénère le client Prisma |
| `npm run db:seed` | Rejoue le seed (`prisma db seed` → `prisma/seed.ts`) |
| `npm run db:verify` | Vérifie la conformité de la base |

> ⚠️ `db:seed` est **idempotent** mais écrase les données de référence. Il ne touche plus aux mots de passe depuis la v2.16.3.

### Déploiement

- Push sur `main` → Vercel reconstruit automatiquement.
- Le **root directory Vercel doit être `app`** (et non la racine du dépôt).
- Les variables d'environnement sont à dupliquer dans Vercel (§14).
- Une modification de `schema.prisma` nécessite un `prisma db push` **avant** le déploiement (pas de dossier `migrations/` : le projet travaille en `db push`).

---

## 4. Architecture générale

```
                     ┌──────────────────────────────┐
   Navigateur ─────► │  Next.js (Vercel)            │
                     │  • middleware.ts (Edge)      │  cookie JWT (30 j)
                     │  • Server Components         │
                     │  • Route Handlers /api/*     │
                     └───────────────┬──────────────┘
                                     │ Prisma + adapter HTTP Neon
                                     ▼
                     ┌──────────────────────────────┐
                     │ PostgreSQL (Neon, serverless)│
                     │ 16 tables, 13 énumérations   │
                     └──────────────────────────────┘
```

**Flux d'une requête authentifiée :**

1. `src/middleware.ts` intercepte la requête, lit le JWT via `NextAuth(authConfig)`.
2. Pas de session → redirection vers `/login?callbackUrl=…`. Session → `NextResponse.next()`.
3. La page (Server Component) ou la route API rappelle `auth()` (ou `requireAuth()` / `requireAdmin()`).
4. Les données sont lues/écrites via `prisma` (`src/lib/prisma.ts`).
5. Les composants clients rafraîchissent via `router.refresh()` ou `revalidatePath()`.

**Ce qui n'existe pas (à ne pas chercher) :**

- Pas de Server Actions (tout passe par `/api/*`).
- Pas de `middleware` de rôle : le filtrage ADMIN se fait dans les pages/API.
- Pas de tests unitaires Jest/Vitest : les « tests » sont des scripts `tsx` exécutables.
- Pas de Storybook, pas de CI GitHub Actions.

---

## 5. Arborescence du dépôt

```
PROJET OUVERT/
├── README.md                     ← ce document (point d'entrée pour un humain ou une IA)
├── CHANGELOG.md                  ← journal des modifications, version par version (source de vérité fonctionnelle)
├── package.json                  ← dépendances du CLI Neon (*pas* celles de l'app)
├── package-lock.json
├── neon.ts                       ← configuration Neon (bucket S3 « uploads » privé)
├── .neon                         ← identifiants du projet Neon (org, project, branche)
├── .env.local                    ← secrets locaux (DATABASE_URL, clés S3) — NON versionné
├── .gitignore
├── skills-lock.json              ← versions épinglées des « agent skills » Neon (neondatabase/agent-skills)
│
├── docs/                         ← documentation et documents de cadrage
│   ├── CAHIER_DES_CHARGES.md     ← cahier des charges V2 du module
│   ├── SCHEMA_BASE_DE_DONNEES.md ← description longue du schéma relationnel
│   ├── MESSAGE_EQUIPE_ACCES.md   ← message type à envoyer aux membres (accès / mots de passe)
│   └── consignes/                ← supports de cours IMT (PDF/DOCX : planning, TD, Pecha Kucha, rapport MINIMOCA…)
│
├── app/                          ← ⭐ L'APPLICATION (root directory Vercel)
│   ├── package.json              ← dépendances et scripts
│   ├── next.config.mjs           ← images distantes, en-têtes de sécurité, cache webpack
│   ├── tsconfig.json             ← strict, alias `@/* → ./src/*`
│   ├── tailwind.config.ts        ← thème (variables HSL), animations
│   ├── postcss.config.mjs
│   ├── components.json           ← configuration shadcn/ui
│   ├── .eslintrc.json
│   ├── .env / .env.example       ← variables d'environnement (le `.env` réel n'est pas versionné)
│   ├── prisma/                   ← schéma, seed et scripts d'exploitation (§13)
│   └── src/                      ← code source (§6)
│
├── tests/                        ← harnais de tests Node historiques (§15) — obsolète en partie
│   ├── run-all-tests.mjs         ← lanceur global
│   ├── 00_common/                ← config, client HTTP, client DB
│   ├── 01_tier1_feature_coverage/ … 06_tier5_adversarial_m2/
│   └── package.json
│
├── visuels/                      ← assets graphiques du voilier (XCF GIMP, PNG, PDF, logo SVG)
│   ├── bateau.xcf, bateau.png, bateau1.png
│   ├── bateau_pliable.xcf, recto.png, verso_bateau_pliable.png
│   └── logo/…
│
└── scratch/                      ← brouillons locaux (ignoré par git) : scripts jetables, code perso, rapports extraits
```

> **Ce qui a été rangé le 19/11/2026** : `Doc-consignes-etc/` → `docs/consignes/` ; les trois `.md` de documentation → `docs/` ; suppression de `app/check.js`, `app/test-conn.ts`, `app/seed-prompt.js`, `app/cypress*` (Cypress n'était pas installé), du doublon `app/CHANGELOG.md`, de l'ancien `app/README.md` et de `Doc-consignes-etc/desktop.ini` ; le code de licence Autodesk a été déplacé dans `scratch/perso/` (hors versionnement). Aucun chemin de code ne référençait ces fichiers : build et tests inchangés.

---

## 6. Arborescence détaillée de `app/src`

```
app/src/
├── middleware.ts                  Edge middleware : session JWT, redirections `/`, `/login`, routes protégées
├── types/
│   └── next-auth.d.ts             Augmentation des types Session/User/JWT (id, role, avatarUrl)
│
├── app/                           Routes Next.js (App Router)
│   ├── layout.tsx                 <html>, polices, <Providers>, métadonnées
│   ├── globals.css                Variables CSS du thème (clair/sombre) + base Tailwind
│   ├── page.tsx                   Racine « / » → redirection (le middleware gère le cas)
│   ├── loading.tsx                Écran de chargement global
│   ├── error.tsx                  Error boundary globale (client)
│   ├── not-found.tsx              Page 404
│   ├── icon.svg                   Favicon
│   │
│   ├── (auth)/                    Groupe public
│   │   ├── layout.tsx             Mise en page centrée (carte)
│   │   └── login/page.tsx         Formulaire de connexion (client) : identifiant + mot de passe, œil, erreurs
│   │
│   ├── (protected)/               Groupe protégé (layout serveur + shell)
│   │   ├── layout.tsx             `auth()` + <ProtectedShell> + <TempPasswordBanner>
│   │   ├── dashboard/page.tsx     Tableau de bord (KPI, graphiques, onglet activité admin)
│   │   ├── kanban/page.tsx        Tâches : bascule Kanban / tableau M2V5
│   │   ├── meetings/page.tsx      Liste des réunions (cartes, aperçu ordre du jour, création)
│   │   ├── meetings/[id]/page.tsx Fiche réunion (présence, ordre du jour, CR, décisions, PDF)
│   │   ├── agenda/page.tsx        Calendrier (mois/semaine/jour) + volet latéral des tâches
│   │   ├── gantt/page.tsx         Diagramme de Gantt des jalons (+ édition admin)
│   │   ├── budget/page.tsx        Trésorerie : enveloppes, dépenses, export CSV
│   │   ├── infos/page.tsx         Fiches « Infos Importantes » (Markdown, import/export)
│   │   ├── links/page.tsx         Liens utiles (grille de cartes, épinglage)
│   │   ├── ai-prompts/page.tsx    Bibliothèque de prompts IA
│   │   ├── notifications/page.tsx Liste des notifications
│   │   └── settings/page.tsx      Paramètres : identifiants (Étienne), thème, mot de passe, comptes, alertes
│   │
│   └── api/                       Route Handlers (§10)
│
├── components/                    Composants React (§12)
│   ├── ui/                        Primitives shadcn (button, card, dialog, input, tabs, …)
│   ├── layout/                    Shell : Header, Sidebar, navConfig, ProtectedShell, BottomNavBar, MobileNavDrawer, NotificationBell, TempPasswordBanner
│   ├── dashboard/                 KPI, graphiques Recharts, heartbeat, onglet activité admin
│   ├── kanban/                    Board, colonnes, cartes, modales, tableau M2V5 (sous-dossier table/)
│   ├── meetings/                  Cartes, modales, ordre du jour, présence, décisions, CR, assistant IA
│   ├── agenda/                    Calendrier, toolbar, modale d'événement, tiroir de tâches
│   ├── budget/                    (composants de page dans app/(protected)/budget/components) + cartes/tables
│   ├── infos/                     Cartes, éditeur, toolbar, rendu Markdown, export
│   ├── links/                     Grille, cartes, modale, toolbar, utilitaires
│   ├── settings/                  Gestion utilisateurs, panneau identifiants Étienne, alertes, préférences
│   └── theme/                     Fournisseur de thème custom + réglages
│
├── lib/                           Logique métier pure + accès base (§11)
│   ├── prisma.ts                  Singleton PrismaClient + adaptateur Neon HTTP
│   ├── auth.ts                    Configuration NextAuth + callback `authorize` (credentials)
│   ├── auth.config.ts             Configuration Edge-safe (sessions JWT, callbacks, pages)
│   ├── auth/credentialsLogic.ts   Identifiants, mots de passe temporaires, email d'invitation
│   ├── permissions.ts             requireAuth / requireAdmin / isAdmin
│   ├── notifications.ts           Création de notifications (1, N, tous)
│   ├── csvExport.ts               Export CSV des tâches (M2V5)
│   ├── utils.ts                   `cn()` (clsx + tailwind-merge)
│   ├── validations/               Schémas Zod (task, meeting, event, milestone, user)
│   ├── budget/                    Calculs budgétaires et règles de trésorerie
│   ├── dashboard/                 Métriques du dashboard + activité admin hebdomadaire
│   ├── m2v5/                      Logique du tableau détaillé (avancement, retard, permissions, copie TSV)
│   ├── tasks/                     Périmètre des tâches, statuts collectifs, décision de suppression
│   └── meetings/                  Agenda/ordre du jour, parsing IA, décisions, édition, PDF, export ZIP
│
├── hooks/
│   └── useTasks.ts                Hook client : fetch des tâches, filtres, mutations, refresh
│
└── __tests__/                     Suite TDD maison (13 scripts tsx, §15)
```

---

## 7. Modèle de données

**16 modèles**, **13 énumérations** — source : [`app/prisma/schema.prisma`](app/prisma/schema.prisma).

### Tables

| Modèle | Rôle | Points clés |
|---|---|---|
| `Project` | Projet singleton | `totalBudget`, `startDate`, `endDate` ; une seule ligne en pratique |
| `User` | Membre | `email` unique, `passwordHash`, `tempPassword`, `tempPasswordExpiresAt`, `role` |
| `Task` | Tâche | `status`, `priority`, `position`, `dueDate`, `progress` (0-100), `tags[]`, `workload`, `deliverables`, `validationCriteria`, `validator`, `lastUpdate`, `delayReason`, `parentId` (sous-tâches) |
| `TaskAssignment` | Assignation N-N | `status` **individuel** par membre ; `@@unique([taskId,userId])` |
| `Meeting` | Réunion | `scheduledAt`, `objectives`, `notes`, `reportContent`, `isReportDownloaded`, `status` |
| `MeetingAttendee` | Émargement | `status` = PRESENT / EXCUSED / ABSENT |
| `MeetingDecision` | Décision | `content`, `assigneeId`, `assigneeIds[]`, `dueDate`, `taskId` (unique) si convertie en tâche |
| `GanttMilestone` | Jalon | `startDate`, `endDate`, `color`, `status`, `isPreloaded` |
| `BudgetEntry` | Dépense | `quantity`, `unitPrice`, `deliveryCost`, `amount` (Decimal), `category`, `status`, `fundingSourceId` |
| `FundingSource` | Enveloppe / sponsor | `name`, `amount`, `status` (RECEIVED/PENDING/CANCELLED) |
| `Notification` | Notification | `type`, `isRead`, `relatedEntityId/Type` |
| `Event` | Événement d'agenda | `startAt`, `endAt`, `allDay`, `visibility` (PERSONAL/TEAM), `type` (MANUAL/MEETING/MILESTONE), liens vers réunion/jalon |
| `AiPrompt` | Prompt IA | `title`, `content` (Markdown) |
| `ImportantInfo` | Fiche documentaire | `category`, `eventDate`, `interlocutors`, `isPinned`, `order`, `content` (Text) |
| `UserActivityLog` | Trace d'activité | `actionType` (VISIT, TASK_CREATE…), `details` ; alimente l'onglet admin |
| `ProjectLink` | Lien utile | `url`, `category`, `imageUrl`, `isPinned`, `order` |

### Énumérations

`Role` (ADMIN, MEMBER) · `TaskStatus` (TODO, IN_PROGRESS, DONE, BLOCKED) · `TaskPriority` (LOW, NORMAL, HIGH, CRITICAL) · `MeetingStatus` (PLANNED, IN_PROGRESS, DONE) · `MilestoneStatus` (UPCOMING, IN_PROGRESS, ACHIEVED, MISSED) · `BudgetCategory` (SUPPLIES, SERVICES, SOFTWARE, OTHER) · `BudgetStatus` (PLANNED, VALIDATED, PAID, CANCELLED) · `FundingStatus` (RECEIVED, PENDING, CANCELLED) · `NotificationType` (9 valeurs) · `EventVisibility` · `EventType` · `AttendanceStatus` · `AlertLevel` (INFO, WARNING, CRITICAL — **déclaré mais inutilisé : aucun modèle `AlertBanner` n'existe**).

### Relations marquantes

- `Task 1—N TaskAssignment N—1 User` : une tâche peut être portée par plusieurs membres, chacun avec **son propre statut**.
- `Task.parentId → Task` (auto-relation `SubTasks`, suppression en cascade).
- `MeetingDecision.taskId → Task` (unique : une décision donne au plus une tâche) ; `MeetingDecision.assigneeIds[]` double la relation `assigneeId`.
- `Event → Meeting | GanttMilestone` (synchronisation calendrier ↔ réunions ↔ jalons).
- `BudgetEntry → FundingSource` : chaque dépense peut être imputée à une enveloppe.
- Suppressions : `onDelete: Cascade` depuis `Project`, `SetNull` pour les auteurs.

---

## 8. Authentification et permissions

### Flux de connexion

```
/login (client)
  └─ signIn("credentials", { identifier, password })
       └─ POST /api/auth/callback/credentials
            └─ authorize()  [src/lib/auth.ts]
                 ├─ Zod : identifier non vide, password non vide
                 ├─ rejet des `\0`
                 ├─ prisma.user.findMany() puis matchUserIdentifier(user, identifiant)
                 │     ↳ email exact | nom complet | prénom | préfixe email (insensible à la casse)
                 ├─ bcrypt.compare(password, user.passwordHash)
                 └─ retour { id, name, email, role, avatarUrl }
       └─ JWT signé (callbacks jwt/session), cookie `authjs.session-token`, 30 jours
  └─ window.location.href = callbackUrl ("/dashboard" par défaut)
```

- Le formulaire accepte donc **`etienne`**, **`Etienne`**, **`Etienne PICARD`**, **`etienne.picard`** ou l'email complet.
- Les messages d'erreur sont volontairement génériques (pas d'énumération de comptes).
- `trustHost: true`, secret = `AUTH_SECRET` ou `NEXTAUTH_SECRET`.

### Deux couches de protection

| Couche | Fichier | Rôle |
|---|---|---|
| Middleware Edge | `src/middleware.ts` | Redirige `/` (→ dashboard ou login), bloque `/login` si déjà connecté, redirige toute page protégée vers `/login?callbackUrl=…`. Exclut `api/auth`, `api/health`, `_next/*`, images. |
| Gardes API | `src/lib/permissions.ts` + `auth()` | `requireAuth()` (tout connecté), `requireAdmin()` (rôle ADMIN). Chaque route décide. |

### Matrice des droits

| Action | MEMBER | ADMIN |
|---|---|---|
| Voir dashboard, agenda, gantt, infos, liens, prompts, réunions | ✅ | ✅ |
| Créer une tâche | ✅ (assignée à lui-même uniquement) | ✅ (peut assigner n'importe qui) |
| Modifier une tâche | ✅ si assigné / co-assigné / créateur | ✅ toujours |
| Supprimer une tâche collective | ✅ retire seulement son assignation | ✅ choix « me retirer » ou « supprimer » |
| Créer / modifier une réunion | ✅ | ✅ |
| Supprimer une réunion | ❌ (sauf créateur) | ✅ |
| Émargement, décisions, CR | ✅ | ✅ |
| Créer / éditer un jalon Gantt | ✅ via API (UI réservée admin) | ✅ |
| Supprimer un jalon | ❌ | ✅ |
| Dépenses, financements | ✅ création/édition | ✅ + gestion des enveloppes |
| Fiches Infos, liens utiles | ✅ | ✅ |
| Prompts IA (écriture) | ❌ | ✅ |
| Gestion des comptes | ❌ | ✅ (suppression admin only) |
| Régénérer un mot de passe | ❌ | ✅ **Étienne uniquement** (`/api/admin/reset-password`) |
| Onglet « Activité équipe » | ❌ | ✅ |
| Diffuser une alerte globale | ⚠️ techniquement oui (voir §17) | ✅ |

---

## 9. Fonctionnalités, page par page

### `/dashboard` — Tableau de bord

- **7 KPI** : taux d'avancement global, retards, contribution par membre, jalons atteints, workload, budget consommé, compte à rebours avant la prochaine réunion.
- Bandeau personnel : « vos tâches » (assignées / en cours / terminées) et votre % d'avancement.
- Graphiques Recharts : avancement par membre, **radar workload** (tâches assignées vs en cours), répartition des statuts.
- Onglet **« Activité Équipe (Admin) »** : navigation par semaine, histogramme trié, top contributeur, tableau détaillé (visites, actions, dernière connexion), badges d'inactivité.
- Heartbeat : `ActivityHeartbeat` poste `/api/activity/heartbeat` pour tracer la présence.
- Rafraîchissement sans F5 (`revalidatePath` + `router.refresh()` au retour d'onglet).

### `/kanban` — Tâches

- **Vue Kanban** : 4 colonnes (TODO / IN_PROGRESS / DONE / BLOCKED), glisser-déposer (`@dnd-kit`).
- **Vue tableau M2V5** : colonnes Tâche, Pilote, Échéance, Charge, Livrables, Priorité, Qui valide/Comment, % Avancement, Dernière MAJ, Retard/Cause — tri, filtres, édition en ligne, ajout rapide, export CSV, copie TSV.
- Sélecteur **`[ Toutes les tâches ] [ Mes tâches ]`** avec compteurs.
- Création/édition : titre, description, statut, priorité, échéance, assignés multiples, charge, livrables, critères de validation, cause de retard, tags, sous-tâches.
- Panneau de détail au clic : édition si légitime, sinon **lecture seule**.
- Statut consolidé d'une tâche collective : « terminée » seulement si **tous** les assignés sont DONE ; « en cours » dès qu'un seul a commencé.
- Suppression intelligente : se retirer d'une tâche partagée vs supprimer pour tous.

### `/meetings` et `/meetings/[id]` — Réunions

- Liste en cartes avec statut, date, participants et **aperçu de l'ordre du jour**.
- Détection personnalisée : si votre prénom apparaît dans les livrables attendus, un bandeau « 🎯 Vos préparatifs » s'affiche.
- **Assistant IA** : compilation d'un prompt prêt à coller (ChatGPT/Gemini) à partir de notes brutes → l'IA renvoie un ordre du jour structuré (Objectifs / Ordre du jour minuté / Préparatifs par membre) → injection en Markdown dans la fiche.
- **Annonce d'équipe** : génération d'un message à copier pour Discord/WhatsApp (date, lieu, participants, sujets).
- Fiche réunion : émargement (PRESENT/EXCUSED/ABSENT), édition des infos, participants, CR (éditeur riche Tiptap + Markdown), **export PDF** (individuel ou groupé en ZIP).
- **Décisions** : ajout, édition, responsables multiples, échéance, conversion en tâche Kanban (avec assignations synchronisées).
- Tâche collective « 📅 Préparer la réunion : … » créée automatiquement, échéance synchronisée, supprimée quand la réunion est terminée ou supprimée.
- Événement d'agenda associé synchronisé à chaque modification.

### `/agenda` — Agenda

- Vues mois / semaine / jour / liste (`react-big-calendar`), toolbar custom.
- Événements MANUAL (créés), MEETING (réunions) et MILESTONE (jalons), visibilité PERSONAL ou TEAM.
- Volet latéral des tâches (liste + détail) pour planifier sans quitter le calendrier.

### `/gantt` — Diagramme de Gantt

- Frise chronologique des 11 jalons IMT (préchargés) + jalons ajoutés.
- Panneau latéral de détail, création/édition/suppression (édition réservée aux admins dans l'UI).
- Couleurs, statuts (UPCOMING / IN_PROGRESS / ACHIEVED / MISSED).

### `/budget` — Trésorerie

- Cartes de synthèse : fonds disponibles, payé, engagé, solde réel, jauge de consommation.
- Cartes par enveloppe (APICIL 2 997 €, BDE 116 €, Fablab 70 €, etc.).
- Tableau des financements (ajout, édition, annulation non destructive, commentaire).
- Tableau des dépenses (libellé, quantité, prix unitaire, port, total recalculé, enveloppe, statut, commentaire).
- Annulation = ligne conservée, grisée, exclue des totaux, réactivable.
- Export CSV UTF-8 BOM (compatible Excel), total budget recalculé automatiquement depuis les enveloppes.

### `/infos` — Infos Importantes

- Fiches Markdown catégorisées (ORGANISATION, CALENDRIER, TECHNIQUE, GENERAL), avec date clé, interlocuteurs, épinglage.
- Rendu Markdown riche (tableaux, citations, code), édition collaborative par tout membre.
- Import d'un `.md` (parsing du frontmatter) et export d'une fiche en `.md`.

### `/links` — Liens utiles

- Grille de cartes avec favicon automatique (Google Favicon V2), catégories, épinglage.
- Ajout/édition/suppression, recherche plein texte, filtres par catégorie.

### `/ai-prompts` — Bibliothèque de prompts IA

- Liste des modèles Markdown (CR de réunion, extraction de tâches, analyse de risques…).
- Copie en un clic ; ajout/édition/suppression réservés aux admins.

### `/notifications` — Notifications

- Liste, marquage lu, « tout marquer lu » ; cloche dans le header avec compteur.

### `/settings` — Paramètres

- **Espace Accès & Identifiants (Étienne)** : voir les mots de passe temporaires, les copier, les régénérer (échéance 30 j), envoyer un mail d'invitation pré-rempli, copier le récapitulatif.
- **Thème** : clair/sombre/système + couleurs personnalisées.
- **Mon mot de passe** : changement (efface `tempPassword` et l'échéance).
- **Diffusion d'alerte** : notification système à toute l'équipe (INFO/WARNING/CRITICAL).
- **Gestion des comptes (admin)** : liste, création, modification, suppression (interdiction de rétrograder le dernier admin).

---

## 10. API REST

35 route handlers sous `app/src/app/api`. Toutes renvoient du JSON. `AUTH` = session requise ; `ADMIN` = rôle requis.

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | `/api/health` | public | Sonde de santé (status, version, timestamp) |
| GET/POST | `/api/auth/[...nextauth]` | public | Handlers NextAuth (csrf, session, callback) |
| POST | `/api/activity/heartbeat` | AUTH | Enregistre une visite (`UserActivityLog`) |
| GET | `/api/admin/activity?weekOffset=n` | ADMIN | Activité hebdomadaire de l'équipe |
| POST | `/api/admin/reset-password` | ADMIN (Étienne) | Régénère un mot de passe temporaire |
| POST | `/api/alerts` | AUTH | Diffuse une notification système à tous |
| GET/POST | `/api/tasks` | AUTH | Liste (filtrable `userId`, `scope`) / création (MEMBER : soi-même) |
| PATCH/DELETE | `/api/tasks/[id]` | AUTH (admin / assigné / créateur) | Mise à jour, suppression ou désassignation |
| GET/POST | `/api/meetings` | AUTH | Liste / création (+ événement + tâche de préparation) |
| GET/PATCH/DELETE | `/api/meetings/[id]` | AUTH (suppression : admin/créateur) | Détail, édition synchronisée, suppression |
| PATCH | `/api/meetings/[id]/attendance` | AUTH | Émargement d'un participant |
| GET/POST | `/api/meetings/[id]/decisions` | AUTH | Décisions de la réunion |
| PATCH/DELETE | `/api/meetings/[id]/decisions/[decisionId]` | AUTH | Édition / suppression d'une décision |
| POST | `/api/meetings/[id]/decisions/[decisionId]/convert` | AUTH | Convertit une décision en tâche Kanban |
| GET/POST | `/api/milestones` | AUTH | Jalons Gantt |
| GET/PATCH/DELETE | `/api/milestones/[id]` | AUTH / DELETE ADMIN | Détail, édition, suppression |
| GET/POST | `/api/events` | AUTH | Événements d'agenda (visibilité PERSONAL/TEAM) |
| GET/PATCH/DELETE | `/api/events/[id]` | AUTH (admin ou créateur) | Détail, édition, suppression |
| GET/POST | `/api/budget` | AUTH | Dépenses |
| PATCH/DELETE | `/api/budget/[id]` | AUTH | Édition / suppression d'une dépense |
| GET/POST | `/api/budget/funding` | AUTH (POST/édition : ADMIN) | Enveloppes de financement |
| PATCH/DELETE | `/api/budget/funding/[id]` | AUTH (ADMIN ; commentaire ouvert à tous) | Édition, annulation, suppression |
| GET | `/api/budget/export` | AUTH | Export CSV dépenses + financements |
| GET/POST | `/api/infos` | AUTH | Fiches Infos Importantes |
| PATCH/DELETE | `/api/infos/[id]` | AUTH | Édition / suppression d'une fiche |
| GET/POST | `/api/links` | AUTH | Liens utiles |
| PATCH/DELETE | `/api/links/[id]` | AUTH | Édition / suppression d'un lien |
| GET | `/api/notifications` | AUTH | Notifications de l'utilisateur courant |
| PATCH | `/api/notifications/[id]/read` | AUTH | Marque une notification comme lue |
| PATCH | `/api/notifications/read-all` | AUTH | Marque tout comme lu |
| GET/POST | `/api/prompts` | GET AUTH / POST ADMIN | Bibliothèque de prompts |
| GET/PATCH/DELETE | `/api/prompts/[id]` | GET **public** ⚠️ / ADMIN | Détail, édition, suppression |
| POST | `/api/user/password` | AUTH | Change son propre mot de passe |
| GET/POST | `/api/users` | GET AUTH / POST ADMIN | Liste des membres / création de compte |
| GET/PATCH/DELETE | `/api/users/[id]` | AUTH (soi ou admin) / DELETE ADMIN | Profil, rôle, suppression |

**Format des erreurs** : `{ "error": "message" }` avec un code HTTP 400/401/403/404/409/500. Les validations d'entrée passent par Zod et renvoient `{ error, details }`.

---

## 11. Modules métier (`src/lib`)

> Toutes ces fonctions sont **pures** (sauf celles qui touchent `prisma`, signalées 🗄️) et directement testables sans HTTP.

### `lib/prisma.ts`
- `prisma` : singleton `PrismaClient` avec `PrismaNeonHTTP(DATABASE_URL)`. Réutilisé via `globalThis` hors production.

### `lib/auth.ts` / `lib/auth.config.ts`
- `handlers`, `auth`, `signIn`, `signOut` (NextAuth v5).
- `authorize()` : matching d'identifiant + bcrypt (voir §8).
- `authConfig` : sessions JWT (30 j), pages `/login`, callbacks `jwt` et `session` (injecte `id`, `role`, `avatarUrl`).

### `lib/auth/credentialsLogic.ts`
| Fonction | Rôle |
|---|---|
| `generateSecurePassword(length=10)` | Mot de passe aléatoire sans caractères ambigus, garanti mixte |
| `TEMP_PASSWORD_VALIDITY_DAYS` | Constante = 30 |
| `computeTempPasswordExpiry(from?)` | Date d'échéance J+30 |
| `formatTempPasswordExpiry(date)` | Format `jj/mm/aaaa` |
| `extractUserPseudo(fullName)` | `"Hugo RAMPAZZO"` → `"hugo"` |
| `matchUserIdentifier(user, identifiant)` | Résolution email / nom / prénom / préfixe |
| `buildInvitationEmailSubject()` | Objet du mail d'invitation |
| `buildInvitationEmailBody(user, appUrl)` | Corps du mail (identifiants, tour des onglets) |
| `buildMailtoUrl(user, appUrl)` | URL `mailto:` encodée |

### `lib/permissions.ts`
`requireAdmin()` · `requireAuth()` · `isAdmin(role)`.

### `lib/notifications.ts` 🗄️
- `createNotification({ userId, type, title, body, relatedEntityId?, relatedEntityType? })`
- `notifyUsers(userIds, payload)` · `notifyAllUsers(payload)`

### `lib/budget/budgetCalculations.ts`
`calculateEffectiveTotalBudget(fundingSources, fallback)` · `calculateEffectiveSpentBudget(entries)` · `calculateBudgetSummary(...)` — **source de vérité unique** partagée dashboard/trésorerie (exclut les `CANCELLED`).

### `lib/budget/budgetLogic.ts`
`formatDateForInput(date)` · `calculateExpenseTotal({quantity, unitPrice, deliveryCost})` · `validateFundingUpdate(...)` · `validateExpenseUpdate(...)` (Zod tolérant aux dates HTML).

### `lib/dashboard/dashboardMetrics.ts`
`calculateGlobalMetrics(tasks, milestones, consumedEntries, totalBudget)` · `calculateMemberProgress(users, tasks)` · `calculateWorkload(users, tasks)` · `calculatePersonalSummary(userId, tasks)`.

### `lib/dashboard/adminActivityMetrics.ts`
`getWeekDateRange(refDate, weekOffset)` · `calculateMemberWeeklyActivity(logs, users, tasks)` · `calculateActivitySummary(memberActivities)`.

### `lib/m2v5/m2v5Logic.ts`
`computeSyncStatusAndProgress(task)` (statut consolidé + %) · `isTaskOverdue(task, ref)` · `canUserEditTask(task, userId, isAdmin)` · `generateM2V5ClipboardTsv(tasks)`.

### `lib/tasks/taskScopeLogic.ts` · `lib/tasks/collectiveTaskLogic.ts`
`canUserEditTask` · `filterTasksByScope` · `computeCollectiveTaskStatus` · `getEffectiveUserTaskStatus` · `determineTaskDeletionAction` (retirer vs supprimer).

### `lib/meetings/agendaService.ts` 🗄️ (partiellement)
`DEFAULT_AGENDA_PROMPT_TEMPLATE` · `compileAgendaPrompt(meeting, notes)` · `formatDiscordAnnouncement(...)` · `buildMeetingTaskMetadata(...)` · `extractAgendaSummary(markdown)` · `isUserMentionedInAgenda(markdown, user)` · `extractUserSpecificPreparation(markdown, user)` · `syncMeetingPreparationTask(...)` · `deleteMeetingPreparationTask(meetingId)`.

### `lib/meetings/aiReportParser.ts`
`normalizeDateString(raw)` · `matchAssigneeToUser(name, users)` · `parseDecisionLine(line)` · `parseAiMeetingReport(markdown)` (découpe `[OBJECTIFS]`, `[SYNTHESE]`, `[DECISIONS]`).

### `lib/meetings/decisionService.ts` 🗄️
`convertDecisionToTask({ meetingId, decisionId, ... })` (crée la tâche + les `TaskAssignment`) · `updateAttendeeStatus(...)`.

### `lib/meetings/meetingEditService.ts`
`meetingEditSchema` · `formatToDateTimeLocal(date)` · `parseDateTimeLocalToIso(val)` · `computeAttendeeDiff(before, after)` · `buildCalendarEventSyncData(...)`.

### `lib/meetings/meetingPdfGenerator.ts` · `meetingBatchExport.ts`
`generateAndDownloadMeetingPdf(data)` (jsPDF + html2canvas) · `exportMeetingsZip(meetings)` (JSZip).

### `lib/csvExport.ts`
`exportTasksToCsv(tasks, filename?)` — export M2V5.

### `lib/validations/*`
Schémas Zod : `createTaskSchema`, `updateTaskSchema`, `assignTaskSchema`, `createMeetingSchema`, `updateMeetingSchema`, `createEventSchema`, `createMilestoneSchema`, `updateMilestoneSchema`, `createUserSchema`, `updateUserSchema`.

### `hooks/useTasks.ts`
État client des tâches : `fetchTasks({ scope, userId })`, mutations (create/update/delete), `refresh()`, gestion du cache local et du rafraîchissement.

---

## 12. Composants (`src/components`)

79 fichiers `.tsx`, découpés en domaines. Tous les composants de domaine sont `"use client"` sauf les pages serveur.

| Domaine | Fichiers principaux | Rôle |
|---|---|---|
| `ui/` | button, card, dialog, input, label, select (popover), tabs, badge, avatar, progress, checkbox, textarea, alert, sonner | Primitives shadcn/ui |
| `layout/` | `Header`, `Sidebar`, `navConfig`, `ProtectedShell`, `BottomNavBar`, `MobileNavDrawer`, `NotificationBell`, `TempPasswordBanner` | Coquille applicative, navigation desktop/mobile, cloche, bandeau mot de passe temporaire |
| `dashboard/` | `GeneralDashboardView`, `DashboardCharts`, `ActivityHeartbeat`, `admin-activity/*` (`AdminActivityTab`, `WeekNavigation`, `WeeklyActivityChart`, `ActivitySummaryCards`, `MemberActivityTable`) | KPI, graphiques, activité hebdo admin |
| `kanban/` | `KanbanBoard`, `KanbanColumn`, `TaskCard`, `TaskModal`, `TaskDetailModal`, `TaskDetailForm`, `TaskTableView`, `TaskTableRow`, `table/*` (`TaskTableColumns`, `TaskTableCells`, `TaskTableToolbar`, `TaskTableQuickAddRow`, `TaskTableDeleteDialog`) | Board et tableau M2V5 |
| `meetings/` | `MeetingsHeader`, `MeetingsGrid`, `MeetingCard`, `MeetingCardAgendaBox`, `MeetingQuickAgendaModal`, `MeetingModal(+Fields,+AttendeesList)`, `MeetingAgendaCard`, `MeetingAgendaAssistantDrawer`, `MeetingAiAssistantDrawer`, `MeetingAttendanceCard`, `MeetingReportEditor`, `MeetingDecisionsCard`, `DecisionAssigneeSelector` | Cycle de vie complet d'une réunion |
| `agenda/` | `AgendaHeader`, `CustomCalendarToolbar`, `EventModal`, `TaskSideDrawer`, `TaskDrawerList`, `TaskDrawerDetail`, `agendaTypes`, `agendaUtils` | Calendrier et tiroir de tâches |
| `infos/` | `InfoCard`, `InfoEditorModal`, `InfoToolbar`, `infoMarkdownRenderer`, `infoExportUtils`, `infoTypes` | Fiches documentaires |
| `links/` | `LinksClient`, `LinkCard`, `LinkModal`, `LinkToolbar`, `linkTypes`, `linkUtils` | Liens utiles |
| `settings/` | `UserManagement`, `EtienneCredentialsPanel`, `UserCredentialRow`, `UserSettings`, `AlertBannerManager` | Comptes, identifiants, mot de passe, alertes |
| `theme/` | `CustomThemeProvider`, `ThemeSettings` | Thème clair/sombre/couleurs |
| `providers.tsx` | — | `SessionProvider` + `next-themes` + thème custom |
| Pages budget | `app/(protected)/budget/components/*` (`BudgetSummaryCards`, `FundingSourcesTable`, `ExpensesTable`, `AddFundingModal`, `EditFundingModal`, `AddExpenseModal`, `EditExpenseModal`, `CommentDialog`, `types`) | Trésorerie (co-localisée avec la page) |

---

## 13. Scripts d'exploitation (`app/prisma`)

| Script | Commande | Effet |
|---|---|---|
| `seed.ts` | `npm run db:seed` | Seed idempotent : projet, 6 utilisateurs, 11 jalons, 3 prompts, liens. **N'écrase plus les mots de passe existants** (v2.16.3). |
| `seed-data.ts` | — | Données de référence (users, jalons, prompts, liens) |
| `seed-budget.ts` | `npx tsx prisma/seed-budget.ts` | Enveloppes et dépenses de démonstration |
| `seed-important-infos.ts` | `npx tsx prisma/seed-important-infos.ts` | 3 fiches MINIMOCA (organisation, calendrier, technique) |
| `seed-sources.ts` | `npx tsx prisma/seed-sources.ts` | Sources de financement (APICIL, BDE, Fablab) |
| `02_seed_realistic_minimoca_data.ts` | `npx tsx …` | Données de tâches réalistes |
| `01_repair_existing_task_assignments.ts` | `npx tsx …` | Réparation des assignations historiques |
| `reset-tasks-for-deployment.ts` | `npx tsx …` | Purge/normalisation des tâches avant déploiement |
| `update-users-and-passwords.ts` | `npx tsx …` | ⚠️ Réattribue des mots de passe aléatoires (usage ponctuel) |
| `restore-temp-passwords.ts` | `npx tsx prisma/restore-temp-passwords.ts [--dry-run] [--days=30]` | Réactive le mot de passe temporaire affiché, uniquement pour les comptes jamais personnalisés |
| `regenerate-temp-passwords.ts` | `npx tsx prisma/regenerate-temp-passwords.ts --users=liam,peter [--dry-run]` | Génère un temporaire **neuf** (avec échéance) quand l'ancien est inconnu |
| `verify-db.ts` | `npm run db:verify` | Vérifie hash bcrypt, cohérence `tempPassword`, tables, volumes |

**Après toute modification de `schema.prisma` :**

```bash
cd app
npx prisma db push      # applique le DDL sur Neon (via DIRECT_URL)
npx prisma generate     # régénère le client
```

---

## 14. Variables d'environnement

Fichier réel : `app/.env` (non versionné). Modèle : `app/.env.example`.

| Variable | Obligatoire | Usage |
|---|---|---|
| `DATABASE_URL` | ✅ | Connexion poolée (PgBouncer) utilisée par l'app (adapter HTTP Neon) |
| `DIRECT_URL` | ✅ (CLI) | Connexion directe, utilisée par `prisma db push` |
| `AUTH_SECRET` | ✅ | Signature des JWT NextAuth |
| `NEXTAUTH_SECRET` | ✅ | Alias historique (repli) |
| `AUTH_URL` / `NEXTAUTH_URL` | ⚠️ | URL de base (localhost en dev ; sur Vercel : l'URL de production) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | ⚠️ | Neon Object Storage (bucket privé `uploads`) |
| `AWS_ENDPOINT_URL_S3` / `AWS_REGION` | ⚠️ | Endpoint S3 Neon |
| `NEON_BRANCH` | ℹ️ | Indique la branche ciblée (`production`) |

À la racine, `.env.local` contient le même `DATABASE_URL` et les clés S3 (utilisé par les scripts racine et le CLI Neon). `.neon` identifie le projet/branche.

---

## 15. Tests

### A. Suite TDD interne — `app/src/__tests__/` (13 scripts `tsx`)

Scripts autonomes (pas de runner) : `npx tsx src/__tests__/<fichier>.ts`, sortie console + code retour.

| Fichier | Couvre |
|---|---|
| `02_dashboard_metrics.test.ts` | KPI globaux, avancement/workload par membre |
| `03_m2v5_table_logic.test.ts` | Statut consolidé, retard, permissions, export TSV |
| `04_budget_logic.test.ts` | Totaux, enveloppes, annulations, dates |
| `05_auth_credentials_logic.test.ts` | Génération de mots de passe, pseudo, matching, mailto |
| `06_auth_integration.test.ts` | Connexion des 6 membres contre la base réelle |
| `07_meeting_agenda_logic.test.ts` | Prompt d'ordre du jour, annonce, préparation ciblée |
| `08_task_permissions_and_scope.test.ts` | Permissions (solo/binôme/tiers/admin), étanchéité « mes tâches » |
| `09_mobile_navigation_logic.test.ts` | Items de nav, route active, filtrage par rôle |
| `10_admin_activity_metrics.test.ts` | Plages de semaines, agrégation d'activité |
| `11_collective_task_assignment_status.test.ts` | Statuts collectifs, décision de suppression |
| `12_meeting_edit_logic.test.ts` | Dates `datetime-local`, diff de participants, sync calendrier |
| `13_links_logic.test.ts` | Normalisation d'URL, favicon, tri |
| `ui-primitives.test.ts` | Rendu des primitives UI |

> `06` nécessite un accès réseau à Neon. Les autres sont purement locaux.

### B. Harnais historique — `tests/` (racine, 22 scripts `.mjs`)

Lanceur : `node tests/run-all-tests.mjs`. Organisé en « tiers » (couverture, cas limites, combinaisons, scénarios, adversarial).

⚠️ **Partiellement obsolète** : ces scripts datent d'avant la v2.12 et utilisent encore les emails `@imt.fr` et les mots de passe `password` / `password123` (`tests/00_common/config.mjs`). Ils échouent donc sur l'authentification. Ils restent utiles comme **catalogue de scénarios** (lecture) mais ne constituent pas une CI fiable. Ne pas les considérer comme une référence de vérité.

---

## 16. Contraintes techniques et pièges

Ces points ont déjà provoqué des bugs en production. Les respecter évite des régressions.

1. **Pas de transactions avec l'adaptateur HTTP Neon.** `prisma.$transaction([...])` et les `updateMany` implicites lèvent `Transactions are not supported in HTTP mode`. Remplacer par des boucles de mises à jour unitaires (`for … await prisma.x.update`). C'est déjà fait dans `meetings`, `milestones`, `notifications`, `budget`.
2. **Pas de `include:` imbriqué dans les mutations.** Un `update`/`create` avec `include` déclenche une transaction implicite → erreur 500. Faire la mutation, puis une lecture séparée.
3. **`Decimal` et `Date` ne traversent pas la frontière Server → Client.** Les sérialiser (`Number(...)`, `toISOString()`) avant de les passer à un composant client.
4. **Pages dynamiques.** Les pages qui lisent la base déclarent `export const dynamic = "force-dynamic"`. Toute nouvelle page de ce type doit faire pareil, sinon Next tente de la prérendre au build.
5. **Rafraîchissement.** Après une mutation, appeler `revalidatePath(...)` côté serveur **et** `router.refresh()` côté client pour que les métriques se mettent à jour sans F5.
6. **Le middleware ne protège pas l'API.** Ses exclusions (`api/auth`, `api/health`) et sa logique ne concernent que les pages. Chaque route API doit faire son propre contrôle.
7. **Mots de passe : deux champs à garder cohérents.** `passwordHash` fait foi ; `tempPassword` n'existe que pour l'affichage admin. Toute écriture de l'un doit mettre à jour l'autre (ou le vider). Voir §17.
8. **Seed et mots de passe.** `seed.ts` ne réécrit plus `passwordHash` sur un compte existant — ne pas réintroduire cette logique.
9. **Recherche d'utilisateur coûteuse.** `authorize()` fait un `findMany()` puis un filtrage JS (pour accepter prénom/nom/email). Acceptable à 6 utilisateurs, à revoir au-delà.
10. **Build Windows.** Le cache webpack est désactivé en dev (contournement d'erreurs `ENOENT` sous Windows).
11. **Encodage.** Les fichiers sources contiennent des accents en UTF-8 ; certains anciens fichiers (supprimés) étaient en mojibake. Écrire en UTF-8.
12. **`position` des tâches.** Champ `Int` obligatoire : calculer `max(position) + 1` à la création dans la colonne de statut visée.

---

## 17. Dette technique et points de vigilance

Constats laissés volontairement en l'état (à traiter par le prochain intervenant), classés par gravité.

| # | Sujet | Détail | Impact |
|---|---|---|---|
| 1 | **Alerte globale non restreinte** | `POST /api/alerts` vérifie seulement la session : n'importe quel membre peut diffuser une notification à toute l'équipe. L'UI est dans `/settings`, visible par tous. | Moyen |
| 2 | **`GET /api/prompts/[id]` public** | Aucune vérification de session (le module importe `auth` mais ne l'appelle pas). | Faible |
| 3 | **Jalons éditables par tous via l'API** | `POST /api/milestones` et `PATCH /api/milestones/[id]` n'exigent qu'une session ; seul le `DELETE` est ADMIN. L'UI masque l'édition aux membres. | Faible |
| 4 | **`AlertLevel` et `AlertBanner` fantômes** | L'énumération existe dans le schéma, le modèle `AlertBanner` n'a jamais été créé : les « bannières » sont en réalité des notifications éphémères. | Faible |
| 5 | **`tempPassword` en clair** | Choix assumé (permettre à l'admin de distribuer les accès), mais c'est un secret stocké en base. À vider dès que le membre personnalise son mot de passe (c'est le cas). | Moyen |
| 6 | **Tests racine obsolètes** | Emails `@imt.fr`, mots de passe par défaut : la suite `tests/` échoue. | Moyen (fausse alerte) |
| 7 | **Pas de migration versionnée** | `prisma db push` direct sur la production, sans `migrations/`. Aucun historique du DDL. | Moyen |
| 8 | **Pas de CI** | Aucun workflow GitHub Actions ; rien n'empêche de merger du code qui ne compile pas. | Moyen |
| 9 | **`authorize()` scanne tous les utilisateurs** | Voir §16.9. | Faible (6 comptes) |
| 10 | **Duplication de conventions** | Certaines routes utilisent `auth()`, d'autres `requireAuth()` / `requireAdmin()`. | Faible |
| 11 | **Fichiers volumineux dans le dépôt** | `visuels/bateau.png` et `bateau1.png` ≈ 84 Mo chacun. | Faible (poids du clone) |
| 12 | **Asset `scratch/`** | Brouillons non versionnés (dont un code de licence personnel). | Aucun |

Points **déjà** corrigés et à ne pas régresser : comptes Neon HTTP, unicité des métriques budgétaires, suppression intelligente des tâches collectives, synchronisation réunion ↔ calendrier ↔ tâche, bandeau mot de passe temporaire.

---

## 18. Carte « je veux modifier X »

| Objectif | Fichiers à ouvrir en premier |
|---|---|
| Changer la logique de connexion / les identifiants | `src/lib/auth.ts`, `src/lib/auth/credentialsLogic.ts` |
| Ajouter une page protégée | `src/app/(protected)/<nom>/page.tsx` + `src/components/layout/navConfig.ts` |
| Ajouter un endpoint | `src/app/api/<domaine>/route.ts` (+ `src/lib/validations/`) |
| Ajouter un champ à une tâche | `prisma/schema.prisma` → `db push` → `src/lib/validations/task.ts` → `components/kanban/*` |
| Changer un KPI du dashboard | `src/lib/dashboard/dashboardMetrics.ts` + `components/dashboard/GeneralDashboardView.tsx` |
| Modifier le tableau M2V5 | `src/lib/m2v5/m2v5Logic.ts` + `components/kanban/table/*` |
| Toucher aux réunions / au CR | `src/app/(protected)/meetings/*` + `src/lib/meetings/*` |
| Modifier le calcul du budget | `src/lib/budget/*` (une seule source de vérité) |
| Changer le rendu d'un mail d'invitation | `src/lib/auth/credentialsLogic.ts` |
| Ajouter une notification | `src/lib/notifications.ts` |
| Modifier le thème / les couleurs | `src/app/globals.css`, `tailwind.config.ts`, `src/components/theme/*` |
| Comprendre l'historique d'une fonctionnalité | `CHANGELOG.md` (chercher le domaine : kanban, meetings, budget…) |

---

## 19. Conventions de code

- **TypeScript strict**, alias `@/*` → `app/src/*`.
- Commentaires et libellés UI **en français** ; noms de variables/fonctions **en anglais**.
- Un composant = un fichier, nommé en `PascalCase.tsx` ; logique métier dans `src/lib`, jamais dans un composant.
- Les modules de `src/lib` sont découpés par domaine et testés par un script `__tests__/NN_domaine.test.ts`.
- Les fichiers de composants visent **moins de 200 lignes** (règle appliquée lors des refactorings v2.x) ; au-delà, extraire un sous-composant.
- Toute route API valide ses entrées avec **Zod** et renvoie des erreurs `{ error }`.
- Les chaînes affichées à l'utilisateur sont en français, avec accents.

---

## 20. Documentation et historique

| Document | Contenu |
|---|---|
| [`CHANGELOG.md`](CHANGELOG.md) | Journal exhaustif version par version (2.0 → 2.16.3). **Source de vérité fonctionnelle.** |
| [`docs/CAHIER_DES_CHARGES.md`](docs/CAHIER_DES_CHARGES.md) | Besoin initial, périmètre V2, évolutions V3 |
| [`docs/SCHEMA_BASE_DE_DONNEES.md`](docs/SCHEMA_BASE_DE_DONNEES.md) | Description détaillée des tables et relations |
| [`docs/MESSAGE_EQUIPE_ACCES.md`](docs/MESSAGE_EQUIPE_ACCES.md) | Message type pour communiquer les accès |
| [`docs/consignes/`](docs/consignes) | Supports IMT : planning, TD, Pecha Kucha, rapport MINIMOCA, MOOC |

---

### Résumé en cinq lignes

1. `app/` = Next.js 14 + Prisma + Neon, déployé sur Vercel (root = `app`).
2. `app/src/app` = pages et API ; `app/src/lib` = logique métier testable ; `app/src/components` = UI.
3. Auth = NextAuth v5 credentials, identifiant = prénom ou email, session JWT 30 jours.
4. 16 tables, 13 énumérations, un projet singleton.
5. Contrainte majeure : **adaptateur Neon HTTP → pas de transactions** ; toujours `revalidatePath` après une mutation.
