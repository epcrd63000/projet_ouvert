# 📋 Cahier des Charges V2 — Application de Suivi de Projet (Voilier MINIMOCA)
> **Version** : 2.0  
> **Date de mise à jour** : 02 Octobre 2026  
> **Rédigé par** : Etienne (Chef de projet) & Antigravity (Lead Developer)

---

## 1. Contexte et Objectif

Développement d'une **application web de suivi de projet** pour une équipe de 6 membres (IMT — CI1 Projet Ouvert - Projet Voilier MINIMOCA). L'outil doit centraliser la planification, le suivi des tâches, les comptes rendus de réunion, les tableaux de bord de pilotage et la base de connaissances IA en un seul endroit accessible, ergonomique et transparent pour tous les membres.

---

## 2. Équipe Projet

| Membre  | Rôle          | Permissions          |
|---------|---------------|----------------------|
| Etienne | Chef de projet | **Admin**            |
| Liam    | Second du chef | **Admin**            |
| Hugo    | Membre         | Membre standard      |
| Milane  | Membre         | Membre standard      |
| Solal   | Membre         | Membre standard      |
| Peter   | Membre         | Membre standard      |

---

## 3. Stack Technique

| Couche         | Technologie choisie                          |
|----------------|----------------------------------------------|
| **Frontend**   | Next.js (React)                              |
| **Backend**    | Node.js (API Routes Next.js)                 |
| **Base de données** | PostgreSQL (Neon.tech) + Prisma ORM               |
| **UI / Design**| Tailwind CSS + shadcn/ui                     |
| **Graphiques** | Recharts                                     |
| **Auth**       | Email + mot de passe (JWT / NextAuth)        |
| **Hébergement**| Vercel (CI/CD automatique via GitHub)        |

---

## 4. Gestion des Utilisateurs et Rôles

### 🔴 Admin (Etienne & Liam)
- Gérer les comptes utilisateurs, configurer le diagramme de Gantt, assigner des tâches.
- Gérer le système de **bannières d'alerte globales**.
- Maintenir la **Bibliothèque de Prompts IA** (Templates Markdown).

### 🟢 Membre standard
- Consulter le planning et l'avancement global.
- Gérer ses tâches via son **Kanban** et son **Tableau de Suivi**.
- Rédiger les comptes rendus et utiliser les Prompts IA fournis par l'admin.

---

## 5. Fonctionnalités Détaillées (Scope V2)

### 5.1 Planification & Réunions
- Réunions bi-hebdomadaires fixées par les Admins.
- Fiches de réunion générées avec : Présents, Objectifs, Décisions, Jalons.
- **NOUVEAU - Exports** : Possibilité d'exporter les comptes rendus de réunion au **format PDF** (pour un rendu propre et professionnel), individuellement ou groupés par période.

### 5.2 Gestion des Tâches et Profils
- **NOUVEAU - Catégories et Tags** : Chaque tâche possède un "profil" (ex: Développement, Design, Bug, Rédaction) pour permettre un filtrage avancé.
- Transparence totale : tout le monde peut voir les tâches des autres.

### 5.3 Tableau de Suivi Opérationnel (Tableau de type "M2V5")
- **NOUVEAU** : Un tableau de suivi sous forme de grille de données très détaillée.
- **Colonnes obligatoires** : Tâche, Pilote, Échéance, Charge, Livrables, Priorité, Qui valide ? Comment ?, % Avancement, Dernière MAJ, Retard ? Cause ?
- **Vues disponibles** :
  - *Vue Personnelle* : N'affiche que mes propres lignes.
  - *Vue Globale* : Affiche les lignes de toute l'équipe.
- Tri et filtrage par colonnes. Lignes modifiables directement dans le tableau.

### 5.4 Bibliothèque de Prompts IA (Menu Admin)
- **NOUVEAU** : Un menu dédié où l'Admin peut ajouter et stocker des modèles de texte importants et des "Prompts IA" au format `.md`.
- L'objectif est d'homogénéiser la rédaction (notamment des comptes rendus). 
- Les membres viennent copier ces prompts pour les utiliser sur leurs outils IA externes (ChatGPT, Gemini, etc.), puis collent le résultat formaté dans l'application.

### 5.5 Système de Bannières d'Alerte
- **NOUVEAU** : Système d'alerte sous forme de **bannières globales** affichées en haut de l'écran pour toute l'équipe (ex: *"Urgent : La tâche X a été modifiée par l'Admin"* ou *"Rappel de réunion imminente"*).
- Indépendant du système de notifications classiques (cloche).
- Les Admins peuvent déclencher ou supprimer ces bannières.

### 5.6 Tableau de Bord (Dashboard) & Gantt
- Dashboard avec 7 KPI temps réel : Taux d'avancement, Retards, Contribution, Jalons, Workload, Budget, Countdown réunion.
- Gantt global du projet (édition par Admins, consultation par tous).

### 5.7 UI/UX & Praticabilité
- Sidebar gauche claire regroupant logiquement les menus.
- Séparation visuelle nette entre :
  - **L'Espace Global** (Dashboard, Gantt, Réunions, Tableau Suivi Global, Bibliothèque Prompts)
  - **L'Espace Personnel** (Kanban, Tableau Suivi Personnel, Agenda personnel)

---

## 6. Architecture de Navigation (Sidebar V2)

1. 🏠 **Vue Générale**
   - Dashboard & KPIs
   - Diagramme de Gantt
2. 📋 **Suivi des Tâches**
   - Mon Kanban (Mes tâches en cours)
   - Tableau de Suivi (Vue Perso / Vue Globale avec colonnes détaillées)
3. 🤝 **Réunions & Équipe**
   - Agenda (Jour/Sem/Mois)
   - Comptes Rendus (Avec option d'export PDF)
4. 🤖 **Ressources**
   - Bibliothèque de Prompts IA (Modèles MD)
5. ⚙️ **Administration** *(Admins)*
   - Gestion du Budget
   - Gestion des Alertes Globales (Bannières)
   - Gestion des Comptes

---

## 7. Prochaines Étapes Techniques (Feuille de route dev)
1. Création des schémas Prisma pour les *Templates/Prompts IA* et les *Bannières d'Alerte*.
2. Extension du modèle *Task* pour inclure les tags/catégories et les champs spécifiques au tableau détaillé (% Avancement, Retard, Cause, Validation).
3. Intégration d'une librairie d'export PDF (ex: `jspdf` ou `react-pdf`).
4. Développement de la vue Data-Grid pour le Tableau de Suivi.
