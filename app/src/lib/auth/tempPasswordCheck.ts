import bcrypt from "bcryptjs";

/**
 * Vérifie qu'un mot de passe temporaire affiché à l'administrateur correspond
 * bien au hash réellement utilisé à la connexion.
 *
 * C'est le garde-fou contre la désynchronisation `tempPassword` / `passwordHash` :
 * un mot de passe affiché mais obsolète ne doit jamais partir par mail.
 *
 * Module serveur uniquement (bcryptjs n'a pas sa place dans le bundle client).
 *
 * @param tempPassword Mot de passe lisible stocké en base
 * @param passwordHash Hash bcrypt du mot de passe actif
 * @returns `true` si le mot de passe fonctionnera, `false` sinon
 */
export async function isTempPasswordActive(
  tempPassword: string | null | undefined,
  passwordHash: string | null | undefined
): Promise<boolean> {
  if (!tempPassword || !passwordHash) return false;
  return bcrypt.compare(tempPassword, passwordHash);
}
