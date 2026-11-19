"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Enveloppe globale pour les fournisseurs de contexte client.
 * Combine SessionProvider (NextAuth) et ThemeProvider (clair / sombre / système).
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
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}
