"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CustomColors = {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
};

const defaultColors: CustomColors = {
  background: "",
  foreground: "",
  primary: "",
  primaryForeground: "",
};

interface CustomThemeContextType {
  colors: CustomColors;
  setColors: (colors: CustomColors) => void;
  resetColors: () => void;
}

const CustomThemeContext = createContext<CustomThemeContextType>({
  colors: defaultColors,
  setColors: () => {},
  resetColors: () => {},
});

export const useCustomTheme = () => useContext(CustomThemeContext);

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColorsState] = useState<CustomColors>(defaultColors);

  useEffect(() => {
    // Charger depuis le localStorage au montage
    const saved = localStorage.getItem("imt-custom-theme");
    if (saved) {
      try {
        setColorsState(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const setColors = (newColors: CustomColors) => {
    setColorsState(newColors);
    localStorage.setItem("imt-custom-theme", JSON.stringify(newColors));
  };

  const resetColors = () => {
    setColorsState(defaultColors);
    localStorage.removeItem("imt-custom-theme");
  };

  // Injecter les CSS variables dans un style tag
  const css = `
    :root {
      ${colors.background ? `--background: ${colors.background};` : ""}
      ${colors.foreground ? `--foreground: ${colors.foreground};` : ""}
      ${colors.primary ? `--primary: ${colors.primary};` : ""}
      ${colors.primaryForeground ? `--primary-foreground: ${colors.primaryForeground};` : ""}
    }
    
    .dark {
      ${colors.background ? `--background: ${colors.background};` : ""}
      ${colors.foreground ? `--foreground: ${colors.foreground};` : ""}
      ${colors.primary ? `--primary: ${colors.primary};` : ""}
      ${colors.primaryForeground ? `--primary-foreground: ${colors.primaryForeground};` : ""}
    }
  `;

  return (
    <CustomThemeContext.Provider value={{ colors, setColors, resetColors }}>
      {/* On injecte seulement si des couleurs sont définies */}
      {(colors.background || colors.primary) && (
        <style dangerouslySetInnerHTML={{ __html: css }} />
      )}
      {children}
    </CustomThemeContext.Provider>
  );
}
