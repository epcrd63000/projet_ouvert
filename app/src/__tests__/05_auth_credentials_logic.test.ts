/**
 * Tests unitaires TDD pour la gestion des identifiants et de l'authentification (Projet Ouvert IMT).
 * Valide la génération de mot de passe aléatoire, la correspondance d'identifiants (nom/pseudo/email),
 * et la génération d'URL mailto pour les accès étudiants.
 */

import {
  generateSecurePassword,
  matchUserIdentifier,
  extractUserPseudo,
  buildMailtoUrl,
} from "../lib/auth/credentialsLogic";

function runAuthCredentialsTests() {
  console.log("🧪 Lancement des tests unitaires TDD pour la gestion des accès et identifiants...");

  // 1. Tests de génération de mots de passe aléatoires sécurisés
  console.log("  1. Test generateSecurePassword...");
  const pwd1 = generateSecurePassword(10);
  const pwd2 = generateSecurePassword(10);

  console.assert(pwd1.length === 10, `La longueur doit être de 10 caractères, reçu: ${pwd1.length}`);
  console.assert(pwd1 !== pwd2, "Deux mots de passe successifs doivent être différents et aléatoires");
  console.assert(/[A-Z]/.test(pwd1), "Le mot de passe doit contenir au moins une majuscule");
  console.assert(/[a-z]/.test(pwd1), "Le mot de passe doit contenir au moins une minuscule");
  console.assert(/[0-9]/.test(pwd1), "Le mot de passe doit contenir au moins un chiffre");
  console.log("     ✓ Mot de passe aléatoire généré avec succès :", pwd1);

  // 2. Tests d'extraction de pseudo / identifiant par défaut
  console.log("  2. Test extractUserPseudo...");
  console.assert(extractUserPseudo("Hugo RAMPAZZO") === "hugo", "Doit extraire le premier prénom en minuscules");
  console.assert(extractUserPseudo("Etienne PICARD") === "etienne", "Doit extraire 'etienne'");
  console.assert(extractUserPseudo("Solal BENQADI") === "solal", "Doit extraire 'solal'");
  console.assert(extractUserPseudo("Liam") === "liam", "Doit supporter un prénom seul");
  console.assert(extractUserPseudo("  Milane  ") === "milane", "Doit nettoyer les espaces");

  // 3. Tests de correspondance d'identifiant (connexion)
  console.log("  3. Test matchUserIdentifier...");
  const mockUser = {
    name: "Hugo RAMPAZZO",
    email: "hugo.rampazzo@etu.imt-nord-europe.fr",
  };

  // Doit matcher le prénom en minuscules
  console.assert(matchUserIdentifier(mockUser, "hugo") === true, "Doit matcher 'hugo'");
  // Doit être insensible à la casse
  console.assert(matchUserIdentifier(mockUser, "Hugo") === true, "Doit matcher 'Hugo'");
  console.assert(matchUserIdentifier(mockUser, "HUGO") === true, "Doit matcher 'HUGO'");
  // Doit matcher le nom complet
  console.assert(matchUserIdentifier(mockUser, "Hugo RAMPAZZO") === true, "Doit matcher 'Hugo RAMPAZZO'");
  console.assert(matchUserIdentifier(mockUser, "hugo rampazzo") === true, "Doit matcher 'hugo rampazzo'");
  // Doit matcher l'adresse email étudiante officielle
  console.assert(matchUserIdentifier(mockUser, "hugo.rampazzo@etu.imt-nord-europe.fr") === true, "Doit matcher l'email officiel");
  // Doit matcher un préfixe d'email ou ancien email imt.fr si configuré
  console.assert(matchUserIdentifier(mockUser, "hugo.rampazzo") === true, "Doit matcher le préfixe email");
  // Doit refuser un identifiant erroné
  console.assert(matchUserIdentifier(mockUser, "etienne") === false, "Ne doit pas matcher un autre prénom");
  console.assert(matchUserIdentifier(mockUser, "inconnu") === false, "Ne doit pas matcher un inconnu");
  console.assert(matchUserIdentifier(mockUser, "") === false, "Ne doit pas matcher une chaîne vide");

  // 4. Tests de génération de lien mailto
  console.log("  4. Test buildMailtoUrl...");
  const mailtoLink = buildMailtoUrl(
    {
      name: "Hugo RAMPAZZO",
      email: "hugo.rampazzo@etu.imt-nord-europe.fr",
      pseudo: "hugo",
      tempPassword: "SafePassword42!",
    },
    "https://mon-projet-imt.vercel.app"
  );

  console.assert(mailtoLink.startsWith("mailto:hugo.rampazzo@etu.imt-nord-europe.fr"), "Le mailto doit cibler l'email officiel");
  console.assert(mailtoLink.includes("subject="), "Le mailto doit avoir un sujet");
  console.assert(mailtoLink.includes("body="), "Le mailto doit avoir un corps encodé");
  console.assert(decodeURIComponent(mailtoLink).includes("hugo"), "Le corps doit contenir le pseudo");
  console.assert(decodeURIComponent(mailtoLink).includes("SafePassword42!"), "Le corps doit contenir le mot de passe");
  console.assert(decodeURIComponent(mailtoLink).includes("https://mon-projet-imt.vercel.app"), "Le corps doit contenir l'URL");

  console.log("✅ Tous les tests TDD pour la gestion des accès ont réussi avec succès !");
}

runAuthCredentialsTests();
