# Changelog

## [2.12.0] - 2026-10-06

### Ajouté
- **Onglet Exclusif Administrateur : Activité Hebdomadaire par Membre (`/dashboard`)** :
  - **Système d'Onglets Radix UI (`Tabs.tsx`)** : Intégration sur le tableau de bord avec séparation entre la « Vue Générale » (accessible à tous) et l'onglet « Activité Équipe (Admin) » (restreint strictement au rôle ADMIN).
  - **Graphique en Barres Ordonné (`WeeklyActivityChart.tsx`)** : Histogramme Recharts classant les étudiants du plus actif à gauche au moins actif à droite, avec distinction entre visites actives (bleu) et actions concrètes (vert).
  - **Navigation Temporelle Inter-Semaines (`WeekNavigation.tsx`)** : Sélecteur semaine précédente, semaine suivante et raccourci « Cette semaine » avec libellé des dates de la période (lundi au dimanche).
  - **Cartes KPI d'Équipe (`ActivitySummaryCards.tsx`)** : Indicateurs de synthèse du top contributeur, total d'interactions, moyenne par membre et alerte visuelle pour les membres inactifs.
  - **Tableau Détaillé d'Audit (`MemberActivityTable.tsx`)** : Tableau récapitulatif avec podium (🥇, 🥈, 🥉), avatar, statut d'activité (Actif / Modéré / Inactif), décompte précis des visites/actions et date de dernière activité.
  - **Modèle de Persistance Prisma & Neon (`UserActivityLog`)** : Table PostgreSQL pour consigner les visites actives de session et actions en temps réel.
  - **Collecteur Discret de Visite Quotidienne (`ActivityHeartbeat.tsx` & `/api/activity/heartbeat`)** : Enregistrement d'une visite active par jour et par utilisateur connecté avec mise en cache locale de session.
  - **Suite de Tests Unitaires TDD (`10_admin_activity_metrics.test.ts`)** : 100% de couverture sur le calcul de plages de semaines, l'ordonnancement décroissant et les indicateurs d'équipe.

### Ajouté & Amélioré
- **Accessibilité & Navigation Mobile Intégrale (Smartphone & Réseau Local)** :
  - **Menu Burger & Volet Coulissant Mobile (`MobileNavDrawer.tsx`)** : Tiroir latéral tactile avec fond flouté, navigation complète adaptée au rôle utilisateur (ADMIN / MEMBER), informations de profil et déconnexion.
  - **Barre de Navigation Inférieure Permanente (`BottomNavBar.tsx`)** : Accès rapide en 1 toucher aux rubriques essentielles (Accueil, Tâches, Agenda, Réunions) et raccourci vers le menu étendu.
  - **En-tête & Shell Adaptatifs (`Header.tsx`, `ProtectedShell.tsx`)** : Bouton d'ouverture burger, paddings optimisés pour écrans étroits (`p-3.5 sm:p-5 md:p-6`) et marge inférieure (`pb-20 md:pb-6`) empêchant le masquage de contenu.
  - **Support Tactile Kanban (`KanbanBoard.tsx`)** : Détection séparée de la souris (`MouseSensor`) et du toucher (`TouchSensor` avec délai de maintien de 250ms), assurant un défilement vertical fluide sur smartphone sans conflit de glisser-déposer.
  - **Écoute Réseau Multi-Interfaces (0.0.0.0)** : Script `"dev": "next dev -H 0.0.0.0"` permettant la connexion directe depuis un smartphone sur le même réseau Wi-Fi.
  - **Viewport Mobile (`layout.tsx`)** : Prise en charge des zones de sécurité (`viewportFit: "cover"`).
  - **Tests Unitaires TDD (`09_mobile_navigation_logic.test.ts`)** : Suite validant la configuration centralisée des routes et les permissions de navigation.
  - **Correction Lint Build Vercel (`Header.tsx`)** : Suppression de la directive de règle ESLint non reconnue et épuration des arguments non destructurés.

## [2.10.2] - 2026-10-05

