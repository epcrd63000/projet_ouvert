import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeonHTTP(connectionString, {});
const prisma = new PrismaClient({ adapter });

export const INITIAL_IMPORTANT_INFOS = [
  {
    title: "1. Organisation du Projet, Équipe & Réseau de Contacts",
    category: "ORGANISATION",
    isPinned: true,
    order: 1,
    interlocutors: "Damien Seguin (Client), Patrice Hulot (Tuteur interne), Philippe Hassel (Tuteur externe), Jorge Piedra Dorado (FabLab), Xavier Dorchies (Lahure)",
    eventDate: new Date("2026-09-14T08:00:00Z"),
    content: `## 📌 Fiche d'Identité & Gouvernance — Projet Voilier MINIMOCA

### 🎯 Le Client : Association *Des Pieds et Des Mains*
* **Fondateur :** **Damien Seguin** — Skipper professionnel IMOCA 60 (*Groupe APICIL*), né sans main gauche, double champion paralympique (2004, 2016 en 2.4 mR) et premier skipper handisport à boucler le Vendée Globe en solitaire.
* **Mission :** Promouvoir l'accès aux sports nautiques pour les personnes en situation de handicap et valoriser l'ingénierie inclusive.
* **Besoin Client :** Conception et fabrication d'un **voilier de course radiocommandé à foils échelle 1:7**, robuste et transportable, servant de support pédagogique, événementiel et démonstrateur technologique.

---

### 👥 Équipe Projet & Répartition des Rôles

| Membre | Rôle & Responsabilités | Missions Clés |
|---|---|---|
| **Nathan TASSEL** | Chef de Projet | Pilotage global, coordination équipe, revues de projet |
| **Nathanaël ARNAUD** | Communication & Sponsors | Partenariats, recherche sponsors, compte Instagram |
| **Marie-Caroline LEGRAND** | Secrétaire | Rédaction des comptes-rendus, animation des réunions |
| **Neil DAMOUR** | Trésorier | Gestion du budget, devis fournisseurs, suivi APICIL/BDE |
| **Clovis BOCQUET** | Vice-trésorier & Matériaux | Achats outillage, usinage atelier Lahure, stratification |
| **Félix LE ROUX** | Vice-secrétaire & Fabrication | Assemblage mécanique, impressions 3D, documentation |

> **Équipe de Continuité 2026-2027 :** Etienne (Admin), Liam (Admin), Hugo, Milane, Solal, Peter.

---

### 🎓 Tuteurs & Interlocuteurs Institutionnels

| Contact | Fonction / Entité | Coordonnées / Localisation | Rôle dans le projet |
|---|---|---|---|
| **Patrice HULOT** | Tuteur Interne IMT Nord Europe | patrice.hulot@imt-nord-europe.fr | Cadrage académique, notation revues, validations |
| **Philippe HASSEL** | Tuteur Externe | Tuteur métier voile & conception | Expertise navale, retours d'expérience maritimes |
| **Jorge PIEDRA DORADO** | Ingénieur FabLab IMT | FabLab site Bourseul | Support impression 3D FDM & résine, inserts |
| **Xavier DORCHIES** | Technicien Atelier | Site de Lahure | Choix matériaux composites, carbone, usinage inox |
| **Tristan LEGRAIN** | Ancien Chef de Projet (2023-2024) | Promo sortante | Passation des archives CAO, retours d'essais |
| **Marie BOUFFLERS** | Coordinatrice MOOC GdP | marie.boufflers@imt-nord-europe.fr | Validation des modules MOOC Gestion de Projet |`,
  },
  {
    title: "2. Calendrier Général, Jalons Critiques & Échéances 2026-2027",
    category: "CALENDRIER",
    isPinned: true,
    order: 2,
    interlocutors: "Patrice Hulot, Marie Boufflers, Direction des Études IMT",
    eventDate: new Date("2026-11-27T17:00:00Z"),
    content: `## 📅 Planning Officiel & Jalons Clés — IMT Projet Ouvert 2026-2027

### 🚨 Jalons d'Évaluation Impératifs (Projet Reconduit MINIMOCA)

| Date Limite | Événement / Livrable | Format & Dépôt | Pénalité en cas de retard |
|---|---|---|---|
| **Vendredi 27 Nov. 2026 à 17h00** | **Remise Cahier des Charges (CDC)** | Dépôt PDF sur MLS + Envoi mail aux 2 tuteurs | Malus de 1 à 2 pts (nommage erroné : -0,25 pt) |
| **Vendredi 04 Déc. 2026 à 17h00** | **Livrable Pecha Kucha (Oral S1)** | 20 slides × 20 s (6 min 40 s) déposé sur MLS | Évaluation Client + Tuteurs (Note /20) |
| **Lundi 11 Janvier 2027** | **AUDIT de Mi-Parcours** | Audit oral (8h-12h ou 14h-18h) | Vérification de l'avancement et méthodologie |
| **Mardi 04 Mai 2027 (14h-18h)** | **Soutenance Finale (Vague 1)** | Présentation orale devant jury extérieur | Note finale Projet Ouvert |
| **Mardi 11 Mai 2027 (17h-18h)** | **Trophée Inter-Projets** | Moment convivial & Vidéo récapitulative | Prix de l'école et valorisation |

---

### 📋 Chronologie Détaillée des Séances

#### Semestre 1 : Cadrage, Spécifications & Conception
* **14-16 Septembre 2026 :** TD N°1 — Présentation du module, positionnement du groupe.
* **21 Septembre 2026 :** Ouverture officielle de la Semaine 1 du MOOC Gestion de Projet.
* **29 Septembre 2026 :** Amphi plénier — Conditions d'accès FabLab & règles du Pôle Communication.
* **02-07 Octobre 2026 :** TD N°2 — Vérification contact client, clarification des objectifs et besoins.
* **20 Octobre 2026 :** Séance Libre N°1 (14h-18h).
* **02-04 Novembre 2026 :** TD N°3 — Finalisation convention et complétion du Cahier des Charges.
* **10 Novembre 2026 :** Séance Libre N°2 (14h-18h).
* **16 Novembre 2026 :** **MEETING Général (8h-12h ou 14h-18h)** avec présence obligatoire des tuteurs.
* **24 Nov. — 15 Déc. 2026 :** Séances Libres N°3 à N°6 (travail au FabLab).
* **05 Janvier 2027 :** Séance Libre N°7 (préparation de l'audit).
* **25-29 Janvier 2027 :** *Semaine de partiels (aucune séance de projet).*

#### Semestre 2 : Prototypage, Assemblage & Essais en Eau
* **09 Février 2027 :** Séance Libre N°9 — Début des visites IMT Nord Europe.
* **16 Février 2027 :** Séance Libre N°10 — *Attention session en matinée (8h00 - 12h00)*.
* **23 Février — 09 Mars 2027 :** Séances Libres N°11 et N°12.
* **16 Mars 2027 :** Séances Libres N°13-14 — **Journée continue complète (8h00 - 18h00)** au FabLab.
* **06 Avril 2027 :** Séances Libres N°15-16 — **Journée continue complète (8h00 - 18h00)**.
* **Mai 2027 :** Clôture, soutenances finales et remise des livrables.

> **Règle de Nommage Obligatoire du CDC :**  
> \`Projet ouvert N°24 – Voilier MINIMOCA – CDC.pdf\` *(Tout écart de nommage est sanctionné d'un malus de 0,25 point).*`,
  },
  {
    title: "3. Dossier Technique MINIMOCA, Fabrication FabLab & Retours d'Expérience",
    category: "TECHNIQUE",
    isPinned: false,
    order: 3,
    interlocutors: "Jorge Piedra Dorado (FabLab), Xavier Dorchies (Lahure), Tristan Legrain",
    eventDate: new Date("2026-04-06T18:00:00Z"),
    content: `## 🛠️ Dossier Technique de Conception & Fabrication — Voilier MINIMOCA

### ⛵ Spécifications Générales du Voilier
* **Type :** Monocoque de course radiocommandé inspiré de la classe IMOCA 60.
* **Échelle :** 1:7 (longueur de coque ~90 cm, classe métrique RG65 augmentée).
* **Appendices :** Foils latéraux porteurs en carbone, quille pendulaire orientable par servo treuil.
* **Matériaux principaux :** Fibre de carbone (tissus sergé 200g/m²), résine époxy, filament PETG / PLA armé carbone pour pièces 3D, inserts filetés laiton, acier inox pour l'axe de quille.

---

### 🏭 Composants Fabriqués & Opérations Réalisées

#### 1. Puits de Foils & Pièces en Impression 3D
* **Complexité :** L'une des pièces les plus critiques du bateau. Nécessite une étanchéité parfaite et une résistance aux efforts transversaux en navigation sur foil.
* **Procédé :** Impression 3D au FabLab avec buses acier 0.6 mm, filament PETG haute résistance thermique et chimique.
* **Inserts :** Pose à chaud d'inserts taraudés en laiton pour permettre le vissage démontable des platines de foils sans arrachement.

#### 2. Bulbe & Voile de Quille Pendulaire
* **Préparation du bulbe :** Bulbe lesté (plomb) hérité de l'année précédente, poncé et ajusté en masse.
* **Stratification Carbone :**
  1. Découpe des tissus de carbone et tissu d'arrachage (*peel ply*).
  2. Imprégnation résine époxy bi-composant sous contrôle température.
  3. Mise sous vide avec pompe du FabLab pour débullage et compacité maximale.
  4. Finition : ponçage à l'eau grain 400/800 et pose d'un mastic époxy étanche.
* **Axe de quille :** Arbre en inox usiné avec Xavier Dorchies sur le site de Lahure pour garantir un guidage fluide sans jeu sous forte gîte.

#### 3. Structure Interne, Cloisons & Tableau Arrière
* **Cloisons étanches :** Découpe à la commande numérique / scie dans des plaques de carbone rigides pré-imprégnées. Collage structurel à l'araldite époxy.
* **Tableau arrière :** Reprise complète de la pièce, nettoyage des imperfections, intégration du passage de jaumière pour les safrans.
* **Platine électronique démontable :** Support en impression 3D recevant le récepteur radio 2.4 GHz, la batterie LiPo 2S et les contrôleurs de servos.

---

### ⚠️ Retours d'Expérience & Points de Vigilance pour l'Équipe

| Composant | Risque / Problème Rencontré | Solution & Préconisation Technique |
|---|---|---|
| **Puits de foils** | Légère déformation thermique à l'impression | Utiliser buse 0.6 mm, vitesse réduite (35 mm/s), contrôle dimensionnel avant collage |
| **Étanchéité Pont / Cockpit** | Infiltrations d'eau lors de gîtes prononcées | Poser le gréement avant le pont définitif, joint silicone marin ou trappe à lèvre étanche |
| **Liaison Quille / Axe** | Contrainte de cisaillement élevée | Doubler les paliers de guidage en bronze / téflon, graissage téflonné régulier |
| **Passation & Fichiers** | Dispersion des fichiers STEP/STL | Centralisation stricte sur le Drive IMT avec nommage versionné (v1.0, v1.1...) |

---

### 🎯 Assemblages Restants à Valider
1. Commande de direction et synchronisation du double safran.
2. Fixation du support de mât carbone et des cadènes de haubans en Dyneema 2 mm.
3. Pose des trappes de visite étanches du pont.
4. Premiers essais d'étanchéité en bassin au FabLab avant mise à l'eau officielle.`,
  },
];

async function seedImportantInfos() {
  console.log("🌱 Début du seed des fiches Infos Importantes MINIMOCA...");

  // Suppression des anciennes entrées si existantes
  await prisma.importantInfo.deleteMany();

  for (const info of INITIAL_IMPORTANT_INFOS) {
    const created = await prisma.importantInfo.create({
      data: info,
    });
    console.log(`✔ Fiche créée : "${created.title}" [${created.category}]`);
  }

  console.log("🎉 Seed Infos Importantes terminé avec succès !");
}

if (process.argv[1]?.includes("seed-important-infos")) {
  seedImportantInfos()
    .catch((err) => {
      console.error("❌ Erreur seed Infos Importantes:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
