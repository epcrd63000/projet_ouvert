import React from "react";

/**
 * Composant de chargement global pour les transitions de page App Router.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Chargement en cours...</p>
    </div>
  );
}
