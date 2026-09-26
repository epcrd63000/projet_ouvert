"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Frontière d'erreur globale pour intercepter les exceptions d'exécution.
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Journalisation de l'erreur dans la console client
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-2 text-2xl font-bold text-destructive">
        Une erreur inattendue est survenue
      </h2>
      <p className="mt-2 mb-6 max-w-md text-sm text-muted-foreground">
        Une anomalie a été interceptée par le système. Vous pouvez tenter de
        réinitialiser le composant.
      </p>
      <Button onClick={() => reset()} variant="outline">
        Réessayer
      </Button>
    </div>
  );
}
