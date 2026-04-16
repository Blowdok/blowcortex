// Helper de fusion de classes Tailwind utilisé par tous les composants shadcn.

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes conditionnelles avec déduplication des utilitaires Tailwind.
 * Convention shadcn/ui standard.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
