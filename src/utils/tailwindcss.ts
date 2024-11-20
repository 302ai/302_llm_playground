/**
 * @fileoverview TailwindCSS utility functions for class name management.
 * Combines clsx and tailwind-merge for efficient class handling.
 * @author zpl
 * @created 2024-11-20
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges Tailwind CSS classes efficiently.
 * Uses clsx for conditional class application and tailwind-merge for deduplication.
 * 
 * @function
 * @param {...ClassValue[]} inputs - Class names or conditional class objects
 * @returns {string} Merged and optimized class string
 * 
 * @example
 * ```typescript
 * cn('px-2 py-1', { 'bg-blue-500': isActive }, 'text-white hover:bg-blue-600')
 * // Returns optimized class string with deduped Tailwind classes
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
