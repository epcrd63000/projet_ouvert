# 📋 Cahier des Charges — Application de Suivi de Projet
> **Version** : 1.0  
> **Date de rédaction** : 25 septembre 2026  
> **Rédigé par** : Etienne (Chef de projet) — via session /grill-me  

---

## 1. Contexte et Objectif

Développement d'une **application web de suivi de projet** pour une équipe de 6 membres (IMT — CI1 Projet Ouvert). L'outil doit centraliser la planification, le suivi des tâches, les comptes rendus de réunion et les tableaux de bord de pilotage en un seul endroit accessible par tous les membres.

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
| **Base de données** | PostgreSQL + Prisma ORM               |
| **UI / Design**| Tailwind CSS + shadcn/ui                     |
| **Graphiques** | Recharts                                     |
| **Auth**       | Email + mot de passe (JWT / NextAuth)        |
| **Hébergement**| Vercel (CI/CD automatique via GitHub)        |
| **Thème**      | Dark / Light mode (toggle utilisateur)       |

---

## 4. Gestion des Utilisateurs et Rôles

### 4.1 Authentification
- Connexion par **email + mot de passe**
- Les comptes sont **créés et gérés par les Admins**
- Réinitialisation de mot de passe gérée par les Admins

### 4.2 Rôles et Permissions

#### 🔴 Admin (Etienne & Liam)
- Créer / modifier / supprimer des tâches pour n'importe quel membre
- Planifier et fixer les réunions bi-hebdomadaires sur le planning
- Gérer les comptes utilisateurs (création, réinitialisation mot de passe)
- Modifier le diagramme de Gantt global
- Assigner des tâches aux membres
- Accéder à tous les tableaux de bord et KPI

#### 🟢 Membre standard (Hugo, Milane, Solal, Peter)
- Consulter le planning et le Gantt global
- Cocher / mettre à jour l'avancement de ses propres tâches
- Consulter et rédiger dans le compte rendu de réunion
- Accéder à son Kanban personnel
- Recevoir des notifications in-app

---

## 5. Fonctionnalités Détaillées

### 5.1 Planning et Réunions
- **Réunions récurrentes toutes les 2 semaines**, planifiées et fixées par les Admins
- Chaque réunion génère automatiquement une fiche avec :
  - 📅 Date et heure (auto-rempli)
  - 👥 Membres présents (auto-rempli depuis les comptes)
  - 📝 Champ texte libre (compte rendu rédigé à la main)
  - ✅ Liste de décisions prises (puces)
  - 🎯 Objectifs fixés avec assignation aux membres
  - 🏁 Paliers / jalons définis lors de la réunion
- **Tout le monde** peut rédiger et modifier le compte rendu (pendant et après la réunion)

### 5.2 Gestion des Tâches
- Chaque utilisateur peut créer une tâche qui lui est automatiquement assignée
- Les Admins disposent d'une action dédiée pour assigner une tâche à un ou plusieurs membres
- Chaque tâche contient : titre, description, assigné, date d'échéance facultative, statut, priorité
- Les tâches avec une échéance apparaissent dans l'agenda à cette date ; les membres voient leurs tâches et les Admins conservent la vue globale
- Le formulaire propose les deux prochaines réunions comme raccourcis pour choisir la date d'échéance, qui reste facultative
- Les membres cochent leur avancement entre les réunions
- L'avancement de chacun est **visible par tous** (transparence totale)

### 5.3 Kanban Personnel
- Chaque membre dispose de son propre tableau Kanban
- **4 colonnes fixes :**
  - 📌 **À faire**
  - 🔄 **En cours**
  - ✅ **Terminée**
  - 🚫 **Bloquée**
- Les cartes Kanban correspondent aux tâches assignées au membre

### 5.4 Diagramme de Gantt
- **Gantt global du projet** (un seul Gantt pour tout le projet)
- Visible par **tous les membres**
- Éditable **uniquement par les Admins**
- Affiche les jalons, les tâches et les périodes clés du projet

### 5.5 Tableau de Bord (Dashboard)
Graphiques mis à jour **en temps réel** affichant les KPI suivants :