### Corrigé & Amélioré
- **Allègement du Mail d'Invitation & Compatibilité Webmail (Zimbra / Erreur 431)** :
  - Intégration du nouveau gabarit d'invitation épuré et naturel rédigé par Étienne.
  - Ajout d'une mention discrète signalant que le premier message a pu atterrir dans les courriers indésirables / spams.
  - Élimination des séparateurs Unicode lourds réduisant la taille de l'URL mailto de plus de 70%, évitant le débordement de taille d'en-tête (HTTP 431 / Request Header Fields Too Large).
  - Ajout de la copie automatique du texte personnalisé dans le presse-papier lors du clic sur le bouton « Envoyer par mail » (`UserCredentialRow.tsx`).

## [2.10.1] - 2026-10-05

### Corrigé
- **Résolution de l'incompatibilité des transactions Prisma sur l'adaptateur HTTP Neon** :
  - **Erreur 500 (« Erreur serveur »)** : Survenue lors de la mise à jour d'une valeur dans les tableaux de budget (Financements et Dépenses) sur l'environnement de production Vercel.
  - **Découplage `update`/`create` et `findUnique`** : Suppression de l'option `include:` imbriquée dans les mutations Prisma (`prisma.*.update` et `prisma.*.create`) qui déclenchait une transaction interactive implicite non supportée par `@prisma/adapter-neon` en mode HTTP.
  - **Routes corrigées** :
    - `api/budget/funding/[id]` (PATCH & DELETE)
    - `api/budget/funding` (POST)
    - `api/budget/[id]` (PATCH & DELETE)
    - `api/budget` (POST)
    - `api/tasks/[id]` (PATCH)
  - **Validation Zod des dates tolérante** : Accepte les chaînes ISO et dates HTML standard sans rejet 400.

## [2.10.0] - 2026-10-05

### Ajouté
- **Refonte Complète de l'Onglet « Infos Importantes » & Documentation MINIMOCA Uniforme** :
  - **Moteur de Documentation Markdown Enrichi** : Rendu temps réel complet (`infoMarkdownRenderer.tsx`), export instantané de chaque fiche en fichier Markdown (`.md`) autonome avec frontmatter structuré (`infoExportUtils.ts`), et import direct par fichier `.md` avec parsing automatique des métadonnées.
  - **Modèle de Données PostgreSQL Neon Enrichi (`ImportantInfo`)** : `category` (ORGANISATION, CALENDRIER, TECHNIQUE, GENERAL), `eventDate`, `interlocutors`, `isPinned`, `order`.
  - **Collaboration Équipe Complète** : Création, modification et importation ouvertes à chaque membre de l'équipe avec réactivité immédiate et notifications toast.
  - **Initialisation des 3 Fiches Documentaires Consolidées MINIMOCA** : 1. Organisation, Équipe & Réseau de Contacts ; 2. Calendrier Général, Jalons Critiques & Échéances 2026-2027 ; 3. Dossier Technique MINIMOCA, Fabrication FabLab & Retours d'Expérience.
  - **Découpage Modulaire & TDD** : Composants tous `< 200 lignes`, suite de tests Tier 1 validée.

## [2.9.0] - 2026-10-05

### Ajouté
- **Édition Complète des Lignes du Budget (« Ressources & Financements » et « Dépenses »)** :
  - **Modale d'Édition des Financements (`EditFundingModal.tsx`)** : Modification directe de tous les champs d'une entrée de ressource/sponsor (Source/Partenaire, Montant alloué, Date, Statut, Commentaire & Conditions).
  - **Bouton d'Action Modifier (`Pencil`)** : Intégré dans la colonne Actions du tableau des financements (`FundingSourcesTable.tsx`).
  - **Modale d'Édition des Dépenses (`EditExpenseModal.tsx`)** : Modification complète des achats (Libellé, Quantité, Prix unitaire, Port, Recalcul automatique, Enveloppe, Statut, Commentaire).
  - **Bouton d'Action Modifier (`Pencil`)** : Intégré dans la colonne Actions du tableau des dépenses (`ExpensesTable.tsx`).
  - **Logique Métier & Calculs (`src/lib/budget/budgetLogic.ts`)** : Fonctions pures de calcul de total, validation Zod tolérante pour les formats de dates, normalisation et formatage.
  - **Tests Unitaires TDD (`src/__tests__/04_budget_logic.test.ts`)** : Couverture complète des règles de calcul et de validation.

