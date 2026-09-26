import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Définition des chemins absolus vers le dossier app et ses dépendances
const appRoot = path.resolve(process.cwd(), "app");
const appRequire = createRequire(path.resolve(appRoot, "package.json"));

// Chargement de React et react-dom/server depuis node_modules de l'application
const React = appRequire("react");
const { renderToStaticMarkup } = appRequire("react-dom/server");

// Résolution des URL des composants UI
const buttonUrl = pathToFileURL(path.resolve(appRoot, "src/components/ui/button.tsx")).href;
const inputUrl = pathToFileURL(path.resolve(appRoot, "src/components/ui/input.tsx")).href;
const cardUrl = pathToFileURL(path.resolve(appRoot, "src/components/ui/card.tsx")).href;
const labelUrl = pathToFileURL(path.resolve(appRoot, "src/components/ui/label.tsx")).href;
const alertUrl = pathToFileURL(path.resolve(appRoot, "src/components/ui/alert.tsx")).href;
const badgeUrl = pathToFileURL(path.resolve(appRoot, "src/components/ui/badge.tsx")).href;

/**
 * Vérifie de manière atomique la présence d'une classe CSS parmi les tokens de classe du HTML rendu.
 */
function hasClass(html, cls) {
  const match = html.match(/class="([^"]+)"/);
  if (!match) return false;
  const tokens = match[1].split(/\s+/);
  return tokens.includes(cls);
}

/**
 * Suite de tests adversariaux pour le rendu des composants primitifs shadcn/ui.
 * Valide l'intégrité des styles de base et la surcharge de classes personnalisées.
 */
