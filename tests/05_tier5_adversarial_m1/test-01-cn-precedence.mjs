import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Définition du chemin d'accès absolu vers la fonction cn de l'application
const appPath = path.resolve(process.cwd(), "app/src/lib/utils.ts");
const utilsUrl = pathToFileURL(appPath).href;

/**
 * Suite de tests adversariaux pour la fonction cn (clsx + tailwind-merge).
 * Valide la résolution de priorité et les règles de précédence CSS Tailwind.
 */
export async function runTest() {
  console.log("▶ [Tier 5 - Adversarial] Test 5.1: Résolution des conflits et précédence avec cn()...");

  // Importation dynamique du module utils.ts via tsx / ts-node
  const { cn } = await import(utilsUrl);

  const testCases = [
    // 1. Conflits d'espacement (Padding)
    {
      category: "Padding - Remplacement direct",
      input: ["p-2", "p-4"],
      expected: "p-4",
    },
    {
      category: "Padding - Remplacement spécifique horizontal",
      input: ["px-4", "px-8"],
      expected: "px-8",
    },
    {
      category: "Padding - Surcharge directionnelle préservant la direction perpendiculaire",
      input: ["p-4", "px-2"],
      expected: "p-4 px-2",
    },
    {
      category: "Padding - Surcharge globale écrasant la surcharge directionnelle précédente",
      input: ["px-2", "p-4"],
      expected: "p-4",
    },

    // 2. Conflits de marges (Margin)
    {
      category: "Margin - Remplacement direct",
      input: ["m-2", "m-6"],
      expected: "m-6",
    },
    {
      category: "Margin - Surcharge globale sur spécifique",
      input: ["mx-2", "m-6"],
      expected: "m-6",
    },
    {
      category: "Margin - Surcharge spécifique sur globale",
      input: ["m-6", "mx-2"],
      expected: "m-6 mx-2",
    },

    // 3. Conflits de dimensions (Width / Height)
    {
      category: "Width - Remplacement direct",
      input: ["w-10", "w-full"],
      expected: "w-full",
    },
    {
      category: "Width - Inversion de l'ordre",
      input: ["w-full", "w-10"],
      expected: "w-10",
    },
    {
      category: "Height - Remplacement de hauteur",
      input: ["h-10", "h-12"],
      expected: "h-12",
    },

    // 4. Conflits d'affichage et disposition (Display / Flex)
    {
      category: "Display - Remplacement flex sur block",
      input: ["block", "flex"],
      expected: "flex",
    },
    {
      category: "Display - Remplacement hidden sur inline-flex",
      input: ["inline-flex", "hidden"],
      expected: "hidden",
    },
    {
      category: "Flex - Direction",
      input: ["flex-row", "flex-col"],
      expected: "flex-col",
    },
    {
      category: "Flex - Alignement items",
      input: ["items-start", "items-center"],
      expected: "items-center",
    },
    {
      category: "Flex - Justification",
      input: ["justify-start", "justify-between"],
      expected: "justify-between",
    },

    // 5. Conflits de couleurs standard et tokens shadcn/ui
    {
      category: "Color - Couleurs standard Tailwind",
      input: ["bg-red-500", "bg-blue-500"],
      expected: "bg-blue-500",
    },
    {
      category: "Color - Tokens sémantiques shadcn (primary -> destructive)",
      input: ["bg-primary", "bg-destructive"],
      expected: "bg-destructive",
    },
    {
      category: "Color - Tokens sémantiques de texte",
      input: ["text-primary", "text-muted-foreground"],
      expected: "text-muted-foreground",
    },
    {
      category: "Color - Tokens sémantiques de bordure",
      input: ["border-input", "border-destructive"],
      expected: "border-destructive",
    },
    {
      category: "Color - Non-conflit entre propriété de texte et de fond",
      input: ["bg-primary", "text-white"],
      expected: "bg-primary text-white",
    },

    // 6. Typographie
    {
      category: "Typography - Taille de police",
      input: ["text-sm", "text-lg"],
      expected: "text-lg",
    },
    {
      category: "Typography - Graisse de police",
      input: ["font-normal", "font-bold"],
      expected: "font-bold",
    },
    {
      category: "Typography - Hauteur de ligne",
      input: ["leading-none", "leading-relaxed"],
      expected: "leading-relaxed",
    },
    {
      category: "Typography - Alignement de texte",
      input: ["text-left", "text-center"],
      expected: "text-center",
    },

    // 7. Arrondis et Bordures
    {
      category: "Border Radius - Remplacement d'arrondi",
      input: ["rounded-sm", "rounded-lg"],
      expected: "rounded-lg",
    },
    {
      category: "Border Radius - Suppression d'arrondi",
      input: ["rounded-md", "rounded-none"],
      expected: "rounded-none",
    },
    {
      category: "Border Width - Épaisseur de bordure",
      input: ["border", "border-2"],
      expected: "border-2",
    },

    // 8. Modificateurs pseudo-classes et responsive
    {
      category: "Modifiers - Conflit au sein d'un même état hover:",
      input: ["hover:bg-red-500", "hover:bg-blue-500"],
      expected: "hover:bg-blue-500",
    },
    {
      category: "Modifiers - Indépendance entre état par défaut et hover:",
      input: ["bg-blue-500", "hover:bg-red-500"],
      expected: "bg-blue-500 hover:bg-red-500",
    },
    {
      category: "Modifiers - Conflit au sein du même breakpoint md:",
      input: ["md:p-2", "md:p-6"],
      expected: "md:p-6",
    },
    {
      category: "Modifiers - Indépendance base et breakpoint responsive",
      input: ["p-2", "md:p-6"],
      expected: "p-2 md:p-6",
    },
    {
      category: "Modifiers - Focus visible",
      input: ["focus-visible:ring-2", "focus-visible:ring-4"],
      expected: "focus-visible:ring-4",
    },

    // 9. Valeurs conditionnelles et structures complexes
    {
      category: "Conditions - Filtrage des valeurs falsy (false, null, undefined)",
      input: ["base-class", false && "ignored", null, undefined, "active-class"],
      expected: "base-class active-class",
    },
    {
      category: "Arrays - Tableaux imbriqués avec conflit",
      input: [["p-2", "m-2"], ["p-4"]],
      expected: "m-2 p-4",
    },
    {
      category: "Objects - Notation objet booléen",
      input: [{ "p-2": false, "p-4": true }],
      expected: "p-4",
    },
    {
      category: "Edge Cases - Appel sans argument",
      input: [],
      expected: "",
    },
  ];

  let passedAssertions = 0;
  for (const { category, input, expected } of testCases) {
    const actual = cn(...input);
    assert.strictEqual(
      actual,
      expected,
      `[Échec] ${category} -> Reçu: "${actual}" | Attendu: "${expected}"`
    );
    passedAssertions++;
  }

  console.log(`  ✓ ${passedAssertions}/${testCases.length} cas de conflits validés avec succès.`);
  return { name: "T5.1 Precedence cn()", passed: true, total: passedAssertions };
}

// Exécution directe avec Node / tsx
if (process.argv[1] && process.argv[1].endsWith("test-01-cn-precedence.mjs")) {
  runTest()
    .then(() => {
      console.log("✅ SUCCÈS : Tous les tests adversariaux de cn() sont passés.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
