# Journal des Modifications (CHANGELOG)

Toutes les modifications notables apportées à ce projet sont consignées dans ce document.

## [Non publié] - 2026-09-25

### Ajouté
- **Suite de tests E2E Opaque-Box (`tests/`)** :
  - `tests/00_common/` : Modules utilitaires partagés (`config.mjs`, `http-client.mjs`, `db-client.mjs`).
  - `tests/01_tier1_feature_coverage/` : Tests de couverture nominale (compilation `npm run build`, validation `npx prisma validate`, présence 10/11 tables BDD, 6 utilisateurs seedés, 11 jalons Gantt IMT, redirection racine `/` -> `/login`).
  - `tests/02_tier2_boundary_cases/` : Tests de cas limites et adversariaux (rejet identifiants erronés, entrées malformées et injections SQL, protection des routes privées).
  - `tests/03_tier3_combinations/` : Tests de combinaisons inter-composants (compatibilité hashs bcrypt du seed, handshake CSRF et création de cookie de session, propagation des rôles ADMIN/MEMBER).
  - `tests/04_tier4_scenarios/` : Tests de parcours réels complets (scénario complet login admin -> dashboard, cycle de vie complet de session et déconnexion).
  - `tests/run-all-tests.mjs` : Master Test Runner automatisé avec options de filtrage (`--tier=X`, `--bail`), mesure des temps et rapport d'exécution synthétique.
  - Documentation de l'infrastructure de test dans `.agents/teamwork/test_writer_e2e_1/TEST_INFRA.md`.
  - Rapport de disponibilité des tests dans `.agents/teamwork/test_writer_e2e_1/TEST_READY.md`.

### Corrigé
- **Résolution de l'incompatibilité Windows ESM dans `tests/00_common/db-client.mjs`** :
  - Remplacement de l'import dynamique direct Windows `import(path.resolve(...))` par `import(pathToFileURL(clientPath).href)` via `node:url` pour éliminer l'erreur `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
  - Suppression intégrale du patron de façade / repli statique `schema.prisma` dans `getDatabaseTables()`, garantissant une requête réelle sur `information_schema.tables` de PostgreSQL Neon.
  - Sécurisation du chargement des variables d'environnement (`DATABASE_URL`, `DIRECT_URL`) depuis `app/.env`.
  - Validation avec succès des 4 tests d'acceptation Tier 1 (`test-01-compilation.mjs`, `test-02-database-tables.mjs`, `test-03-seed-users.mjs`, `test-04-seed-milestones.mjs`) avec code de sortie 0 directement contre la base PostgreSQL Neon en direct.

## [2.1.0] - 2026-10-02

### Ajouté
- **Bibliothèque de Prompts IA dans les Réunions** : Ajout d'un menu déroulant interactif dans la vue de détail des réunions permettant d'accéder aux modèles IA (`AiPrompt`) et de les copier dans le presse-papier. Intégration d'une gestion d'erreurs UI si la base de données est injoignable.
- **Prisma Seed Automatisé** : Ajout d'une configuration `ts-node` pour le script de peuplement dans `package.json`. Introduction de 3 prompts IA pour le contexte "Voilier MINIMOCA" (Générateur de Compte Rendu, Tâches, Risques).

## [2.0.0] - 2026-10-02

### Ajouté
- **Tableau de Bord Exhaustif M2V5 (`TaskTableView.tsx`)** :
  - Support de la vue tabulaire en 10 colonnes conforme aux exigences méthodologiques IMT M2V5 (Tâche, Pilote, Échéance, Charge, Livrables, Priorité, Qui valide/Comment, % Avancement, Dernière MAJ, Retard/Cause).
  - Synchronisation bidirectionnelle automatique entre statut (`TODO`, `IN_PROGRESS`, `DONE`) et pourcentage d'avancement.
  - Détection automatique et mise en évidence visuelle des tâches en retard avec badge animé et saisie directe de la cause.
  - Filtres multi-critères temps réel (texte/pilote, statut, priorité).
  - Module d'exportation CSV (`csvExport.ts`) encodé en UTF-8 BOM avec séparateur point-virgule pour une compatibilité native Excel.
- **Hook Réutilisable `useTasks` (`useTasks.ts`)** :
  - Extraction et centralisation de la logique de requêtage, des mises à jour optimistes et de la gestion d'erreurs pour respecter la règle de découpage strict (< 200 lignes).
- **Test TDD Tier 1 (`test-09-m2v5-task-exhaustive-table.ts`)** :
  - Validation automatique de la persistance et des contraintes des champs étendus M2V5 en base Neon.

### Modifié
- **Kanban & Visibilité des Tâches** :
  - `app/src/app/api/tasks/route.ts` & `[id]/route.ts` : visibilité garantie pour les créateurs et assignés ; restriction stricte pour les membres ordinaires (auto-assignation uniquement, les admins peuvent assigner tout le monde).
  - `TaskCard.tsx` & `TaskModal.tsx` : affichage des capsules nominatives complètes au lieu d'une simple initiale, attribution du créateur et suppression autorisée pour le créateur/admin.
  - Bascule ergonomique "Kanban" / "Tableau M2V5" sur la page `/kanban`.
- **Agenda Modernisé (`agenda.module.css` & `agenda/page.tsx`)** :
  - Restauration et modernisation complète de l'agenda avec CSS scoped, tokens d'événements colorés (Réunions, Tâches, Jalons), légende visuelle et intégration des échéances personnelles des membres (et globales pour l'admin).

## [2026-09-27] - Refonte UI/UX et Fix API
### Corrigé
- **API Tasks (Neon HTTP)** : Résolution de l'erreur 500 "Transactions are not supported in HTTP mode" en remplaçant l'écriture imbriquée Prisma par un create suivi d'un createMany pour les assignations.
### Modifié
- **UI/UX Global** : 
  - Refonte complète de la page Gantt avec une vraie grille (Flex/CSS) et timeline.
  - Correction des tooltips Recharts en mode sombre sur le Dashboard.
  - Alerte de dépassement de budget en rouge sur la jauge du Dashboard.
  - Formatage français complet (date-fns) et ajout de Badges colorés sur la page Réunions.

## [2.0.0] - 2026-10-02
### Added
- Mise à jour majeure du Cahier des Charges (V2).
- Ajout des spécifications pour l'export PDF des comptes rendus.
- Ajout des spécifications pour la Bibliothèque de Prompts IA (templates Markdown).
- Ajout des spécifications pour le système de Bannières d'Alerte globales.
- Ajout des spécifications pour le Tableau de Suivi opérationnel (Vue perso/globale avec champs détaillés).
- Ajout des catégories/tags pour le profilage des tâches.