## [2.7.0] - 2026-10-05

### Ajouté
- **Refonte Interactive du Tableau Opérationnel M2V5 (`TaskTableView.tsx`)** :
  - **Expérience Tableur 100% Inline** : Saisie et modification directes en place pour chaque cellule (Titre, Échéance, Charge, Livrables, Priorité, Critères de validation, Cause de retard) avec sauvegarde automatique en arrière-plan (`auto-save` sur `onBlur`/`onChange`) sans obliger à ouvrir une modale.
  - **Couplage Bidirectionnel Intelligent (% Avancement & Statut)** : Développé selon la démarche TDD (`m2v5Logic.ts`), synchronisation automatique (100% force `DONE`, 1-99% force `IN_PROGRESS`, 0% force `TODO`, et passer le statut à `DONE` force 100%).
  - **Ligne d'Insertion Rapide Inline** : Nouveau composant `TaskTableQuickAddRow.tsx` en bas de grille pour créer une tâche instantanément sans quitter le tableau, avec préservation de la modale complète.
  - **Transparence et Droits d'Accès Projet** : Toggle *"Vue globale / Mes tâches"* désormais accessible à tous les membres de l'équipe (non restreint aux admins), avec modification en écriture restreinte aux assignés, créateur et administrateurs.
  - **Barre d'Outils & Filtres Enrichis (`TaskTableToolbar.tsx`)** : Recherche plein texte, filtres déroulants Statut/Priorité/Pilote, filtre d'alerte immédiat *"En retard uniquement"* avec badge de décompte visuel, et tri interactif par en-tête de colonne.
  - **Double Export & Suppression Sécurisée** : Export CSV encodé UTF-8 BOM pour Excel français, bouton *"Copier"* au format TSV pour collage direct dans Excel/Teams/Word, et popover de confirmation de suppression (`TaskTableDeleteDialog.tsx`).
  - **Architecture Modulaire (< 200 lignes)** : Découpage strict en composants spécialisés (`TaskTableView`, `TaskTableToolbar`, `TaskTableColumns`, `TaskTableCells`, `TaskTableQuickAddRow`, `TaskTableDeleteDialog`, `m2v5Logic`).
  - **Tests Unitaires TDD** : Suite `src/__tests__/03_m2v5_table_logic.test.ts` validant à 100% les règles de gestion et d'automatisation.

## [2.6.0] - 2026-10-05

