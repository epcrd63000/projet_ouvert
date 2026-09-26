/**
 * Test empirique de validation des primitives UI et résolution des imports.
 * Valide l'importation via l'alias '@/...' et le rendu SSR de chaque primitive.
 */

import React from "react";
import ReactDOMServer from "react-dom/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

interface TestReport {
  name: string;
  success: boolean;
  errorMessage?: string;
}

export function runEmpiricalPrimitiveSuite(): TestReport[] {
  const reports: TestReport[] = [];

  // 1. Bouton et variantes
  try {
    const defaultClasses = buttonVariants();
    const destructiveClasses = buttonVariants({ variant: "destructive" });
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Button, { variant: "destructive", size: "sm" }, "Supprimer")
    );
    reports.push({
      name: "Button Primitives & Variants",
      success:
        html.includes("bg-destructive") &&
        html.includes("Supprimer") &&
        defaultClasses.includes("bg-primary") &&
        destructiveClasses.includes("bg-destructive"),
    });
  } catch (err: unknown) {
    reports.push({ name: "Button Primitives", success: false, errorMessage: String(err) });
  }

  // 2. Champ Input
  try {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Input, { type: "email", placeholder: "etienne@imt.fr", disabled: true })
    );
    reports.push({
      name: "Input Primitive Component",
      success: html.includes('type="email"') && html.includes("disabled"),
    });
  } catch (err: unknown) {
    reports.push({ name: "Input Primitive", success: false, errorMessage: String(err) });
  }

  // 3. Famille Card complète
  try {
    const cardEl = React.createElement(
      Card,
      { className: "shadow-card" },
      React.createElement(CardHeader, null, React.createElement(CardTitle, null, "Jalon")),
      React.createElement(CardContent, null, "Contenu"),
      React.createElement(CardFooter, null, "Actions")
    );
    const html = ReactDOMServer.renderToStaticMarkup(cardEl);
    reports.push({
      name: "Card Primitives Family",
      success: html.includes("shadow-card") && html.includes("Jalon") && html.includes("Actions"),
    });
  } catch (err: unknown) {
    reports.push({ name: "Card Primitives", success: false, errorMessage: String(err) });
  }

  // 4. Composant Label
  try {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Label, { htmlFor: "login-email" }, "Courriel")
    );
    reports.push({
      name: "Label Primitive Component",
      success: html.includes('for="login-email"') && html.includes("Courriel"),
    });
  } catch (err: unknown) {
    reports.push({ name: "Label Primitive", success: false, errorMessage: String(err) });
  }

  // 5. Famille Alert complète
  try {
    const alertEl = React.createElement(
      Alert,
      { variant: "destructive" },
      React.createElement(AlertTitle, null, "Erreur"),
      React.createElement(AlertDescription, null, "Identifiants invalides")
    );
    const html = ReactDOMServer.renderToStaticMarkup(alertEl);
    reports.push({
      name: "Alert Primitives Family",
      success: html.includes('role="alert"') && html.includes("border-destructive"),
    });
  } catch (err: unknown) {
    reports.push({ name: "Alert Primitives", success: false, errorMessage: String(err) });
  }

  // 6. Badge et variantes
  try {
    const defaultClasses = badgeVariants();
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Badge, { variant: "outline" }, "ADMIN")
    );
    reports.push({
      name: "Badge Primitive & Variants",
      success: html.includes("ADMIN") && defaultClasses.includes("bg-primary"),
    });
  } catch (err: unknown) {
    reports.push({ name: "Badge Primitive", success: false, errorMessage: String(err) });
  }

  // 7. Utilitaire cn()
  const merged = cn("px-2 py-1", "px-4", false && "hidden", null, undefined);
  reports.push({ name: "Utility cn() Logic", success: merged === "py-1 px-4" });

  // 8. Fournisseur Providers
  reports.push({ name: "Providers Wrapper Export", success: typeof Providers === "function" });

  return reports;
}

const suiteResults = runEmpiricalPrimitiveSuite();
const hasFailure = suiteResults.some((r) => !r.success);

for (const item of suiteResults) {
  if (item.success) {
    console.log(`[PASS] ${item.name}`);
  } else {
    console.error(`[FAIL] ${item.name}: ${item.errorMessage || "Failed"}`);
  }
}

process.exit(hasFailure ? 1 : 0);
