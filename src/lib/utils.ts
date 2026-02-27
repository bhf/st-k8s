import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deep equality check for objects and arrays
 */
export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !isEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export function parseCpu(cpu: string): number {
  if (!cpu || cpu === '-') return 0;
  if (cpu.endsWith('m')) return parseInt(cpu) / 1000;
  return parseFloat(cpu);
}

export function parseMemory(mem: string): number {
  if (!mem || mem === '-') return 0;
  const match = mem.match(/^([0-9.]+)([a-zA-Z]*)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    'Ki': 1024,
    'Mi': 1024 * 1024,
    'Gi': 1024 * 1024 * 1024,
    'Ti': 1024 * 1024 * 1024 * 1024,
    'K': 1000,
    'M': 1000 * 1000,
    'G': 1000 * 1000 * 1000,
    'KB': 1000,
    'MB': 1000 * 1000,
    'GB': 1000 * 1000 * 1000,
  };
  return value * (multipliers[unit] || 1);
}

export function formatCpu(value: number): string {
  if (value === 0) return "-";
  if (value < 1) return `${Math.round(value * 1000)}m`;
  return `${value.toFixed(2)}`;
}

export function formatMemory(value: number): string {
  if (value === 0) return "-";
  const units = ["B", "Ki", "Mi", "Gi", "Ti"];
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)}${units[unitIndex]}`;
}
