"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Mail, RefreshCw, Check, ShieldCheck, Globe } from "lucide-react";
import { extractUserPseudo, buildMailtoUrl } from "@/lib/auth/credentialsLogic";

export interface UserCredentialItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  tempPassword: string | null;
}

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
              Générez, consultez et partagez les accès de connexion par email officiel avec vos amis.
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
        {users.map((user) => {
          const pseudo = extractUserPseudo(user.name);
          const isRevealed = !!revealedPasswords[user.id];
          const mailto = buildMailtoUrl(
            {
              name: user.name,
              email: user.email,
              pseudo,
              tempPassword: user.tempPassword || undefined,
            },
            appUrl
          );

          return (
            <div key={user.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">{user.name}</span>
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">
                    {user.role}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs">
                  <span className="text-muted-foreground">Login :</span>
                  <span className="font-mono font-bold text-foreground">{pseudo}</span>
                  <button
                    onClick={() => handleCopy(pseudo, `pseudo-${user.id}`)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    title="Copier l'identifiant"
                  >
                    {copiedKey === `pseudo-${user.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs">
                  <span className="text-muted-foreground">MDP :</span>
                  {user.tempPassword ? (
                    <>
                      <span className="font-mono font-semibold text-foreground">
                        {isRevealed ? user.tempPassword : "••••••••••"}
                      </span>
                      <button
                        onClick={() => toggleReveal(user.id)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => handleCopy(user.tempPassword!, `pwd-${user.id}`)}
                        className="ml-0.5 text-muted-foreground hover:text-foreground"
                        title="Copier le mot de passe"
                      >
                        {copiedKey === `pwd-${user.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Personnalisé</span>
                  )}
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    disabled={loadingUserId === user.id}
                    className="ml-1 text-primary hover:text-primary/80"
                    title="Régénérer un mot de passe aléatoire"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingUserId === user.id ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-center">
                <a href={mailto} className="inline-block">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Envoyer par mail
                  </Button>
                </a>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
