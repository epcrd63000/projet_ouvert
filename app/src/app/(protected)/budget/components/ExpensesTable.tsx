"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, Ban, CheckCircle2, Plus, Download } from "lucide-react";
import { BudgetEntry, BudgetStatus, FundingSource } from "./types";
import CommentDialog from "./CommentDialog";

interface ExpensesTableProps {
  entries: BudgetEntry[];
  fundingSources: FundingSource[];
  isAdmin: boolean;
  onUpdateEntry: (id: string, updates: Partial<BudgetEntry>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
  onExportCsv: () => void;
}

/**
 * Tableau des dépenses enrichi : rattachement aux enveloppes, statut 'Annulé', commentaires éditables.
 */
export default function ExpensesTable({
  entries,
  fundingSources,
  isAdmin,
  onUpdateEntry,
  onDeleteEntry,
  onOpenAddModal,
  onExportCsv,
}: ExpensesTableProps) {
  const [commentTarget, setCommentTarget] = useState<BudgetEntry | null>(null);

  const handleToggleCancel = async (entry: BudgetEntry) => {
    const newStatus: BudgetStatus = entry.status === "CANCELLED" ? "PAID" : "CANCELLED";
    await onUpdateEntry(entry.id, { status: newStatus });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h3 className="text-base font-semibold">Dépenses & Achats du Projet</h3>
          <p className="text-xs text-muted-foreground">
            Suivi des commandes, pièces et fournitures du voilier MINIMOCA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onOpenAddModal} className="gap-1.5">
            <Plus className="h-4 w-4" /> Ajouter une Dépense
          </Button>
          <Button size="sm" variant="outline" onClick={onExportCsv} className="gap-1.5">
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground whitespace-nowrap">
            <tr>
              <th className="p-3">Libellé</th>
              <th className="p-3">Qté</th>
              <th className="p-3">Prix U.</th>
              <th className="p-3">Port</th>
              <th className="p-3">Montant Total</th>
              <th className="p-3">Date</th>
              <th className="p-3">Enveloppe</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Commentaire</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-muted-foreground">
                  Aucune dépense enregistrée.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isCancelled = entry.status === "CANCELLED";

                return (
                  <tr
                    key={entry.id}
                    className={`border-t transition-colors ${
                      isCancelled
                        ? "bg-muted/40 opacity-60 line-through text-muted-foreground"
                        : "hover:bg-muted/10"
                    }`}
                  >
                    <td className="p-3 font-medium max-w-[200px] truncate" title={entry.label}>
                      {entry.label}
                    </td>
                    <td className="p-3">{entry.quantity ?? "-"}</td>
                    <td className="p-3 whitespace-nowrap">
                      {entry.unitPrice != null ? Number(entry.unitPrice).toFixed(2) + " €" : "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {entry.deliveryCost != null ? Number(entry.deliveryCost).toFixed(2) + " €" : "-"}
                    </td>
                    <td className="p-3 font-semibold whitespace-nowrap font-mono">
                      {Number(entry.amount).toFixed(2)} €
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {format(new Date(entry.date), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="p-3">
                      {isAdmin ? (
                        <select
                          value={entry.fundingSourceId || ""}
                          onChange={(e) =>
                            onUpdateEntry(entry.id, {
                              fundingSourceId: e.target.value || null,
                            })
                          }
                          className="p-1 rounded bg-background border text-xs max-w-[120px] truncate"
                        >
                          <option value="">Non affectée</option>
                          {fundingSources.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-medium">
                          {entry.fundingSource?.name || <span className="italic text-muted-foreground">-</span>}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs">{entry.category}</td>
                    <td className="p-3">
                      <select
                        value={entry.status}
                        onChange={(e) =>
                          onUpdateEntry(entry.id, { status: e.target.value as BudgetStatus })
                        }
                        className="p-1 rounded bg-background border text-xs"
                      >
                        <option value="PLANNED">Planifié</option>
                        <option value="VALIDATED">Validé</option>
                        <option value="PAID">Payé</option>
                        <option value="CANCELLED">Annulé</option>
                      </select>
                    </td>
                    <td className="p-3 max-w-[180px]">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs" title={entry.comment || "Aucun commentaire"}>
                          {entry.comment || <span className="italic text-muted-foreground">Aucun</span>}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => setCommentTarget(entry)}
                          title="Modifier le commentaire"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCancel(entry)}
                          title={isCancelled ? "Réactiver cette dépense" : "Annuler cette dépense"}
                          className={
                            isCancelled
                              ? "text-emerald-600 hover:text-emerald-700"
                              : "text-amber-600 hover:text-amber-700"
                          }
                        >
                          {isCancelled ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
          title={`Commentaire — ${commentTarget.label}`}
          initialComment={commentTarget.comment || ""}
          onClose={() => setCommentTarget(null)}
          onSave={async (newComment) => {
            await onUpdateEntry(commentTarget.id, { comment: newComment });
          }}
        />
      )}
    </div>
  );
}