### Ajouté
- **Volet Latéral des Tâches (Task Drawer) & Refonte Graphique de l'Agenda** :
  - **Volet Latéral Coulissant Découplé (`TaskSideDrawer.tsx`)** : Intégration d'un tiroir latéral fluide sur la droite, s'ouvrant au clic sur n'importe quel événement tâche du calendrier ou via le nouveau bouton *"📋 Volet des tâches"* dans l'en-tête de l'Agenda.
  - **Double Vue & Navigation Intégrée** :
    - *Vue Liste (`TaskDrawerList.tsx`)* : Onglets de filtrage *"Mes tâches"* et *"Toutes les tâches (Équipe)"*, recherche textuelle instantanée par titre ou par nom de membre assigné, badges visuels et indicateur d'échéance.
    - *Vue Fiche Détaillée (`TaskDrawerDetail.tsx`)* : Fiche complète de la tâche sélectionnée avec bouton de retour rapide `← Retour à la liste`, affichage des critères méthodologiques IMT (charge estimée, livrables attendus, qui valide / comment, cause du retard).
  - **Action Rapide de Changement de Statut** : Modification en 1 clic du statut (*À faire*, *En cours*, *Terminé*) directement dans le panneau avec synchronisation optimiste 0ms et persistance API (`PATCH /api/tasks/[id]`).
  - **Harmonisation des Couleurs & Légende Dédiée** :
    - *Calendrier* : Tâches personnelles en ambré chaleureux (`hsl(var(--agenda-task-mine))`), tâches d'équipe en indigo doux (`hsl(var(--agenda-task-team))`), contour rouge vif pulsé pour les tâches en retard.
    - *Panneau* : Badges normalisés pour la priorité (Basse, Normale, Haute, Critique) et pastilles d'état.
    - *Légende* : Intégration de la distinction explicite "Mes tâches" vs "Tâches équipe" dans l'en-tête de l'Agenda (`AgendaHeader.tsx`).
  - **Architecture & Règles Respectées** :
    - Découpage strict en composants légers (`AgendaHeader`, `TaskSideDrawer`, `TaskDrawerList`, `TaskDrawerDetail`, `agendaUtils`, `agendaTypes`), tous `< 200 lignes`.
    - Suite de tests TDD Tier 1 (`tests/01_tier1_feature_coverage/test-14-agenda-task-drawer.ts`) validant les métadonnées et la compatibilité Neon HTTP.

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
  - **Salutation Contextualisée & Badges Personnels** : Affichage d'un en-tête dynamique Bonjour [Membre] avec badges en direct pour ses tâches assignées, en cours, terminées et en retard.
  - **Graphique Avancement par Membre Enrichi** : Double barre Recharts visualisant le nombre de tâches terminées et le total assigné avec infobulle du taux d'achèvement.
  - **Données Opérationnelles MINIMOCA Réelles** : Script de seed dédié (prisma/02_seed_realistic_minimoca_data.ts) alimentant 15 tâches réelles réparties équitablement entre les 6 membres, une réunion imminente, et un radar Workload actif.
  - **Module de Calcul Dédié (TDD)** : Extraction de la logique métier dans src/lib/dashboard/dashboardMetrics.ts validée par des tests unitaires (src/__tests__/02_dashboard_metrics.test.ts).


## [2.2.0] - 2026-10-02

### Ajouté
- **Éditeur de Compte Rendu (TipTap)** : Intégration d'un éditeur WYSIWYG robuste pour les réunions, avec export PDF (html2canvas, jsPDF) et sauvegarde native en Markdown.
- **Export PDF en Lot (Batch Export)** : Possibilité de sélectionner plusieurs réunions depuis la liste et de les exporter dans une archive ZIP générée côté client (JSZip).
- **Indicateurs de Suivi** : Ajout d'un statut visuel (Rouge/Vert) pour identifier rapidement les comptes rendus téléchargés ou non téléchargés.
- **Prompt IA Intégré** : Le prompt de structuration de la réunion est désormais accessible et copiable directement en un clic depuis la page de la réunion pour fluidifier l'utilisation de l'IA (ChatGPT/Claude).
- **Mise à jour BDD** : Ajout des champs eportContent et isReportDownloaded sur le modèle \Meeting\ de Prisma.

## [1.3.0] â€” 2026-10-02

### âœ¨ NouveautÃ©s & ModÃ¨les IA
- **BibliothÃ¨que de Prompts IA dans les RÃ©unions** : Ajout d'un menu dÃ©roulant interactif dans la vue de dÃ©tail des rÃ©unions permettant d'accÃ©der aux modÃ¨les IA (`AiPrompt`) et de les copier dans le presse-papier en un clic. Gestion robuste des erreurs rÃ©seau (silencieuses remplacÃ©es par une alerte UI explicite).
- **Prisma Seed AutomatisÃ©** : Ajout d'une configuration formelle `ts-node` pour le script de peuplement dans `package.json`. Introduction de 3 prompts IA de haute qualitÃ© (GÃ©nÃ©rateur de Compte Rendu, GÃ©nÃ©rateur de TÃ¢ches, Analyse des Risques Techniques) conÃ§us pour le contexte de l'ingÃ©nierie du projet "Voilier MINIMOCA".


