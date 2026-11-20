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
  buildInvitationEmailSubject,
  buildInvitationEmailBody,
  formatTempPasswordExpiry,
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

  // 4. Tests de génération de lien mailto et contenu du mail d'accès
  console.log("  4. Test buildMailtoUrl et contenu du mail d'accès...");
  const expiry = new Date("2026-12-19T12:00:00.000Z");
  const mailUserData = {
    name: "Hugo RAMPAZZO",
    email: "hugo.rampazzo@etu.imt-nord-europe.fr",
    pseudo: "hugo",
    tempPassword: "SafePassword42!",
    tempPasswordExpiresAt: expiry,
  };
  const appTargetUrl = "https://mon-projet-imt.vercel.app";

  const mailtoLink = buildMailtoUrl(mailUserData, appTargetUrl);

  assertTrue(mailtoLink.startsWith("mailto:hugo.rampazzo@etu.imt-nord-europe.fr"), "Le mailto doit cibler l'email officiel");
  assertTrue(mailtoLink.includes("subject="), "Le mailto doit avoir un sujet");
  assertTrue(mailtoLink.includes("body="), "Le mailto doit avoir un corps encodé");

  const decodedBody = decodeURIComponent(mailtoLink);

  // Salut personnalisé
  assertTrue(decodedBody.includes("Salut Hugo,"), "Le mail doit commencer par un salut personnalisé");

  // Identifiants (login + mot de passe)
  assertTrue(decodedBody.includes("Identifiant : hugo"), "Le mail doit contenir l'identifiant de connexion");
  assertTrue(decodedBody.includes("Mot de passe temporaire : SafePassword42!"), "Le mail doit contenir le mot de passe temporaire");
  assertTrue(decodedBody.includes(appTargetUrl), "Le mail doit contenir le lien de l'application");

  // Échéance + consigne de changement
  assertTrue(
    decodedBody.includes(formatTempPasswordExpiry(expiry)!),
    "Le mail doit rappeler la date d'expiration du mot de passe temporaire"
  );
  assertTrue(
    decodedBody.includes("Change-le dès ta première connexion"),
    "Le mail doit demander explicitement de changer le mot de passe"
  );
  assertTrue(
    decodedBody.includes("Paramètres → Changer le mot de passe"),
    "Le mail doit indiquer où changer le mot de passe"
  );

  // Sujet
  assertTrue(
    buildInvitationEmailSubject().includes("Projet Ouvert IMT"),
    "Le sujet doit identifier le projet"
  );

  // Compte déjà personnalisé : aucun mot de passe ne doit apparaître
  const personalizedBody = buildInvitationEmailBody(
    { name: "Liam BEAN", pseudo: "liam", tempPassword: undefined },
    appTargetUrl
  );
  assertTrue(personalizedBody.startsWith("Salut Liam,"), "Le mail reste personnalisé sans mot de passe temporaire");
  assertTrue(
    personalizedBody.includes("déjà été personnalisé"),
    "Le mail doit préciser que le mot de passe est déjà personnalisé"
  );
  assertTrue(
    !personalizedBody.includes("Mot de passe temporaire :"),
    "Aucun mot de passe ne doit être affiché pour un compte personnalisé"
  );

  // Vérification de la sobriété : pas d'avalanche d'émojis dans le texte
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/g;
  const emojiMatches = decodedBody.match(emojiRegex) || [];
  assertTrue(emojiMatches.length <= 2, `Le corps doit être sobre en émojis (trouvé ${emojiMatches.length})`);

  console.log("✅ Tous les tests TDD pour la gestion des accès ont réussi avec succès !");
}

runAuthCredentialsTests();