| KPI | Description |
|-----|-------------|
| 📊 Taux d'avancement global | % de complétion du projet |
| ⚠️ Tâches en retard vs. dans les temps | Ratio retard / OK |
| 👤 Avancement par membre | Contribution individuelle visible |
| 🏁 Jalons atteints vs. restants | Suivi des paliers |
| ⚖️ Charge de travail (Workload) | Disponibilité et charge par membre |
| 💰 Budget consommé vs. budget total | Suivi financier |
| ⏳ Countdown prochaine réunion | Compte à rebours affiché |

### 5.6 Gestion du Budget
- Un budget global défini pour le projet
- **Tableau de dépenses modifiable** (saisie manuelle)
- **Export** du tableau (format CSV ou Excel)
- Accessible et modifiable par les Admins

### 5.7 Boîte de Réception (Notifications)
- Notifications **in-app uniquement** (badge + icône cloche dans le header)
- Déclenchées pour :
  - Nouvelle tâche assignée
  - Réunion planifiée ou modifiée
  - Objectif arrivant à échéance
  - Modification d'une tâche me concernant

### 5.8 Agenda (Calendrier)
- **3 vues disponibles** : Jour / Semaine / Mois (switch rapide entre les vues)
- Chaque membre peut **créer des événements** personnels ou d'équipe
- Les **réunions planifiées** apparaissent automatiquement dans l'agenda (synchronisation)
- Les tâches datées apparaissent dans l'agenda selon leurs assignations (vue globale pour les Admins)
- Les **jalons du Gantt** apparaissent automatiquement dans l'agenda (synchronisation)
- Un événement contient : titre, description, date/heure de début, date/heure de fin, couleur, visibilité (personnel ou équipe)
- Possibilité d'événements **toute la journée** (all-day)
- Clic sur un événement → fiche détail avec lien vers la réunion ou le jalon associé
- Vue **Semaine** avec affichage des créneaux horaires (grille horaire)

---

## 6. Interface Utilisateur (UI/UX)

### 6.1 Structure de navigation
- **Sidebar gauche fixe** : navigation principale entre les sections
- **Header** : profil utilisateur + icône notifications + toggle dark/light
- **Vue globale** : accessible à tous (Gantt, Dashboard, Réunions)
- **Vue personnelle** : Kanban individuel, mes tâches, mes objectifs

### 6.2 Sections de la Sidebar
1. 🏠 Dashboard (tableau de bord + KPI)
2. 📅 Planning & Réunions
3. 🗓️ Agenda (Jour / Semaine / Mois)
4. ✅ Mes Tâches (Kanban personnel)
5. 📊 Diagramme de Gantt
6. 📝 Comptes Rendus
7. 💰 Budget
8. 🔔 Notifications (boîte de réception)
9. ⚙️ Paramètres (Admin uniquement : gestion des comptes)

### 6.3 Thème
- Dark Mode / Light Mode avec **toggle persistent** par utilisateur

---

## 7. Architecture et Déploiement

- **Repository** : GitHub (à créer)
- **Déploiement** : Vercel (CI/CD automatique à chaque push sur `main`)
- **Base de données** : PostgreSQL hébergée (Supabase ou Neon.tech recommandé, compatible Vercel)
- **Scope initial** : **1 projet unique**, architecture conçue pour être extensible multi-projets

---

## 8. Périmètre de Livraison

> **Livraison complète dès le départ** — pas de phases, tout développé en une fois.

### Fonctionnalités incluses dans le livrable final :
- [x] Authentification (email + mot de passe) avec rôles Admin / Membre
- [x] Dashboard avec 7 KPI en temps réel
- [x] Planning des réunions bi-hebdomadaires
- [x] Fiches de compte rendu de réunion complètes
- [x] Gestion des tâches avec assignation
- [x] Kanban personnel (4 colonnes)
- [x] Diagramme de Gantt global
- [x] Agenda (vues Jour / Semaine / Mois) avec événements synchronisés
- [x] Gestion du budget (tableau + export)
- [x] Notifications in-app
- [x] Dark / Light mode toggle
- [x] Interface responsive (sidebar + header)

---

## 9. Évolutions Futures Envisagées (hors scope v1)
- Gestion multi-projets
- Export PDF des comptes rendus
- Intégration calendrier (Google Calendar)
- Commentaires sur les tâches
- Historique des modifications (audit log)

---

*Document généré suite à la session de cadrage /grill-me — 25 septembre 2026*
