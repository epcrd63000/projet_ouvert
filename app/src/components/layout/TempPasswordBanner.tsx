import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound } from "lucide-react";

/**
 * Bandeau d'information affiché aux membres qui utilisent encore un mot de passe
 * temporaire distribué par l'administrateur.
 *
 * Objectif : les inciter à personnaliser leur mot de passe avant l'échéance, sachant
 * qu'une fois personnalisé, l'administrateur n'y a plus accès.
 */
export async function TempPasswordBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tempPasswordExpiresAt: true },
  });

  if (!user?.tempPasswordExpiresAt) return null;

  const expiresAt = user.tempPasswordExpiresAt;
  const formatted = expiresAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const isExpired = expiresAt.getTime() < Date.now();

  return (
    <Alert
      variant={isExpired ? "destructive" : "default"}
      className="mb-4 border-primary/40 bg-primary/5"
    >
      <KeyRound className="h-4 w-4" />
      <AlertTitle className="text-sm">
        {isExpired ? "Mot de passe temporaire expiré" : "Vous utilisez un mot de passe temporaire"}
      </AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground">
        {isExpired
          ? `Votre mot de passe temporaire a expiré le ${formatted}. `
          : `Il reste valable jusqu'au ${formatted}. `}
        Personnalisez-le dès maintenant dans{" "}
        <Link href="/settings" className="font-medium text-primary underline underline-offset-2">
          Paramètres → Changer le mot de passe
        </Link>
        . Une fois personnalisé, votre mot de passe n&apos;est plus visible par l&apos;administrateur.
      </AlertDescription>
    </Alert>
  );
}
