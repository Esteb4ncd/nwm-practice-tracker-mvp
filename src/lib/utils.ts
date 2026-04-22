import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toTitle = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)
