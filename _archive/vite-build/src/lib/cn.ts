import clsx, { type ClassValue } from 'clsx'

/** Join conditional class names. Thin wrapper so call sites stay tidy. */
export function cn(...parts: ClassValue[]): string {
  return clsx(parts)
}
