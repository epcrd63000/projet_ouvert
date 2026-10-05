# Journal des Modifications (CHANGELOG)

## [2.5.0] - 2026-10-05

### Ajouté
- **Refonte & Fiabilisation des Comptes Rendus de Réunion** :
  - **Assistant IA & Modèle de Prompt Officiel** : Intégration d'un prompt officiel ultra-complet seedé en base (`Générateur de Compte Rendu de Réunion (Modèle Officiel)`), respectant le format standard MINIMOCA avec les balises de parsing `[OBJECTIFS]`, `[SYNTHESE]`, `[DECISIONS]`.
  - **Éditeur Markdown TipTap Enrichi** : Ajout des fonctionnalités avancées (tableaux `@tiptap/extension-table`, blocs de code, citations, liens hypertexte, listes de tâches to-do, surlignage de texte, undo/redo). Suppression du bouton d'export PDF redondant pour centraliser sur l'export officiel.
  - **Générateur PDF Multi-Pages Découpé** : Correction de la troncature sur les comptes rendus longs par découpage dynamique de tranches canvas adaptées au format A4 (`generateAndDownloadMeetingPdf`).
  - **Gestion Sécurisée de la Suppression** : Ajout du bouton de suppression de réunion dans l'interface (réservé aux administrateurs et au créateur de la réunion) avec confirmation préalable.
  - **Persistance Non-Destructive des Présences** : Correction du bug d'écrasement des statuts d'émargement (`EXCUSED` / `ABSENT`) lors de la modification des participants d'une réunion.
  - **Saisie des Objectifs dès la Création** : Ajout du champ d'objectifs dans le modal de création `MeetingModal`.
  - **Nettoyage & Alertes d'Export ZIP** : Suppression des statuts inexistants de l'UI et notification toast si des réunions sans compte rendu sont ignorées lors d'un export groupé.
  - **Édition Inline Directe des Décisions** : Possibilité de modifier en place (libellé, pilote, date limite) chaque décision via un bouton crayon dédié, avec synchronisation miroir immédiate sur la tâche Kanban liée si elle a déjà été créée.
  - **Conversion en Lot en Tâches Kanban** : Ajout du bouton *"Tout convertir en tâches"* dans l'en-tête du relevé de décisions pour convertir en une seule action toutes les décisions en attente.
  - **Auto-Sauvegarde Transparente avant Export PDF** : Le bouton *"Export PDF Officiel"* persiste désormais silencieusement en base de données les dernières frappes de l'éditeur et des objectifs avant de générer le document PDF multi-pages.
  - **Compatibilité Neon HTTP Intégrale (Zéro Transaction Interactive)** : Résolution définitive de l'erreur `Transactions are not supported in HTTP mode` sur toutes les routes API de réunions (`PATCH /api/meetings/[id]`, `POST /api/meetings`, `attendance`, `decisions`). Séparation stricte des opérations d'écriture et de lecture pour un fonctionnement 100% stable en environnement sans port 5432.
  - **Émargement Réactif Optimiste (0ms)** : Basculement instantané des statuts *Présent*, *Excusé*, *Absent* dans l'interface sans latence perçue, avec synchronisation en arrière-plan et rollback automatique en cas d'erreur réseau.
  - **Injection IA & Éditeur TipTap Découplés** : Intégration d'une clé de synchronisation réactive (`externalContentKey`) garantissant l'actualisation instantanée du compte rendu et des objectifs dès la validation de la réponse IA, sans perturber le curseur lors de la frappe manuelle.
  - **Validation E2E sur Cas Réel (Test 1.13)** : Suite de tests automatisée validant l'intégration complète de bout en bout du format produit par l'IA (5 décisions, dates limites au format FR/ISO, assignations et conversion Kanban).

## [2.4.0] - 2026-10-05

### Ajouté
- **Tableau de Bord Actualisé & Personnalisé (Voilier MINIMOCA)** :
  - **Salutation Contextualisée & Badges Personnels** : Affichage d'un en-tête dynamique `Bonjour [Membre] 👋` accompagné de badges en temps réel indiquant ses tâches assignées, en cours, terminées et en retard.
  - **Graphique Avancement par Membre Enrichi** : Double barre Recharts visualisant pour chaque équipier à la fois le nombre de tâches terminées et le total assigné, avec infobulle calculant le pourcentage d'achèvement individuel.
  - **Données Opérationnelles MINIMOCA Réelles** : Script de seed dédié (`prisma/02_seed_realistic_minimoca_data.ts`) alimentant 15 tâches réelles réparties équitablement entre les 6 membres (Etienne, Liam, Hugo, Milane, Solal, Peter), une réunion imminente avec compte à rebours, et une charge de travail active sur le radar Workload.
  - **Module de Calcul Dédié (TDD)** : Extraction de la logique métier dans `src/lib/dashboard/dashboardMetrics.ts` couverte par des tests unitaires automatisés (`src/__tests__/02_dashboard_metrics.test.ts`).

## [2.3.0] - 2026-10-03

