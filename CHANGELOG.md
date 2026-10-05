# Journal des Modifications (CHANGELOG)

## [2.12.3] - 2026-10-05

### Communication & Expérience d'Accueil (Onboarding)
- **Refonte Sobre du Mail d'Invitation (`src/lib/auth/credentialsLogic.ts`)** :
  - Épuration drastique des émojis pour une présentation élégante, claire et professionnelle.
  - Précision explicite que la tâche assignée sur le Kanban est une **tâche d'exemple** pour tester et appréhender le flux de travail.
  - Invitation détaillée à explorer l'ensemble des onglets :
    - Tâches (Kanban) : prise en main des statuts, détails et assignations.
    - Réunions : découverte des premiers exemples créés, ordre du jour, feuilles de présence et génération automatique des comptes rendus / relevés de décisions.
    - Agenda & Jalons officiels IMT.
    - Budget & Trésorerie.
    - Documentation & Cahier des charges.
  - Section dédiée aux retours d'expérience pour recueillir les suggestions et affiner la plateforme avant de démarrer les réunions réelles.
- **Ouverture du Mail en Nouvel Onglet & Copie Directe (`UserCredentialRow.tsx` & `EtienneCredentialsPanel.tsx`)** :
  - Découpage modulaire du panneau d'identifiants (`UserCredentialRow.tsx`) sous la barre des 200 lignes.
  - Ajout de `target="_blank" rel="noopener noreferrer"` sur le lien `mailto:` pour éviter tout rechargement ou perturbation de l'onglet actif.
  - Ajout d'un bouton *Copier le texte* permettant de coller instantanément le message personnalisé dans WhatsApp, Discord ou un webmail.
- **Tests Unitaires TDD Enrichis (`src/__tests__/05_auth_credentials_logic.test.ts`)** :
  - Validation stricte du contenu de l'email (tâche d'exemple, réunions, retours, sobriété en émojis).

## [2.12.2] - 2026-10-05

### Travail Collaboratif & Multi-Assignation
- **Multi-Assignation Déverrouillée sur le Kanban (`src/components/kanban/TaskModal.tsx`)** :
  - Suppression de la restriction réservant les boutons de co-assignation aux seuls administrateurs.
  - Tout membre peut désormais créer une tâche partagée en binôme ou trinôme (ex: Hugo + Étienne).
- **Multi-Sélection des Responsables en Réunion (`src/components/meetings/DecisionAssigneeSelector.tsx` & `MeetingDecisionsCard.tsx`)** :
  - Nouveau composant de sélection multiple sous forme de badges cliquables interactifs dans le formulaire de réunion.
  - Prise en charge simultanée de plusieurs pilotes (ex: Liam, Hugo et Solal) lors de l'enregistrement ou de la modification d'une décision.
  - Affichage de l'ensemble des responsables sur chaque ligne de décision.
- **Conversion en Tâche avec Multi-Assignation Synchronisée (`src/lib/meetings/decisionService.ts`)** :
  - Ajout du champ `assigneeIds String[]` sur `MeetingDecision` en base Neon.
  - Création automatique des assignations (`TaskAssignment`) pour chaque responsable sélectionné lors du clic sur *Créer tâche*.
  - Synchronisation bidirectionnelle continue et mise à jour dynamique des assignations si la décision est modifiée.
- **Routes API Développées (`api/meetings/[id]/decisions`)** :
  - Support de `assigneeIds` dans les méthodes `POST` et `PATCH`.

## [2.12.1] - 2026-10-05

### Initialisation & Déploiement Équipe
- **Nettoyage Intégral des Tâches de Simulation** :
  - Purge des 20 anciennes tâches de test et de leurs 29 assignations obsolètes en base Neon.
  - Conservation rigoureuse des 11 jalons officiels IMT, des réunions d'équipe planifiées, du budget et des utilisateurs.
- **Création des 6 Tâches Officielles de Démarrage (Semaine du 12 au 18 octobre 2026)** :
  - Attribution d'une tâche concrète, détaillée et réaliste pour chaque membre de l'équipe :
    - Étienne : *Revue du cahier des charges et préparation du jalon S2* (Échéance 14/10)
    - Liam : *Engagement des bons de commande pour les fournitures composites* (Échéance 13/10)
    - Hugo : *Finalisation de la modélisation 3D de la coque sur SolidWorks* (Échéance 15/10)
    - Milane : *Dimensionnement de l'architecture d'alimentation et banc d'essai batterie* (Échéance 16/10)
    - Solal : *Dimensionnement du gréement et découpe des laizes de voile* (Échéance 15/10)
    - Peter : *Calibrage de la découpeuse laser et usinage des membrures en contreplaqué* (Échéance 16/10)
  - Données d'ingénierie complètes associées : charge estimée (`workload`), livrables (`deliverables`), tags et priorités.
