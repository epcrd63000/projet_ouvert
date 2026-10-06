# Projet Ouvert IMT — Application Web Next.js 14

Plateforme collaborative de gestion et de suivi de projet pour l'équipe IMT CI1 (Projet Ouvert 2026-2027).

## Architecture Technique

- **Framework** : [Next.js 14.2.23](https://nextjs.org/) (App Router, React Server Components)
- **Langage** : [TypeScript 5](https://www.typescriptlang.org/) (mode strict activé)
- **Style & Design System** : [Tailwind CSS 3.4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) (thème Slate, mode clair/sombre via CSS variables HSL)
- **Composants d'interface** : Primitives Radix UI (`@radix-ui/react-slot`, `@radix-ui/react-label`), Lucide React
- **Gestionnaire de base de données (M2)** : [Prisma ORM](https://www.prisma.io/) avec PostgreSQL hébergé sur Neon (pooling PgBouncer + connexion directe DDL)
- **Stockage d'objets (M2)** : Neon Object Storage (compatible S3) avec bucket `uploads` privé
- **Authentification (M3)** : [NextAuth.js v5 (Auth.js)](https://authjs.dev/) avec stratégie Split Config (Edge Runtime compatible)

## Structure des Répertoires

```text
app/
├── prisma/
│   ├── schema.prisma           # Schéma Prisma (11 modèles, 10 énumérations)
│   ├── seed-data.ts            # Données initiales (6 utilisateurs, 11 jalons Gantt)
│   ├── seed.ts                 # Script de seed idempotent avec hash bcrypt
│   └── verify-db.ts            # Script de contrôle de conformité automatisé
├── src/
│   ├── middleware.ts           # Middleware d'authentification et de protection globale des routes
│   ├── types/
│   │   └── next-auth.d.ts      # Déclaration de types étendus pour NextAuth (User, Session, JWT)
│   ├── app/
│   │   ├── (auth)/             # Groupe de routes publiques (connexion)
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx  # Interface de connexion interactive (Suspense, Alert, Quick login)
│   │   ├── (protected)/        # Groupe de routes protégées (tableau de bord)
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/page.tsx # Tableau de bord avec profil utilisateur et déconnexion
│   │   ├── api/                # Points d'entrée d'API (santé, NextAuth)
│   │   │   ├── health/route.ts
│   │   │   └── auth/[...nextauth]/route.ts # Handlers API GET/POST NextAuth v5
│   │   ├── globals.css         # Directives Tailwind et variables HSL
│   │   ├── layout.tsx          # Layout racine HTML & Providers
│   │   ├── page.tsx            # Redirection dynamique vers /dashboard ou /login
│   │   ├── loading.tsx         # Fallback de chargement global
│   │   ├── not-found.tsx       # Page 404 conviviale
│   │   └── error.tsx           # Frontière de capture des erreurs
│   ├── components/
│   │   ├── providers.tsx       # Enveloppe client NextThemesProvider
│   │   └── ui/                 # Primitives shadcn (Button, Input, Card, Label, Alert, Badge)
│   └── lib/
│       ├── prisma.ts           # Client Prisma singleton pour Server Components & API
│       ├── auth.config.ts      # Configuration NextAuth v5 Edge-safe pour middleware
│       ├── auth.ts             # Configuration NextAuth v5 complète (Credentials, Prisma, bcrypt)
│       └── utils.ts            # Helper cn() (clsx + tailwind-merge)
├── components.json             # Configuration shadcn/ui
├── next.config.mjs             # Configuration ESM Next.js
├── package.json                # Dépendances et scripts de build
├── postcss.config.mjs          # Pipeline PostCSS
├── tailwind.config.ts          # Thème et animations Tailwind
└── tsconfig.json               # Options de compilation TypeScript
```

## Commandes Principales

```bash
# Installation des dépendances
npm install

# Validation et synchronisation du schéma Prisma avec Neon
npx prisma validate
npx prisma db push

# Génération du client Prisma
npm run prisma:generate

# Peuplement de la base de données (6 utilisateurs, 11 jalons)
npm run db:seed

# Vérification de l'intégrité de la base de données
npm run db:verify

# Lancement du serveur de développement (accessible sur PC et smartphone via le Wi-Fi local)
npm run dev
# Accès mobile réseau local : http://<IP_LOCALE>:3000 (ex: http://10.112.1.118:3000)

# Compilation de production
npm run build

# Démarrage du serveur de production
npm run start

# Vérification du code (ESLint)
npm run lint

# Exécution de la suite de tests E2E (depuis la racine du dépôt)
node tests/run-all-tests.mjs
```

