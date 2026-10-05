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

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Échec du test : ${message}`);
  }
}

function runAuthCredentialsTests() {
  console.log("🧪 Lancement des tests unitaires TDD pour la gestion des accès et identifiants...");

  // 1. Tests de génération de mots de passe aléatoires sécurisés
  console.log("  1. Test generateSecurePassword...");
  const pwd1 = generateSecurePassword(10);
  const pwd2 = generateSecurePassword(10);

  assertTrue(pwd1.length === 10, `La longueur doit être de 10 caractères, reçu: ${pwd1.length}`);
  assertTrue(pwd1 !== pwd2, "Deux mots de passe successifs doivent être différents et aléatoires");
  assertTrue(/[A-Z]/.test(pwd1), "Le mot de passe doit contenir au moins une majuscule");
  assertTrue(/[a-z]/.test(pwd1), "Le mot de passe doit contenir au moins une minuscule");
  assertTrue(/[0-9]/.test(pwd1), "Le mot de passe doit contenir au moins un chiffre");
  console.log("     ✓ Mot de passe aléatoire généré avec succès :", pwd1);

  // 2. Tests d'extraction de pseudo / identifiant par défaut
  console.log("  2. Test extractUserPseudo...");
  assertTrue(extractUserPseudo("Hugo RAMPAZZO") === "hugo", "Doit extraire le premier prénom en minuscules");
  assertTrue(extractUserPseudo("Etienne PICARD") === "etienne", "Doit extraire 'etienne'");
  assertTrue(extractUserPseudo("Solal BENQADI") === "solal", "Doit extraire 'solal'");
  assertTrue(extractUserPseudo("Liam") === "liam", "Doit supporter un prénom seul");
  assertTrue(extractUserPseudo("  Milane  ") === "milane", "Doit nettoyer les espaces");

  // 3. Tests de correspondance d'identifiant (connexion)
  console.log("  3. Test matchUserIdentifier...");
  const mockUser = {
    name: "Hugo RAMPAZZO",
    email: "hugo.rampazzo@etu.imt-nord-europe.fr",
  };

  assertTrue(matchUserIdentifier(mockUser, "hugo") === true, "Doit matcher 'hugo'");
  assertTrue(matchUserIdentifier(mockUser, "Hugo") === true, "Doit matcher 'Hugo'");
  assertTrue(matchUserIdentifier(mockUser, "HUGO") === true, "Doit matcher 'HUGO'");
  assertTrue(matchUserIdentifier(mockUser, "Hugo RAMPAZZO") === true, "Doit matcher 'Hugo RAMPAZZO'");
  assertTrue(matchUserIdentifier(mockUser, "hugo rampazzo") === true, "Doit matcher 'hugo rampazzo'");
  assertTrue(matchUserIdentifier(mockUser, "hugo.rampazzo@etu.imt-nord-europe.fr") === true, "Doit matcher l'email officiel");
  assertTrue(matchUserIdentifier(mockUser, "hugo.rampazzo") === true, "Doit matcher le préfixe email");
  assertTrue(matchUserIdentifier(mockUser, "etienne") === false, "Ne doit pas matcher un autre prénom");
  assertTrue(matchUserIdentifier(mockUser, "inconnu") === false, "Ne doit pas matcher un inconnu");
  assertTrue(matchUserIdentifier(mockUser, "") === false, "Ne doit pas matcher une chaîne vide");

  // 4. Tests de génération de lien mailto et contenu sobre
  console.log("  4. Test buildMailtoUrl et contenu sobre de l'email...");
  const mailUserData = {
    name: "Hugo RAMPAZZO",
    email: "hugo.rampazzo@etu.imt-nord-europe.fr",
    pseudo: "hugo",
    tempPassword: "SafePassword42!",
  };
  const appTargetUrl = "https://mon-projet-imt.vercel.app";

  const mailtoLink = buildMailtoUrl(mailUserData, appTargetUrl);

  assertTrue(mailtoLink.startsWith("mailto:hugo.rampazzo@etu.imt-nord-europe.fr"), "Le mailto doit cibler l'email officiel");
  assertTrue(mailtoLink.includes("subject="), "Le mailto doit avoir un sujet");
  assertTrue(mailtoLink.includes("body="), "Le mailto doit avoir un corps encodé");

  const decodedBody = decodeURIComponent(mailtoLink);
  assertTrue(decodedBody.includes("hugo"), "Le corps doit contenir le pseudo");
  assertTrue(decodedBody.includes("SafePassword42!"), "Le corps doit contenir le mot de passe");
  assertTrue(decodedBody.toLowerCase().includes("test") || decodedBody.toLowerCase().includes("exemple"), "Le corps doit préciser qu'il s'agit d'une tâche de test");
  assertTrue(decodedBody.toLowerCase().includes("spam") || decodedBody.toLowerCase().includes("indésirables"), "Le corps doit mentionner le précédent mail envoyé en spam");
  assertTrue(decodedBody.toLowerCase().includes("retour") || decodedBody.toLowerCase().includes("améliorer"), "Le corps doit inviter aux retours");

  // Vérification de la sobriété : pas d'avalanche d'émojis dans le texte
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/g;
  const emojiMatches = decodedBody.match(emojiRegex) || [];
  assertTrue(emojiMatches.length <= 2, `Le corps doit être sobre en émojis (trouvé ${emojiMatches.length})`);

  console.log("✅ Tous les tests TDD pour la gestion des accès ont réussi avec succès !");
}

runAuthCredentialsTests();