- **Enrichissement du Premier Mail d'Onboarding (`src/lib/auth/credentialsLogic.ts`)** :
  - Restructuration du message `mailto:` individuel généré pour chaque camarade :
    - Message d'accueil convivial personnalisé au prénom de chacun.
    - Tour d'horizon des fonctionnalités clés du site (Kanban, Agenda/Jalons, Budget/Trésorerie, Réunions & Décisions, Documentation).
    - Identifiants de première connexion (prénom + mot de passe temporaire unique).
    - Guide étape par étape pour se connecter et découvrir sa première tâche assignée.

## [2.12.0] - 2026-10-05

### Sécurité & Authentification
- **Refonte Sécurisée de l'Écran de Connexion (`src/app/(auth)/login/page.tsx`)** :
  - Suppression intégrale des boutons de test/seed révélateurs et du mot de passe par défaut textuel.
  - Connexion simplifiée et moderne par prénom ou identifiant simple (ex: `etienne`, `hugo`, `solal`, `milane`, `peter`, `liam`), insensible à la casse.
  - Maintien du support de l'adresse email complète officielle en identifiant alternatif.
  - Ajout d'une bascule visuelle d'affichage/masquage du mot de passe (icône œil).
  - Messages d'erreur génériques sécurisés pour empêcher l'énumération de comptes.

### Gestion des Utilisateurs & Identifiants Officiels IMT
- **Migration vers les Identités Officielles IMT Nord Europe** :
  - Remplacement des adresses de test `...@imt.fr` par les comptes officiels des étudiants :
    - Étienne PICARD (`etienne.picard@etu.imt-nord-europe.fr` — ADMIN)
    - Liam BEAN (`liam.bean@etu.imt-nord-europe.fr` — ADMIN)
    - Hugo RAMPAZZO (`hugo.rampazzo@etu.imt-nord-europe.fr` — MEMBER)
    - Milane FARGUES (`milane.fargues@etu.imt-nord-europe.fr` — MEMBER)
    - Solal BENQADI (`solal.benqadi@etu.imt-nord-europe.fr` — MEMBER)
    - Peter BATLLO (`peter.batllo@etu.imt-nord-europe.fr` — MEMBER)
  - Préservation intégrale des identifiants existants en base Neon et de toutes les liaisons (tâches, jalons, décisions, budget).

### Espace Administrateur Réservé à Étienne & Distribution par Mailto
- **Panneau de Distribution des Accès (`EtienneCredentialsPanel.tsx`)** :
  - Intégration dans la page `/settings`, strictement restreint au compte d'Étienne.
  - Consultation de la liste des membres avec leur pseudo de connexion et leur mot de passe temporaire dédié.
  - Génération de mots de passe aléatoires robustes (10 caractères sans caractères ambigus).
  - Route d'administration sécurisée `/api/admin/reset-password` permettant la régénération de mot de passe en 1 clic.
  - Boutons d'envoi individuel par email (`mailto:`) avec destinataire, objet et message d'accueil pré-remplis incluant le lien de l'application et les identifiants.
  - Champ de détection/personnalisation dynamique de l'URL de l'application et bouton de copie du récapitulatif complet dans le presse-papier.

### Tests Unitaires & Intégration TDD
- **Couverture TDD Complète** :
  - `src/__tests__/05_auth_credentials_logic.test.ts` : Tests de génération de mots de passe, extraction de pseudo, matching d'identifiant et composition des liens mailto.
  - `src/__tests__/06_auth_integration.test.ts` : Validation de l'authentification des 6 membres par prénom et mot de passe contre la base Neon.
  - Validation de non-régression du test de seed général (`tests/01_tier1_feature_coverage/test-03-seed-users.mjs`).

## [2.11.0] - 2026-10-05

