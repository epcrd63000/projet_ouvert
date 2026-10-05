"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ShieldCheck, Globe } from "lucide-react";
import { extractUserPseudo } from "@/lib/auth/credentialsLogic";
import { UserCredentialRow } from "./UserCredentialRow";

export interface UserCredentialItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  tempPassword: string | null;
}

/**
 * Panneau d'administration des identifiants et des accès réservé à Étienne.
 * Permet de visualiser, copier, régénérer les mots de passe et préparer l'envoi d'invitations.
 */
export function EtienneCredentialsPanel({
  initialUsers,
}: {
  initialUsers: UserCredentialItem[];
}) {
  const [users, setUsers] = useState<UserCredentialItem[]>(initialUsers);
  const [appUrl, setAppUrl] = useState("http://localhost:3000");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Voulez-vous générer un nouveau mot de passe temporaire pour ce membre ?")) {
      return;
    }

    setLoadingUserId(userId);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la réinitialisation");
        return;
      }

      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, tempPassword: data.newPassword } : u))
      );
      setRevealedPasswords((prev) => ({ ...prev, [userId]: true }));
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setLoadingUserId(null);
    }
  };

  const copyFullSummary = () => {
    const lines = users.map((u) => {
      const pseudo = extractUserPseudo(u.name);
      const pwd = u.tempPassword || "(Personnalisé)";
      return `${u.name} | Login: ${pseudo} | MDP: ${pwd} | Email: ${u.email}`;
    });
    handleCopy(lines.join("\n"), "summary");
  };

  return (
    <Card className="border-primary/30 shadow-md">
      <CardHeader className="bg-primary/5 border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Espace Accès & Identifiants (Réservé à Étienne)</CardTitle>
            </div>
            <CardDescription>
              Générez, consultez et partagez les accès de connexion par email officiel avec vos camarades.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyFullSummary}
            className="flex items-center gap-2 shrink-0"
          >
            {copiedKey === "summary" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copiedKey === "summary" ? "Copié !" : "Copier le récapitulatif"}
          </Button>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Globe className="h-3.5 w-3.5" />
            <span>Lien de l&apos;application dans les emails :</span>
          </div>
          <Input
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            className="h-8 text-xs font-mono max-w-sm"
            placeholder="https://..."
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border">
        {users.map((user) => (
          <UserCredentialRow
            key={user.id}
            user={user}
            appUrl={appUrl}
            isRevealed={!!revealedPasswords[user.id]}
            copiedKey={copiedKey}
            isLoadingReset={loadingUserId === user.id}
            onCopy={handleCopy}
            onToggleReveal={toggleReveal}
            onResetPassword={handleResetPassword}
          />
        ))}
      </CardContent>
    </Card>
  );
}
