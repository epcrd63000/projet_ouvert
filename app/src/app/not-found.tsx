import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Page d'erreur 404 (Ressource non trouvée).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <span className="mb-2 text-6xl font-extrabold text-primary">404</span>
      <h2 className="text-2xl font-bold tracking-tight">Page introuvable</h2>
      <p className="mt-2 mb-6 max-w-md text-muted-foreground">
        La ressource que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Button asChild>
        <Link href="/login">Retourner à la connexion</Link>
      </Button>
    </div>
  );
}