### Corrigé
- **Alignement du Budget du Tableau de Bord avec la Trésorerie Réelle** :
  - **Correction du dénominateur budgétaire** : Remplacement de l'ancien budget statique obsolète du projet (500,00 €) par le cumul dynamique des dotations et financements réels actifs (`FundingSource`: APICIL 2 997,00 €, BDE 116,00 €, Fablab 70,00 € = 3 183,00 €).
  - **Module de Calculs Unifié (`src/lib/budget/budgetCalculations.ts`)** : Centralisation des fonctions `calculateEffectiveTotalBudget`, `calculateEffectiveSpentBudget` et `calculateBudgetSummary` pour garantir une source de vérité financière unique partagée entre le tableau de bord et la page Trésorerie.
  - **Cohérence des Dépenses Réalisées et Engagées** : Prise en compte rigoureuse des dépenses `PAID` et `VALIDATED` (2 242,29 €) et exclusion des lignes annulées (`CANCELLED`), aboutissant à un taux de consommation exact de 70,4% (au lieu de la fausse alerte de dépassement à 448,5%).
  - **Jauge Budgétaire Enrichie (`BudgetGauge.tsx`)** : Affichage du solde restant réel (+940,71 € en vert), mise à jour visuelle de la jauge (en progression normale et non plus en rouge erreur) et ajout d'un lien d'accès direct vers la page de trésorerie.
  - **Synchronisation Automatique de la Base de Données Neon** : Mise à jour de `totalBudget` sur l'entité `Project` à 3 183,00 € et synchronisation automatique lors des opérations d'ajout/modification/suppression d'enveloppes de financement (`api/budget/funding`).
  - **Tests Unitaires TDD (`src/__tests__/04_budget_logic.test.ts`)** : Ajout de cas de tests validant la cohérence exacte des calculs budgétaires globaux.

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

## [2.9.0] - 2026-10-05

### Ajouté
- **Édition Complète des Lignes du Budget (« Ressources & Financements » et « Dépenses »)** :
  - **Modale d'Édition des Financements (`EditFundingModal.tsx`)** : Modification directe de tous les champs d'une entrée de ressource/sponsor (Source/Partenaire, Montant alloué, Date, Statut, Commentaire & Conditions).
  - **Bouton d'Action Modifier (`Pencil`)** : Intégré dans la colonne Actions du tableau des financements (`FundingSourcesTable.tsx`).
  - **Modale d'Édition des Dépenses (`EditExpenseModal.tsx`)** : Modification complète des achats (Libellé, Quantité, Prix unitaire, Port, Recalcul automatique, Enveloppe, Statut, Commentaire).
  - **Bouton d'Action Modifier (`Pencil`)** : Intégré dans la colonne Actions du tableau des dépenses (`ExpensesTable.tsx`).
  - **Logique Métier & Calculs (`src/lib/budget/budgetLogic.ts`)** : Fonctions pures de calcul de total, validation Zod tolérante pour les formats de dates, normalisation et formatage.
  - **Tests Unitaires TDD (`src/__tests__/04_budget_logic.test.ts`)** : Couverture complète des règles de calcul et de validation.

## [2.8.0] - 2026-10-05

### Ajouté
- **Refonte Complète de l'Onglet « Infos Importantes » & Documentation MINIMOCA Uniforme** :
  - **Moteur de Documentation Markdown Enrichi** :
    - Rendu Markdown temps réel complet (`infoMarkdownRenderer.tsx`) avec support typographique soigné pour les tableaux bordés, les listes méthodologiques, les citations en cartouche et les blocs de code.
    - Exportation instantanée de chaque fiche en fichier Markdown (`.md`) autonome avec frontmatter structuré (`infoExportUtils.ts`).
    - Importation directe par sélection de fichier `.md` avec prévisualisation et parsing automatique des métadonnées (titre, dates, catégorie, interlocuteurs).
  - **Architecture & Modèle de Données Enrichi (`ImportantInfo`)** :
    - Schéma Prisma étendu avec typage complet : `category` (ORGANISATION, CALENDRIER, TECHNIQUE, GENERAL), `eventDate` (date clé de référence/jalon), `interlocutors` (contacts et tuteurs associés), `isPinned` (priorisation en tête), `order`.
    - Migration PostgreSQL Neon appliquée avec succès.
  - **Mode Collaboratif Universel ("Modifiables par chaque membre")** :
    - Droits d'édition, de mise à jour, d'import et de création de fiches ouverts à tous les membres connectés de l'équipe pour un espace vivant et collaboratif.
    - Épinglage prioritaire des fiches critiques en un clic.
  - **3 Fiches Documentaires Maîtresses MINIMOCA Initialisées en Base** :
    - *Fiche 1 (Organisation)* : Gouvernance, Association *Des Pieds et Des Mains*, Damien Seguin, rôles de l'équipe étudiante, tuteurs Patrice Hulot & Philippe Hassel, experts FabLab Jorge Piedra Dorado & Xavier Dorchies, passation Tristan Legrain, coordinatrice MOOC Marie Boufflers.
    - *Fiche 2 (Calendrier)* : Chronologie officielle 2026-2027 complète, échéances critiques (Cahier des Charges le 27/11/2026 à 17h, Pecha Kucha le 04/12/2026, Audit le 11/01/2027, Soutenance Finale le 04/05/2027), consignes MLS et règles de pénalité.
    - *Fiche 3 (Dossier Technique)* : Spécifications du voilier classe RG65/IMOCA 1:7, fabrication des puits de foils et pièces 3D avec inserts au FabLab, bulbe et stratification carbone sous vide, cloisons étanches, axe inox Lahure, servomoteurs et retours d'expérience.
  - **Composants Découpés & Tests TDD (Tier 1)** :
    - Découpage strict en composants modulaires tous `< 200 lignes` (`InfoClient`, `InfoCard`, `InfoToolbar`, `InfoEditorModal`, `infoMarkdownRenderer`, `infoExportUtils`, `infoTypes`).
    - Suite de tests automatisée TDD Tier 1 (`tests/01_tier1_feature_coverage/test-16-important-infos-markdown.ts`) validant la persistance, le tri prioritaire et les modifications collaboratives.

