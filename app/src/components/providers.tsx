"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { CustomThemeProvider } from "./theme/CustomThemeProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Enveloppe globale pour les fournisseurs de contexte client.
 * Combine SessionProvider (NextAuth) et ThemeProvider (dark/light) ainsi que CustomThemeProvider.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CustomThemeProvider>
          {children}
        </CustomThemeProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