### Ajouté
- **Mécanisme Complet de Compte Rendu de Réunion** :
  - **Émargement Individuel** : Statuts de présence personnalisés (*Présent*, *Excusé*, *Absent*) persistés sur le modèle MeetingAttendee avec récapitulatif visuel instantané.
  - **Relevé de Décisions & Plan d'Action** : Module interactif de suivi des décisions avec responsable et date limite. Conversion unitaire en un clic vers une tâche Kanban avec liaison bidirectionnelle et badge de statut temps réel (*À faire*, *En cours*, *Terminée*).
  - **Assistant IA Sans Clé API** : Panneau d'assistance permettant de compiler les notes brutes avec un modèle de prompt modifiable sur le site, copiable pour ChatGPT/Gemini, couplé à un parseur intelligent réimportant et ventilant automatiquement les objectifs, la synthèse et les décisions.
  - **Édition Directe des Prompts sur le Site** : Possibilité de modifier et créer des prompts IA depuis l'interface /ai-prompts et d'enregistrer le prompt de réunion par défaut en base de données.
  - **Moteur d'Export PDF Officiel IMT / MINIMOCA** : Rendu PDF professionnel complet avec cartouche officiel, feuille d'émargement, objectifs, synthèse Markdown et tableau formel du plan d'action.
  - **Tests Unitaires TDD** : Couverture complète du parseur IA (	est-10-meeting-ai-parser.ts) et du cycle de vie conversion décision-tâche (	est-11-decision-task-conversion.ts).



## [2.2.0] - 2026-10-02

### Ajouté
- **Éditeur de Compte Rendu (TipTap)** : Intégration d'un éditeur WYSIWYG robuste pour les réunions, avec export PDF (html2canvas, jsPDF) et sauvegarde native en Markdown.
- **Export PDF en Lot (Batch Export)** : Possibilité de sélectionner plusieurs réunions depuis la liste et de les exporter dans une archive ZIP générée côté client (JSZip).
- **Indicateurs de Suivi** : Ajout d'un statut visuel (Rouge/Vert) pour identifier rapidement les comptes rendus téléchargés ou non téléchargés.
- **Prompt IA Intégré** : Le prompt de structuration de la réunion est désormais accessible et copiable directement en un clic depuis la page de la réunion pour fluidifier l'utilisation de l'IA (ChatGPT/Claude).
- **Mise à jour BDD** : Ajout des champs eportContent et isReportDownloaded sur le modèle \Meeting\ de Prisma.

Toutes les modifications notables apportÃ©es Ã  ce projet sont consignÃ©es dans ce document.

## [Non publiÃ©] - 2026-09-25

### AjoutÃ©
- **Suite de tests E2E Opaque-Box (`tests/`)** :
  - `tests/00_common/` : Modules utilitaires partagÃ©s (`config.mjs`, `http-client.mjs`, `db-client.mjs`).
  - `tests/01_tier1_feature_coverage/` : Tests de couverture nominale (compilation `npm run build`, validation `npx prisma validate`, prÃ©sence 10/11 tables BDD, 6 utilisateurs seedÃ©s, 11 jalons Gantt IMT, redirection racine `/` -> `/login`).
  - `tests/02_tier2_boundary_cases/` : Tests de cas limites et adversariaux (rejet identifiants erronÃ©s, entrÃ©es malformÃ©es et injections SQL, protection des routes privÃ©es).
  - `tests/03_tier3_combinations/` : Tests de combinaisons inter-composants (compatibilitÃ© hashs bcrypt du seed, handshake CSRF et crÃ©ation de cookie de session, propagation des rÃ´les ADMIN/MEMBER).
  - `tests/04_tier4_scenarios/` : Tests de parcours rÃ©els complets (scÃ©nario complet login admin -> dashboard, cycle de vie complet de session et dÃ©connexion).
  - `tests/run-all-tests.mjs` : Master Test Runner automatisÃ© avec options de filtrage (`--tier=X`, `--bail`), mesure des temps et rapport d'exÃ©cution synthÃ©tique.
  - Documentation de l'infrastructure de test dans `.agents/teamwork/test_writer_e2e_1/TEST_INFRA.md`.
  - Rapport de disponibilitÃ© des tests dans `.agents/teamwork/test_writer_e2e_1/TEST_READY.md`.