### ðŸ“Œ Module Kanban & TÃ¢ches
- **VisibilitÃ© des tÃ¢ches personnelles** : Extension du filtre `GET /api/tasks` pour rÃ©cupÃ©rer les tÃ¢ches assignÃ©es Ã  l'utilisateur ET celles crÃ©Ã©es par lui (`where.OR = [{ assignments: ... }, { createdById: ... }]`), garantissant l'apparition immÃ©diate des tÃ¢ches dans le Kanban personnel ("Mes tÃ¢ches").
- **Assignation par dÃ©faut** : Assignation automatique au crÃ©ateur dans l'API `POST /api/tasks` et dans `TaskModal` si aucun membre n'est sÃ©lectionnÃ© manuellement.
- **Affichage des noms d'utilisateurs sur les cartes Kanban** : Remplacement des badges Ã  lettre unique par des pilules lisibles affichant l'initiale et le nom complet de chaque membre assignÃ©, ainsi que la mention "CrÃ©Ã© par [Nom]" pour les tÃ¢ches sans assignÃ©.
- **Action de suppression rapide** : Ajout d'un bouton de suppression avec confirmation sur les cartes de tÃ¢ches (autorisÃ© pour les administrateurs, les crÃ©ateurs et les assignÃ©s).
- **RÃ©conciliation des donnÃ©es existantes** : ExÃ©cution du script `01_repair_existing_task_assignments.ts` pour associer les tÃ¢ches historiques orphelines Ã  leur crÃ©ateur.

## [1.2.1] â€” 2026-10-02

### ðŸ” Authentification & Connexion
- **Correction du processus serveur** : RÃ©solution du conflit de port 3000 monopolisÃ© par un processus Node orphelin sans variables d'environnement (.env), entraÃ®nant des rejets systÃ©matiques (`CredentialsSignin`).
- **Fiabilisation de la redirection client** : Remplacement de `router.push()` par une navigation standardisÃ©e `window.location.href` dans `LoginPage` pour garantir la transmission immÃ©diate du cookie de session `authjs.session-token` au serveur et supprimer les effets de cache de l'App Router.
- **Robustesse Zod** : Nettoyage et normalisation automatique des espaces et de la casse (`trim()`, `toLowerCase()`) sur l'email dans `loginSchema`.
- **Gestion des erreurs URL** : Prise en charge des paramÃ¨tres d'erreur d'authentification (`?error=...`) dans l'interface de connexion.

## [1.2.0] â€” 2026-10-01

### ðŸ‘¥ Module Utilisateurs & ParamÃ¨tres
- **`POST /api/users`** : CrÃ©ation d'utilisateurs par les administrateurs avec hachage bcrypt (10 rounds) et validation Zod.
- **`GET /api/users/[id]`** : Consultation dÃ©taillÃ©e d'un profil.
- **`PATCH /api/users/[id]`** : Modification de profil (nom, mot de passe, avatar, heures de rappel) et changement de rÃ´le rÃ©servÃ© aux administrateurs avec interdiction de rÃ©trograder le dernier administrateur.
- **`DELETE /api/users/[id]`** : Suppression d'utilisateur avec protection absolue du dernier administrateur et cascades Prisma (les tÃ¢ches/rÃ©unions crÃ©Ã©es sont conservÃ©es en statut orphelin).
- **Interface `/settings`** : Ajout du composant interactif `UserManagement` permettant aux administrateurs de crÃ©er des comptes, modifier les rÃ´les et supprimer des membres directement.

### ðŸ“Š Module Gantt & Jalons
- **`POST /api/milestones`** : CrÃ©ation de jalons ouverte Ã  tous les membres, avec crÃ©ation automatique synchronisÃ©e d'un Ã©vÃ©nement de type `MILESTONE` dans le calendrier.
- **`GET /api/milestones/[id]`** : Consultation d'un jalon spÃ©cifique.
- **`PATCH /api/milestones/[id]`** : Modification des jalons et mise Ã  jour synchronisÃ©e des dates/couleurs sur l'Ã©vÃ©nement calendrier liÃ©.
- **`DELETE /api/milestones/[id]`** : Suppression rÃ©servÃ©e aux administrateurs avec suppression automatique de l'Ã©vÃ©nement calendrier synchronisÃ©.
- **Interface `/gantt`** : Ajout de la modale de crÃ©ation de jalons, du sÃ©lecteur de statut et du bouton de suppression rÃ©servÃ© aux administrateurs.

