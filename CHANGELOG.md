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
