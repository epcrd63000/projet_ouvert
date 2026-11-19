"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sélecteur d'apparence : clair, sombre ou automatique (système).
 * Les deux palettes sont dérivées du logo MIN'IMOCA.
 */
const OPTIONS = [
  { value: "light", label: "Clair", description: "Crème & bleu marine", icon: Sun },
  { value: "dark", label: "Sombre", description: "Nuit en mer", icon: Moon },
  { value: "system", label: "Système", description: "Suit l'appareil", icon: Monitor },
] as const;

/** Échantillon des couleurs du logo, pour rappeler l'origine de la palette. */
const PALETTE = [
  { className: "bg-brand-navy", label: "Bleu marine" },
  { className: "bg-brand-red", label: "Rouge coque" },
  { className: "bg-brand-sky", label: "Bleu océan" },
  { className: "bg-brand-cream", label: "Crème" },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Évite un décalage d'hydratation : le thème n'est connu que côté client.
  useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apparence</CardTitle>
        <CardDescription>
          Choisissez le mode clair ou sombre. Les deux palettes reprennent les couleurs du logo
          MIN&apos;IMOCA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = mounted && theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={isActive}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
                {isActive && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Palette du logo :</span>
          <div className="flex items-center gap-1.5">
            {PALETTE.map((color) => (
              <span
                key={color.label}
                title={color.label}
                className={cn("h-4 w-4 rounded-full ring-1 ring-border", color.className)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