## [2.7.0] - 2026-10-05

### Ajouté
- **Gestion Complète de la Trésorerie, Financements Multi-Sources & Annulations ("L'argent qu'on a, qui s'annule et qui se rajoute")** :
  - **Conformité au Rapport MINIMOCA (APICIL, BDE, Fablab)** : Alignement strict avec le bilan financier officiel du projet voilier MINIMOCA (pages 23-24 et Annexe 2 du rapport final).
  - **Modèle de Données & Schéma Prisma (`FundingSource`)** :
    - Nouveau modèle PostgreSQL `FundingSource` pour enregistrer et piloter chaque enveloppe de trésorerie (nom, montant, date, statut `RECEIVED`/`PENDING`/`CANCELLED`, commentaire, créateur).
    - Extension de `BudgetEntry` avec la relation `fundingSourceId` pour rattacher chaque achat à son enveloppe budgétaire dédiée.
    - Extension de l'enum `BudgetStatus` avec la valeur `CANCELLED` (Annulé).
  - **Mécanisme d'Annulation Non-Destructif ("Qui s'annule")** :
    - Basculement instantané d'une dépense ou d'un financement vers l'état *Annulé* en 1 clic.
    - Conservation intégrale de la ligne dans le tableau (style visuel grisé, barré et badge dédié) avec préservation du commentaire explicatif (ex: cause d'annulation, rupture fournisseur, remboursement).
    - Neutralisation comptable automatique : les montants des lignes annulées sont exclus des totaux consommés et des calculs de solde.
    - Réactivation possible à tout moment.
  - **Ajout Dynamique de Financements ("Qui se rajoute")** :
    - Modale dédiée `AddFundingModal.tsx` permettant aux administrateurs d'ajouter de nouvelles dotations, subventions ou sponsors qui s'additionnent en temps réel au budget disponible.
  - **Système de Commentaires Universel & Édition Rapide ("Que on peut commenter")** :
    - Nouveau composant `CommentDialog.tsx` permettant à tous les membres de consulter et d'éditer facilement le commentaire sur n'importe quelle ligne de dépense ou de financement.
  - **KPIs & Balances par Enveloppe (`BudgetSummaryCards.tsx`)** :
    - Carte globale de trésorerie (fonds disponibles, dépenses payées, dépenses engagées, solde réel, jauge de consommation).
    - Cartes individuelles de suivi pour chaque enveloppe (APICIL, BDE IMT, Fablab IMT, etc.) affichant la dotation, le montant consommé et le solde net restant.
  - **Export CSV Enrichi (`/api/budget/export`)** :
    - Inclusion de la source de financement rattachée, du statut et du commentaire complet, encodé en UTF-8 BOM pour ouverture directe sous Excel.
  - **Sérialisation RSC pour Client Components** : Conversion des types Prisma Decimal et Date en primitives pour éliminer les warnings de transfert RSC entre composants serveur et client.
  - **Architecture & Bonnes Pratiques Senior** :
    - Découpage strict en composants modulaires (`BudgetSummaryCards`, `FundingSourcesTable`, `ExpensesTable`, `AddFundingModal`, `AddExpenseModal`, `CommentDialog`, `types`), tous `< 200 lignes`.
    - Suite de tests automatisée TDD Tier 1 (`tests/01_tier1_feature_coverage/test-15-budget-funding-and-cancellation.ts`) validant le modèle de financement, les calculs de balance et la neutralisation des annulations.

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
