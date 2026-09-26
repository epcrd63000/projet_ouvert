import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { ThemeSettings } from "@/components/theme/ThemeSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { role: "asc" }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres Administrateur</h1>
        <p className="text-muted-foreground">
          Gérez l&apos;équipe et les paramètres du projet.
        </p>
      </div>

      <ThemeSettings />

      <Card>
        <CardHeader>
          <CardTitle>Membres de l&apos;équipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                    </td>
                    <td className="p-3">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