export async function runTest() {
  console.log("▶ [Tier 5 - Adversarial] Test 5.2: Rendu des composants UI et surcharge de classes...");

  // Importation dynamique des composants UI
  const { Button } = await import(buttonUrl);
  const { Input } = await import(inputUrl);
  const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } = await import(cardUrl);
  const { Label } = await import(labelUrl);
  const { Alert, AlertTitle, AlertDescription } = await import(alertUrl);
  const { Badge } = await import(badgeUrl);

  let verifiedChecks = 0;

  // 1. Validation du composant Button
  console.log("  - Test Button...");
  const btnDefaultHtml = renderToStaticMarkup(React.createElement(Button, null, "Envoyer"));
  assert.ok(hasClass(btnDefaultHtml, "bg-primary"), "Button par défaut doit avoir bg-primary");
  assert.ok(hasClass(btnDefaultHtml, "inline-flex"), "Button doit conserver le layout inline-flex");
  assert.ok(hasClass(btnDefaultHtml, "h-10"), "Button par défaut doit avoir h-10");
  assert.ok(hasClass(btnDefaultHtml, "px-4"), "Button par défaut doit avoir px-4");
  verifiedChecks++;

  const btnConflictHtml = renderToStaticMarkup(
    React.createElement(Button, { className: "bg-destructive text-white h-16 p-8 hover:bg-destructive/90" }, "Supprimer")
  );
  assert.ok(hasClass(btnConflictHtml, "bg-destructive"), "Button doit adopter bg-destructive");
  assert.ok(!hasClass(btnConflictHtml, "bg-primary"), "Button ne doit plus contenir le token bg-primary");
  assert.ok(hasClass(btnConflictHtml, "h-16"), "Button doit adopter la hauteur h-16");
  assert.ok(!hasClass(btnConflictHtml, "h-10"), "Button ne doit plus contenir h-10");
  assert.ok(hasClass(btnConflictHtml, "p-8"), "Button doit adopter le padding p-8");
  assert.ok(!hasClass(btnConflictHtml, "px-4"), "Button ne doit plus contenir px-4");
  assert.ok(hasClass(btnConflictHtml, "rounded-md"), "Button doit préserver ses styles structurels de base (rounded-md)");
  assert.ok(hasClass(btnConflictHtml, "hover:bg-destructive/90"), "Button doit adopter hover:bg-destructive/90");
  assert.ok(!hasClass(btnConflictHtml, "hover:bg-primary/90"), "Button ne doit plus contenir hover:bg-primary/90");
  verifiedChecks++;

  // Test du polymorphisme asChild sur Button
  const btnAsChildHtml = renderToStaticMarkup(
    React.createElement(Button, { asChild: true, className: "custom-nav-link" },
      React.createElement("a", { href: "/dashboard" }, "Vers le Dashboard")
    )
  );
  assert.ok(btnAsChildHtml.startsWith("<a"), "Button avec asChild doit rendre une balise <a>");
  assert.ok(hasClass(btnAsChildHtml, "custom-nav-link"), "Balise <a> doit contenir custom-nav-link");
  assert.ok(hasClass(btnAsChildHtml, "inline-flex"), "Balise <a> doit hériter des classes Button");
  verifiedChecks++;

  // 2. Validation du composant Input
  console.log("  - Test Input...");
  const inputHtml = renderToStaticMarkup(
    React.createElement(Input, {
      type: "password",
      placeholder: "Mot de passe",
      className: "h-14 border-destructive bg-secondary custom-input-test",
    })
  );
  assert.ok(inputHtml.includes('type="password"'), "Input doit transmettre l'attribut type");
  assert.ok(hasClass(inputHtml, "h-14"), "Input doit adopter h-14");
  assert.ok(!hasClass(inputHtml, "h-10"), "Input doit éliminer h-10");
  assert.ok(hasClass(inputHtml, "border-destructive"), "Input doit adopter border-destructive");
  assert.ok(!hasClass(inputHtml, "border-input"), "Input doit éliminer border-input");
  assert.ok(hasClass(inputHtml, "bg-secondary"), "Input doit adopter bg-secondary");
  assert.ok(hasClass(inputHtml, "custom-input-test"), "Input doit conserver la classe personnalisée");
  assert.ok(hasClass(inputHtml, "w-full"), "Input doit conserver w-full");
  assert.ok(hasClass(inputHtml, "rounded-md"), "Input doit conserver rounded-md");
  verifiedChecks++;

  // 3. Validation de Card et sous-composants
  console.log("  - Test Card suite...");
  const cardTreeHtml = renderToStaticMarkup(
    React.createElement(Card, { className: "shadow-2xl border-2" },
      React.createElement(CardHeader, { className: "p-4 space-y-0" },
        React.createElement(CardTitle, { className: "text-lg font-bold" }, "Titre"),
        React.createElement(CardDescription, { className: "text-destructive" }, "Description")
      ),
      React.createElement(CardContent, { className: "p-2" }, "Contenu"),
      React.createElement(CardFooter, { className: "justify-between p-4" }, "Pied")
    )
  );
  assert.ok(hasClass(cardTreeHtml, "shadow-2xl"), "Card doit adopter shadow-2xl");
  assert.ok(!hasClass(cardTreeHtml, "shadow-sm"), "Card ne doit pas avoir shadow-sm");
  assert.ok(hasClass(cardTreeHtml, "border-2"), "Card doit adopter border-2");
  assert.ok(hasClass(cardTreeHtml, "rounded-lg"), "Card doit préserver rounded-lg");
  assert.ok(hasClass(cardTreeHtml, "bg-card"), "Card doit préserver bg-card");
  assert.ok(cardTreeHtml.includes("text-lg"), "CardTitle doit adopter text-lg");
  assert.ok(!cardTreeHtml.includes("text-2xl"), "CardTitle ne doit pas conserver text-2xl");
  assert.ok(cardTreeHtml.includes("text-destructive"), "CardDescription doit adopter text-destructive");
  verifiedChecks++;

  // 4. Validation du composant Label
  console.log("  - Test Label...");
  const labelHtml = renderToStaticMarkup(
    React.createElement(Label, { htmlFor: "email-input", className: "text-destructive font-bold" }, "Email")
  );
  assert.ok(labelHtml.includes('for="email-input"'), "Label doit propager l'attribut htmlFor");
  assert.ok(hasClass(labelHtml, "text-destructive"), "Label doit adopter text-destructive");
  assert.ok(hasClass(labelHtml, "font-bold"), "Label doit adopter font-bold");
  assert.ok(!hasClass(labelHtml, "font-medium"), "Label doit éliminer font-medium");
  assert.ok(hasClass(labelHtml, "leading-none"), "Label doit conserver leading-none");
  verifiedChecks++;

  // 5. Validation de Alert et AlertTitle/Description
  console.log("  - Test Alert suite...");
  const alertHtml = renderToStaticMarkup(
    React.createElement(Alert, { variant: "destructive", className: "p-6" },
      React.createElement(AlertTitle, null, "Erreur"),
      React.createElement(AlertDescription, null, "Identifiants invalides")
    )
  );
  assert.ok(alertHtml.includes('role="alert"'), "Alert doit posséder l'attribut role=alert");
  assert.ok(hasClass(alertHtml, "border-destructive/50") || hasClass(alertHtml, "border-destructive"), "Alert destructive");
  assert.ok(hasClass(alertHtml, "p-6"), "Alert doit surcharger p-4 avec p-6");
  assert.ok(!hasClass(alertHtml, "p-4"), "Alert ne doit pas contenir p-4");
  verifiedChecks++;

  // 6. Validation du composant Badge
  console.log("  - Test Badge...");
  const badgeHtml = renderToStaticMarkup(
    React.createElement(Badge, { variant: "outline", className: "px-4 py-1 text-sm bg-accent" }, "Jalon Actif")
  );
  assert.ok(hasClass(badgeHtml, "px-4"), "Badge doit appliquer px-4");
  assert.ok(!hasClass(badgeHtml, "px-2.5"), "Badge doit écraser px-2.5");
  assert.ok(hasClass(badgeHtml, "py-1"), "Badge doit appliquer py-1");
  assert.ok(!hasClass(badgeHtml, "py-0.5"), "Badge doit écraser py-0.5");
  assert.ok(hasClass(badgeHtml, "text-sm"), "Badge doit appliquer text-sm");
  assert.ok(!hasClass(badgeHtml, "text-xs"), "Badge doit éliminer text-xs");
  assert.ok(hasClass(badgeHtml, "inline-flex"), "Badge doit conserver base layout");
  verifiedChecks++;

  console.log(`  ✓ ${verifiedChecks} groupes de composants UI validés avec succès sans régression de styles.`);
  return { name: "T5.2 UI Primitives Rendering", passed: true, verifiedGroups: verifiedChecks };
}

// Exécution directe avec Node / tsx
if (process.argv[1] && process.argv[1].endsWith("test-02-ui-primitives-rendering.mjs")) {
  runTest()
    .then(() => {
      console.log("✅ SUCCÈS : Rendu et fusion de styles validés pour tous les composants UI.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
