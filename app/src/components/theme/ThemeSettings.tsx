"use client";

import React from "react";
import { useCustomTheme } from "@/components/theme/CustomThemeProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const THEMES = [
  {
    name: "Défaut (Zinc)",
    colors: { background: "", foreground: "", primary: "", primaryForeground: "" }
  },
  {
    name: "Océan",
    colors: {
      background: "220 50% 98%",
      foreground: "220 50% 10%",
      primary: "210 100% 50%",
      primaryForeground: "210 100% 98%"
    }
  },
  {
    name: "Forêt",
    colors: {
      background: "120 20% 98%",
      foreground: "120 20% 10%",
      primary: "140 70% 40%",
      primaryForeground: "140 70% 98%"
    }
  },
  {
    name: "Crépuscule",
    colors: {
      background: "280 40% 98%",
      foreground: "280 40% 10%",
      primary: "270 70% 50%",
      primaryForeground: "270 70% 98%"
    }
  }
];

export function ThemeSettings() {
  const { setColors, resetColors } = useCustomTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apparence & Thèmes</CardTitle>
        <CardDescription>
          Personnalisez les couleurs de base de l&apos;application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 flex-wrap">
          {THEMES.map((theme) => (
            <Button
              key={theme.name}
              variant="outline"
              onClick={() => {
                if (theme.name === "Défaut (Zinc)") {
                  resetColors();
                } else {
                  setColors(theme.colors);
                }
              }}
              className="w-32"
            >
              {theme.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
