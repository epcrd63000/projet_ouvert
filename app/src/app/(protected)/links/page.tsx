import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { LinksClient } from "@/components/links/LinksClient";
import { Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Liens Utiles | Projet Ouvert IMT",
  description: "Ressources, dossiers partagés et liens rapides du projet.",
};

/**
 * Page serveur pour les Liens Utiles du projet.
 */
export default async function LinksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  const links = await prisma.projectLink.findMany({
    orderBy: [
      { isPinned: "desc" },
      { order: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Link2 className="w-8 h-8 text-primary" />
            Liens Utiles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Accès rapide aux ressources partagées du voilier MINIMOCA (Google Drive, dépôts Git, datasheets, outils).
          </p>
        </div>
      </div>

      <LinksClient initialLinks={links as any} isAdmin={isAdmin} />
    </div>
  );
}
