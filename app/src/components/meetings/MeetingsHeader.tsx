"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Users as UsersIcon, Plus, Download } from "lucide-react";

interface MeetingsHeaderProps {
  selectedCount: number;
  isExporting: boolean;
  onBatchExport: () => void;
  onOpenCreateModal: () => void;
}

export function MeetingsHeader({
  selectedCount,
  isExporting,
  onBatchExport,
  onOpenCreateModal,
}: MeetingsHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Réunions</h1>
          <p className="text-muted-foreground">Planification, ordre du jour, émargement et comptes rendus</p>
        </div>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        {selectedCount > 0 && (
          <Button onClick={onBatchExport} variant="secondary" disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? "Création ZIP..." : `Exporter ${selectedCount} compte(s) rendu(s)`}
          </Button>
        )}
        <Button onClick={onOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle réunion
        </Button>
      </div>
    </div>
  );
}
