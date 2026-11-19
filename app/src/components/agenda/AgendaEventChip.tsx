"use client";

import React from "react";

interface AgendaEventChipProps {
  title?: string;
}

/**
 * Contenu d'une pastille du calendrier : une seule ligne, tronquée proprement,
 * avec le titre complet en infobulle native.
 */
export function AgendaEventChip({ title }: AgendaEventChipProps) {
  return (
    <span className="block truncate" title={title}>
      {title}
    </span>
  );
}
