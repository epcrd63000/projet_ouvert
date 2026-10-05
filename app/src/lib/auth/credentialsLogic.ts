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
 * Génère l'objet du message pour le mail d'invitation initial.
 *
 * @returns La chaîne de caractères du sujet
 */
export function buildInvitationEmailSubject(): string {
  return "[Projet Ouvert IMT] Accès à notre plateforme d'équipe & prise en main";
}

/**
 * Génère le corps de texte sobre et structuré pour l'invitation d'un membre.
 * Présente les identifiants, la tâche d'exemple, le tour d'horizon des onglets et l'appel aux retours.
 *
 * @param user Informations de l'utilisateur (nom, pseudo, mot de passe temporaire)
 * @param appUrl URL de l'application Web
 * @returns Le texte brut complet de l'email
 */
export function buildInvitationEmailBody(
  user: {
    name: string;
    pseudo: string;
    tempPassword?: string;
  },
  appUrl: string
): string {
  const firstName = user.name.split(" ")[0] || user.name;
  const passwordText = user.tempPassword
    ? user.tempPassword
    : "(Identifiant existant ou déjà configuré)";

  return `Salut ${firstName},

(Je t'avais déjà envoyé un premier mail tout à l'heure, mais je pense qu'il a dû atterrir direct dans tes spams / courriers indésirables !)

Pour qu'on puisse s'organiser facilement à 6 sur notre Projet Ouvert IMT, j'ai mis en place une petite plateforme collaborative. L'idée c'est de tout centraliser au même endroit.

Voici tes accès :
- Lien : ${appUrl}
- Identifiant : ${user.pseudo}
- Mot de passe temporaire : ${passwordText}

Je te laisse te connecter et faire un petit tour pour découvrir l'outil. J'ai préparé pas mal de choses :
- Un tableau pour nos tâches (je t'ai d'ailleurs assigné une petite tâche de test pour que tu puisses essayer !)
- Un espace pour nos comptes-rendus de réunion
- Un agenda avec les gros jalons IMT et nos créneaux
- Un suivi pour le budget et nos dépenses
- Et un coin doc avec le cahier des charges et les consignes

Tu pourras changer ton mot de passe dans les paramètres si tu le souhaites.

N'hésite pas à me dire ce que tu en penses, ce qui est pratique ou ce qu'on pourrait améliorer. Le but, c'est de peaufiner ça ensemble avant de se lancer dans nos premières vraies réunions de travail !

À très vite,
Étienne`;
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
  const subject = buildInvitationEmailSubject();
  const body = buildInvitationEmailBody(user, appUrl);

  return `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
