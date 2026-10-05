"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { TeamMember } from "./MeetingDecisionsCard";

interface DecisionAssigneeSelectorProps {
  users: TeamMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Sélecteur multi-membres pour les décisions et actions de réunion.
 * Permet d'affecter simultanément un binôme ou un groupe (ex: Liam, Hugo et Solal).
 */
export function DecisionAssigneeSelector({
  users,
  selectedIds,
  onChange,
}: DecisionAssigneeSelectorProps) {
  const toggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Assignation (sélection multiple) :</span>
        <span className="font-medium">
          {selectedIds.length === 0
            ? "Aucun membre"
            : `${selectedIds.length} assigné${selectedIds.length > 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {users.map((u) => {
          const isSelected = selectedIds.includes(u.id);
          return (
            <Button
              key={u.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggle(u.id)}
              className="h-7 text-xs px-2 gap-1"
            >
              {isSelected && <Check className="h-3 w-3" />}
              <span>{u.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
