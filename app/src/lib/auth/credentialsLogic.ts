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
 * Durée de validité (en jours) d'un mot de passe temporaire distribué par l'administrateur.
 * Passé ce délai, le membre est invité à personnaliser son mot de passe.
 */
export const TEMP_PASSWORD_VALIDITY_DAYS = 30;

/**
 * Calcule la date d'échéance d'un mot de passe temporaire.
 *
 * @param from Date de départ (par défaut : maintenant)
 * @returns La date d'expiration à J+30
 */
export function computeTempPasswordExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + TEMP_PASSWORD_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Formate une échéance de mot de passe temporaire pour l'affichage (jj/mm/aaaa).
 *
 * @param date Échéance à formater
 * @returns La date au format français, ou null si absente
 */
export function formatTempPasswordExpiry(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
  return "[Projet Ouvert IMT] Tes accès à la plateforme MIN'IMOCA";
}

/**
 * Génère le corps du mail envoyé à un membre : salut, identifiant, mot de passe
 * temporaire, échéance, puis la consigne de le personnaliser.
 *
 * Le mot de passe affiché ici est exactement celui stocké dans `tempPassword`,
 * donc celui qui fonctionne — l'appelant doit vérifier au préalable qu'il
 * correspond bien au hash actif (voir `isTempPasswordActive`).
 *
 * @param user Nom, pseudo, mot de passe temporaire et échéance éventuelle
 * @param appUrl URL de l'application
 * @returns Le texte brut complet de l'email
 */
export function buildInvitationEmailBody(
  user: {
    name: string;
    pseudo: string;
    tempPassword?: string;
    tempPasswordExpiresAt?: Date | string | null;
  },
  appUrl: string
): string {
  const firstName = user.name.split(" ")[0] || user.name;
  const expiry = formatTempPasswordExpiry(user.tempPasswordExpiresAt);
  const signature = `À très vite,
Étienne`;

  // Compte déjà personnalisé : on ne prétend pas connaître le mot de passe.
  if (!user.tempPassword) {
    return `Salut ${firstName},

Voici tes accès à la plateforme du Projet Ouvert IMT (voilier MIN'IMOCA) :

- Lien : ${appUrl}
- Identifiant : ${user.pseudo}

Ton mot de passe a déjà été personnalisé : je ne le connais pas et je ne peux pas te le renvoyer. Si tu l'as oublié, réponds-moi et je t'en génère un nouveau.

${signature}`;
  }

  return `Salut ${firstName},

Voici tes accès à la plateforme du Projet Ouvert IMT (voilier MIN'IMOCA) :

- Lien : ${appUrl}
- Identifiant : ${user.pseudo}
- Mot de passe temporaire : ${user.tempPassword}

Ce mot de passe est temporaire${expiry ? ` (valable jusqu'au ${expiry})` : ""}. Change-le dès ta première connexion : Paramètres → Changer le mot de passe. Une fois changé, je ne peux plus le voir — seul toi le connais.

Ensuite, fais un tour : tes tâches (Kanban), les réunions et comptes-rendus, l'agenda et les jalons, le budget, et la doc du projet.

${signature}`;
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
    tempPasswordExpiresAt?: Date | string | null;
  },
  appUrl: string
): string {
  const subject = buildInvitationEmailSubject();
  const body = buildInvitationEmailBody(user, appUrl);

  return `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