### ðŸ“… Module Calendrier & Ã‰vÃ©nements
- **`GET /api/events`** : IntÃ©gration des Ã©vÃ©nements de type `MILESTONE` aux cÃ´tÃ©s des rÃ©unions, tÃ¢ches et Ã©vÃ©nements manuels.
- **`GET/PATCH/DELETE /api/events/[id]`** : Gestion unitaire des Ã©vÃ©nements avec protection stricte (seuls les Ã©vÃ©nements manuels sont modifiables/supprimables directement par leur crÃ©ateur ou un administrateur).

### ðŸ’° Module Budget
- **`BudgetClient`** : Ajout d'une modale interactive pour saisir des dÃ©penses rÃ©elles (quantitÃ©, prix unitaire, frais de port, catÃ©gorie, date, commentaire) avec calcul automatique du montant total.
- Ouverture de l'ajout, de la mise Ã  jour de statut et de la suppression Ã  l'ensemble des membres de l'Ã©quipe (conformÃ©ment Ã  la matrice de scÃ©narios).

### ðŸ”” Module Notifications
- **`PATCH /api/notifications/[id]/read`** : Route modernisÃ©e avec retours JSON et `prisma.notification.updateMany`.
- **`NotificationBell`** : Prise en charge transparente des rÃ©ponses paginÃ©es ou directes.

---

## [1.1.0] â€” 2026-10-01

### ðŸ”’ SÃ©curitÃ©
- Mise Ã  jour de `next-auth` vers v5.0.0-beta.32 (correction vulnÃ©rabilitÃ©s critiques @auth/core).
- Restriction des `remotePatterns` dans `next.config.mjs` (suppression du wildcard `**`).
- Ajout des en-tÃªtes de sÃ©curitÃ© HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

### ðŸ—„ï¸ SchÃ©ma Prisma
- Migration des champs financiers de `Float` vers `Decimal` (BudgetEntry.amount, unitPrice, deliveryCost + Project.totalBudget).
- Ajout de `onDelete: SetNull` sur les relations `createdBy` de 5 modÃ¨les pour la suppression d'utilisateurs.
- Ajout de `onDelete: Cascade` sur la relation parent/sous-tÃ¢ches (suppression rÃ©cursive).
- Ajout de `updatedAt` sur TaskAssignment, MeetingAttendee, GanttMilestone, BudgetEntry.
- Ajout du champ `reminderHoursBefore` sur User pour les rappels configurables.
- Ajout des types de notification `TASK_DELETED` et `MEETING_CANCELLED`.
- Suppression du `previewFeatures = ["driverAdapters"]` deprecated.

### ðŸ”§ Routes API Backend
- **`POST /api/events`** : Ajout de la validation Zod.
- **`GET /api/events`** : Ajout des filtres de date `?start=...&end=...`.
- **`GET /api/budget`** et **`GET /api/notifications`** : Ajout de la pagination.
- **Budget** : Ouverture Ã  tous, recalcul automatique du totalBudget.
- **Meetings POST** : Ouverture Ã  tous, notifications MEETING_SCHEDULED.
- **Tasks DELETE** : Accessible aux ADMIN + assignÃ©s, notification TASK_DELETED.
- **Tasks PATCH** : Notification TASK_COMPLETED auto + completedAt.
- **Meetings DELETE** : Suppression Event calendrier + notification MEETING_CANCELLED.
- Standardisation de toutes les erreurs en JSON.
- Centralisation de `requireAuth()` sur toutes les routes.

### ðŸ“„ Documentation
- CrÃ©ation `.env.example` et `lib/validations/event.ts`.
- Ajout de `notifyUsers()` dans `lib/notifications.ts`.

### ðŸ› Corrections
- Fix conversions Decimal dans Dashboard et Budget.
- Fix compatibilitÃ© TypeScript avec next-auth v5 beta.
- Nettoyage de `test-hash.js`.
