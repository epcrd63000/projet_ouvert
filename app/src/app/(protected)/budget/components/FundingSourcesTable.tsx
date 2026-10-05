"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, Ban, CheckCircle2, Plus, Pencil } from "lucide-react";
import { FundingSource, FundingStatus } from "./types";
import CommentDialog from "./CommentDialog";
import EditFundingModal from "./EditFundingModal";

interface FundingSourcesTableProps {
  sources: FundingSource[];
  isAdmin: boolean;
  onUpdateSource: (id: string, updates: Partial<FundingSource>) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
}

/**
 * Tableau listant les financements ("quel argent on a") avec gestion d'annulation et commentaires.
 */
export default function FundingSourcesTable({
  sources,
  isAdmin,
  onUpdateSource,
  onDeleteSource,
  onOpenAddModal,
}: FundingSourcesTableProps) {
  const [commentTarget, setCommentTarget] = useState<FundingSource | null>(null);
  const [editingSource, setEditingSource] = useState<FundingSource | null>(null);

  const handleToggleCancel = async (source: FundingSource) => {
    const newStatus: FundingStatus = source.status === "CANCELLED" ? "RECEIVED" : "CANCELLED";
    await onUpdateSource(source.id, { status: newStatus });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold">Ressources &amp; Financements (&quot;L&apos;argent qu&apos;on a&quot;)</h3>
          <p className="text-xs text-muted-foreground">
            Dotations, sponsors, subventions et apports partenaires qui alimentent le budget.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={onOpenAddModal} className="gap-1.5">
            <Plus className="h-4 w-4" /> Ajouter un Financement
          </Button>
        )}
      </div>

      <div className="border rounded-md overflow-x-auto bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground whitespace-nowrap">
            <tr>
              <th className="p-3">Source / Partenaire</th>
              <th className="p-3">Montant Alloué</th>
              <th className="p-3">Date</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Commentaire</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Aucun financement enregistré pour l&apos;instant.
                </td>
              </tr>
            ) : (
              sources.map((source) => {
                const isCancelled = source.status === "CANCELLED";

                return (
                  <tr
                    key={source.id}
                    className={`border-t transition-colors ${
                      isCancelled ? "bg-muted/40 opacity-60 line-through text-muted-foreground" : "hover:bg-muted/10"
                    }`}
                  >
                    <td className="p-3 font-semibold">{source.name}</td>
                    <td className="p-3 font-mono font-medium">
                      {Number(source.amount).toFixed(2)} €
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {format(new Date(source.date), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="p-3">
                      {isAdmin ? (
                        <select
                          value={source.status}
                          onChange={(e) => onUpdateSource(source.id, { status: e.target.value as FundingStatus })}
                          className="p-1 rounded bg-background border text-xs"
                        >
                          <option value="RECEIVED">Encaissé</option>
                          <option value="PENDING">Attendu</option>
                          <option value="CANCELLED">Annulé</option>
                        </select>
                      ) : (
                        <Badge
                          variant={
                            source.status === "RECEIVED"
                              ? "default"
                              : source.status === "PENDING"
                              ? "outline"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {source.status === "RECEIVED" ? "Encaissé" : source.status === "PENDING" ? "Attendu" : "Annulé"}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs" title={source.comment || "Aucun commentaire"}>
                          {source.comment || <span className="italic text-muted-foreground">Aucun</span>}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => setCommentTarget(source)}
                          title="Modifier le commentaire"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSource(source)}
                            title="Modifier ce financement"
                            className="text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCancel(source)}
                            title={isCancelled ? "Réactiver ce financement" : "Annuler ce financement"}
                            className={isCancelled ? "text-emerald-600 hover:text-emerald-700" : "text-amber-600 hover:text-amber-700"}
                          >
                            {isCancelled ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteSource(source.id)}
                            className="text-destructive hover:bg-destructive/10"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {commentTarget && (
        <CommentDialog
          isOpen={Boolean(commentTarget)}
          title={`Commentaire — ${commentTarget.name}`}
          initialComment={commentTarget.comment || ""}
          onClose={() => setCommentTarget(null)}
          onSave={async (newComment) => {
            await onUpdateSource(commentTarget.id, { comment: newComment });
          }}
        />
      )}

      {editingSource && (
        <EditFundingModal
          source={editingSource}
          isOpen={Boolean(editingSource)}
          onClose={() => setEditingSource(null)}
          onSaved={async (id, updates) => {
            await onUpdateSource(id, updates);
          }}
        />
      )}
    </div>
  );
}
