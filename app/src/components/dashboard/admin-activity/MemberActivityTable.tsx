"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MemberActivityData } from "@/lib/dashboard/adminActivityMetrics";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface MemberActivityTableProps {
  data: MemberActivityData[];
}

/**
 * Tableau récapitulatif détaillé du suivi hebdomadaire de chaque étudiant.
 */
export function MemberActivityTable({ data }: MemberActivityTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-base" title="1er Contributeur">🥇</span>;
    if (index === 1) return <span className="text-base" title="2e Contributeur">🥈</span>;
    if (index === 2) return <span className="text-base" title="3e Contributeur">🥉</span>;
    return <span className="text-xs font-semibold text-muted-foreground w-5 text-center">#{index + 1}</span>;
  };

  const getStatusBadge = (status: MemberActivityData["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
            Actif
          </Badge>
        );
      case "MODERATE":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
            Modéré
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-xs font-medium">
            Inactif
          </Badge>
        );
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-semibold">
          Détail de l&apos;Engagement par Membre
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Synthèse détaillée des visites actives et contributions individuelles sur la période sélectionnée.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2.5 px-3 font-medium w-12 text-center">Rang</th>
                <th className="py-2.5 px-3 font-medium">Étudiant</th>
                <th className="py-2.5 px-3 font-medium text-center">Statut</th>
                <th className="py-2.5 px-3 font-medium text-center">Visites</th>
                <th className="py-2.5 px-3 font-medium text-center">Actions</th>
                <th className="py-2.5 px-3 font-medium text-center">Total</th>
                <th className="py-2.5 px-3 font-medium text-right">Dernière activité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.map((member, index) => (
                <tr key={member.userId} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center">
                      {getRankBadge(index)}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{member.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {getStatusBadge(member.status)}
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-blue-600 dark:text-blue-400">
                    {member.visitsCount}
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-emerald-600 dark:text-emerald-400">
                    {member.actionsCount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="secondary" className="font-bold text-xs px-2.5">
                      {member.totalActivity}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-muted-foreground">
                    {member.lastActiveDate ? (
                      formatDistanceToNow(new Date(member.lastActiveDate), {
                        addSuffix: true,
                        locale: fr,
                      })
                    ) : (
                      <span className="text-muted-foreground/60 italic">Aucune sur la période</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
