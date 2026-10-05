"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Mail, RefreshCw, Check } from "lucide-react";
import {
  extractUserPseudo,
  buildMailtoUrl,
  buildInvitationEmailBody,
} from "@/lib/auth/credentialsLogic";
import type { UserCredentialItem } from "./EtienneCredentialsPanel";

interface UserCredentialRowProps {
  user: UserCredentialItem;
  appUrl: string;
  isRevealed: boolean;
  copiedKey: string | null;
  isLoadingReset: boolean;
  onCopy: (text: string, key: string) => void;
  onToggleReveal: (userId: string) => void;
  onResetPassword: (userId: string) => void;
}

/**
 * Ligne individuelle affichant les identifiants d'un étudiant et les actions d'envoi.
 * Permet l'ouverture du mail dans un nouvel onglet, la copie directe du message, et la régénération de mot de passe.
 */
export function UserCredentialRow({
  user,
  appUrl,
  isRevealed,
  copiedKey,
  isLoadingReset,
  onCopy,
  onToggleReveal,
  onResetPassword,
}: UserCredentialRowProps) {
  const pseudo = extractUserPseudo(user.name);

  // Construction de l'URL mailto pour l'envoi direct par le client de messagerie
  const mailto = buildMailtoUrl(
    {
      name: user.name,
      email: user.email,
      pseudo,
      tempPassword: user.tempPassword || undefined,
    },
    appUrl
  );

  // Construction du corps de texte pour la copie directe dans le presse-papier
  const handleCopyEmailText = () => {
    const emailBody = buildInvitationEmailBody(
      {
        name: user.name,
        pseudo,
        tempPassword: user.tempPassword || undefined,
      },
      appUrl
    );
    onCopy(emailBody, `mailtext-${user.id}`);
  };

  return (
    <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Informations de base de l'étudiant */}
      <div className="space-y-1 min-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">{user.name}</span>
          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">
            {user.role}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </div>

      {/* Badges d'accès : Identifiant & Mot de passe temporaire */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs">
          <span className="text-muted-foreground">Login :</span>
          <span className="font-mono font-bold text-foreground">{pseudo}</span>
          <button
            onClick={() => onCopy(pseudo, `pseudo-${user.id}`)}
            className="ml-1 text-muted-foreground hover:text-foreground"
            title="Copier l'identifiant"
            type="button"
          >
            {copiedKey === `pseudo-${user.id}` ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
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
                onClick={() => onToggleReveal(user.id)}
                className="ml-1 text-muted-foreground hover:text-foreground"
                type="button"
                title={isRevealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                onClick={() => onCopy(user.tempPassword!, `pwd-${user.id}`)}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
                title="Copier le mot de passe"
                type="button"
              >
                {copiedKey === `pwd-${user.id}` ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </>
          ) : (
            <span className="text-muted-foreground italic">Personnalisé</span>
          )}
          <button
            onClick={() => onResetPassword(user.id)}
            disabled={isLoadingReset}
            className="ml-1 text-primary hover:text-primary/80 disabled:opacity-50"
            title="Régénérer un mot de passe temporaire aléatoire"
            type="button"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingReset ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Actions de partage : Envoi par mail (nouvel onglet) et Copie du texte */}
      <div className="flex items-center gap-2 self-end lg:self-center">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleCopyEmailText}
          title="Copier l'intégralité du mail d'invitation pour le coller dans WhatsApp ou Teams"
          type="button"
        >
          {copiedKey === `mailtext-${user.id}` ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copiedKey === `mailtext-${user.id}` ? "Copié !" : "Copier le texte"}
        </Button>

        <a
          href={mailto}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
          title="Ouvrir le client mail dans un nouvel onglet avec les identifiants pré-remplis"
        >
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5 text-primary" />
            Envoyer par mail
          </Button>
        </a>
      </div>
    </div>
  );
}
