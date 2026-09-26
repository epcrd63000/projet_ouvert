import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine et fusionne proprement les classes CSS Tailwind conditionnelles.
 * clsx évalue les expressions logiques et aplatit les tableaux,
 * puis twMerge élimine les conflits de spécificité CSS Tailwind.
 *
 * @param inputs - Liste d'arguments de classes (chaînes, conditions, tableaux).
 * @returns La chaîne de classes CSS unifiée et sans doublons.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
