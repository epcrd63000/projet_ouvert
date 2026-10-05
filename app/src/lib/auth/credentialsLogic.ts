/**
 * Utilitaires métier pour la gestion des identifiants et des accès utilisateurs (IMT Projet Ouvert).
 * Permet la génération de mots de passe aléatoires sécurisés, la résolution d'identifiants flexibles
 * (prénom insensible à la casse, nom complet ou email), et la composition de liens mailto.
 */

/**
 * Génère un mot de passe aléatoire hautement sécurisé et facilement lisible.
 * Évite les ambiguïtés visuelles et garantit au moins une minuscule, une majuscule et un chiffre.
 *
 * @param length Longueur souhaitée pour le mot de passe (défaut : 10)
 * @returns Le mot de passe généré en clair
 */
export function generateSecurePassword(length = 10): string {
  // Caractères lisibles sans ambiguïtés visuelles (exclut 0, O, 1, l, I)
  const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijkmnopqrstuvwxyz";
  const numberChars = "23456789";
  const symbolChars = "!@#$%^&*-_";

  const allChars = uppercaseChars + lowercaseChars + numberChars + symbolChars;

  // Garantir au moins un caractère de chaque type obligatoire
  const result: string[] = [
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
    numberChars[Math.floor(Math.random() * numberChars.length)],
    symbolChars[Math.floor(Math.random() * symbolChars.length)],
  ];

  // Compléter le reste aléatoirement
  for (let i = result.length; i < length; i++) {
    result.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Mélange de Fisher-Yates pour une dispersion uniforme
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join("");
}

/**
 * Extrait le pseudo / identifiant de connexion par défaut à partir d'un nom complet ou partiel.
 * Par exemple: "Hugo RAMPAZZO" -> "hugo", "Solal BENQADI" -> "solal".
 *
 * @param fullName Nom complet de l'utilisateur
 * @returns L'identifiant simple en minuscules
 */
export function extractUserPseudo(fullName: string): string {
  if (!fullName) return "";
  const cleaned = fullName.trim();
  const firstName = cleaned.split(" ")[0];
  return firstName.toLowerCase();
}

/**
 * Vérifie si un identifiant saisi correspond à un utilisateur donné.
 * Accepte le prénom simple insensible à la casse, le nom complet, l'email officiel ou le préfixe email.
 *
 * @param user Objet utilisateur contenant `email` et `name`
 * @param identifier Identifiant saisi par l'utilisateur
 * @returns Vrai si l'identifiant correspond, faux sinon
 */
export function matchUserIdentifier(
  user: { email: string; name: string },
  identifier: string
): boolean {
  if (!identifier || !user) return false;

  const input = identifier.trim().toLowerCase();
  if (!input) return false;

  const email = user.email.toLowerCase();
  const name = user.name.toLowerCase();
  const firstName = extractUserPseudo(user.name);

  // 1. Égalité stricte avec l'email
  if (email === input) return true;

  // 2. Égalité avec le nom complet
  if (name === input) return true;

  // 3. Égalité avec le prénom simple (pseudo par défaut)
  if (firstName === input) return true;

  // 4. Correspondance avec le préfixe email (ex: "hugo.rampazzo" pour "hugo.rampazzo@etu.imt-nord-europe.fr")
  const emailPrefix = email.split("@")[0];
  if (emailPrefix === input) return true;

  // 5. Cas où l'email commence par `input.` (ex: 'hugo' pour 'hugo.rampazzo@...')
  if (email.startsWith(`${input}.`) || email.startsWith(`${input}@`)) return true;

  return false;
}

/**
 * Construit l'URL mailto pour envoyer à un utilisateur ses accès personnalisés par email.
 *
 * @param user Informations de l'utilisateur (nom, email, pseudo, mot de passe temporaire)
 * @param appUrl URL de l'application Web
 * @returns Le lien complet `mailto:...` encodé
 */
export function buildMailtoUrl(
  user: {
    name: string;
    email: string;
    pseudo: string;
    tempPassword?: string;
  },
  appUrl: string
): string {
  const firstName = user.name.split(" ")[0] || user.name;
  const subject = `[Projet Ouvert IMT] Bienvenue sur notre espace projet — Tes accès & démarrage`;

  const passwordText = user.tempPassword
    ? user.tempPassword
    : "(Identifiant existant ou déjà configuré)";

  const body = `Bonjour ${firstName},

Pour organiser au mieux notre Projet Ouvert IMT et centraliser tout notre travail d'équipe, voici la plateforme collaborative que j'ai mise en place pour nous 6 !

🔗 Accès direct : ${appUrl}
👤 Ton identifiant : ${user.pseudo}
🔑 Ton mot de passe temporaire : ${passwordText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 CE QUE TU VAS RETROUVER SUR LE SITE :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Kanban & Tâches :
Un tableau interactif (À faire, En cours, Terminé) avec une première tâche de démarrage qui t'est déjà assignée pour la semaine prochaine !

📅 Agenda & Jalons officiels :
Tous les jalons IMT officiels (TD, livrables, soutenances) et les créneaux de réunions de notre équipe pour ne rien manquer.

💰 Budget & Trésorerie :
Le suivi en direct de nos financements (APICIL, BDE, Fablab) et la gestion de nos devis et achats de matériel.

🤝 Réunions & Décisions :
L'ordre du jour de nos points hebdos, les feuilles de présence et les décisions actées converties directement en actions.

📚 Infos Importantes :
Les consignes du module, le cahier des charges et la documentation technique de référence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 POUR COMMENCER :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Clique sur le lien ci-dessus.
2. Connecte-toi avec ton prénom ("${user.pseudo}") et ton mot de passe ci-dessus.
3. Rends-toi dans l'onglet Paramètres pour personnaliser ton mot de passe si tu le souhaites.
4. Va jeter un œil à ta première tâche sur le tableau Kanban !

À très vite en séance pour qu'on avance ensemble !
Étienne`;

  return `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
