import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 🛠️ Utility to merge tailwind classes with clsx and tailwind-merge.
 * Ensures that tailwind classes are correctly applied and overridden.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