### CorrigÃ©
- **RÃ©solution de l'incompatibilitÃ© Windows ESM dans `tests/00_common/db-client.mjs`** :
  - Remplacement de l'import dynamique direct Windows `import(path.resolve(...))` par `import(pathToFileURL(clientPath).href)` via `node:url` pour Ã©liminer l'erreur `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
  - Suppression intÃ©grale du patron de faÃ§ade / repli statique `schema.prisma` dans `getDatabaseTables()`, garantissant une requÃªte rÃ©elle sur `information_schema.tables` de PostgreSQL Neon.
  - SÃ©curisation du chargement des variables d'environnement (`DATABASE_URL`, `DIRECT_URL`) depuis `app/.env`.
  - Validation avec succÃ¨s des 4 tests d'acceptation Tier 1 (`test-01-compilation.mjs`, `test-02-database-tables.mjs`, `test-03-seed-users.mjs`, `test-04-seed-milestones.mjs`) avec code de sortie 0 directement contre la base PostgreSQL Neon en direct.

## [2.1.0] - 2026-10-02

### AjoutÃ©
- **BibliothÃ¨que de Prompts IA dans les RÃ©unions** : Ajout d'un menu dÃ©roulant interactif dans la vue de dÃ©tail des rÃ©unions permettant d'accÃ©der aux modÃ¨les IA (`AiPrompt`) et de les copier dans le presse-papier. IntÃ©gration d'une gestion d'erreurs UI si la base de donnÃ©es est injoignable.
- **Prisma Seed AutomatisÃ©** : Ajout d'une configuration `ts-node` pour le script de peuplement dans `package.json`. Introduction de 3 prompts IA pour le contexte "Voilier MINIMOCA" (GÃ©nÃ©rateur de Compte Rendu, TÃ¢ches, Risques).

## [2.0.0] - 2026-10-02

### AjoutÃ©
- **Tableau de Bord Exhaustif M2V5 (`TaskTableView.tsx`)** :
  - Support de la vue tabulaire en 10 colonnes conforme aux exigences mÃ©thodologiques IMT M2V5 (TÃ¢che, Pilote, Ã‰chÃ©ance, Charge, Livrables, PrioritÃ©, Qui valide/Comment, % Avancement, DerniÃ¨re MAJ, Retard/Cause).
  - Synchronisation bidirectionnelle automatique entre statut (`TODO`, `IN_PROGRESS`, `DONE`) et pourcentage d'avancement.
  - DÃ©tection automatique et mise en Ã©vidence visuelle des tÃ¢ches en retard avec badge animÃ© et saisie directe de la cause.
  - Filtres multi-critÃ¨res temps rÃ©el (texte/pilote, statut, prioritÃ©).
  - Module d'exportation CSV (`csvExport.ts`) encodÃ© en UTF-8 BOM avec sÃ©parateur point-virgule pour une compatibilitÃ© native Excel.
- **Hook RÃ©utilisable `useTasks` (`useTasks.ts`)** :
  - Extraction et centralisation de la logique de requÃªtage, des mises Ã  jour optimistes et de la gestion d'erreurs pour respecter la rÃ¨gle de dÃ©coupage strict (< 200 lignes).
- **Test TDD Tier 1 (`test-09-m2v5-task-exhaustive-table.ts`)** :
  - Validation automatique de la persistance et des contraintes des champs Ã©tendus M2V5 en base Neon.

### ModifiÃ©
- **Kanban & VisibilitÃ© des TÃ¢ches** :
  - `app/src/app/api/tasks/route.ts` & `[id]/route.ts` : visibilitÃ© garantie pour les crÃ©ateurs et assignÃ©s ; restriction stricte pour les membres ordinaires (auto-assignation uniquement, les admins peuvent assigner tout le monde).
  - `TaskCard.tsx` & `TaskModal.tsx` : affichage des capsules nominatives complÃ¨tes au lieu d'une simple initiale, attribution du crÃ©ateur et suppression autorisÃ©e pour le crÃ©ateur/admin.
  - Bascule ergonomique "Kanban" / "Tableau M2V5" sur la page `/kanban`.
- **Agenda ModernisÃ© (`agenda.module.css` & `agenda/page.tsx`)** :
  - Restauration et modernisation complÃ¨te de l'agenda avec CSS scoped, tokens d'Ã©vÃ©nements colorÃ©s (RÃ©unions, TÃ¢ches, Jalons), lÃ©gende visuelle et intÃ©gration des Ã©chÃ©ances personnelles des membres (et globales pour l'admin).

## [2026-09-27] - Refonte UI/UX et Fix API
### CorrigÃ©
- **API Tasks (Neon HTTP)** : RÃ©solution de l'erreur 500 "Transactions are not supported in HTTP mode" en remplaÃ§ant l'Ã©criture imbriquÃ©e Prisma par un create suivi d'un createMany pour les assignations.
### ModifiÃ©
- **UI/UX Global** : 
  - Refonte complÃ¨te de la page Gantt avec une vraie grille (Flex/CSS) et timeline.
  - Correction des tooltips Recharts en mode sombre sur le Dashboard.
  - Alerte de dÃ©passement de budget en rouge sur la jauge du Dashboard.
  - Formatage franÃ§ais complet (date-fns) et ajout de Badges colorÃ©s sur la page RÃ©unions.

## [2.0.0] - 2026-10-02
### Added
- Mise Ã  jour majeure du Cahier des Charges (V2).
- Ajout des spÃ©cifications pour l'export PDF des comptes rendus.
- Ajout des spÃ©cifications pour la BibliothÃ¨que de Prompts IA (templates Markdown).
- Ajout des spÃ©cifications pour le systÃ¨me de BanniÃ¨res d'Alerte globales.
- Ajout des spÃ©cifications pour le Tableau de Suivi opÃ©rationnel (Vue perso/globale avec champs dÃ©taillÃ©s).
- Ajout des catÃ©gories/tags pour le profilage des tÃ¢ches.
