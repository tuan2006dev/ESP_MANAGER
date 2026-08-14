import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "VND"): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function calculateWinrate(wins: number, totalMatches: number): number {
  if (totalMatches === 0) return 0;
  return Math.round((wins / totalMatches) * 10000) / 100;
}

export function calculateTop3Rate(
  top3: number,
  totalMatches: number
): number {
  if (totalMatches === 0) return 0;
  return Math.round((top3 / totalMatches) * 10000) / 100;
}

export function calculateAverageKills(
  totalKills: number,
  totalMatches: number
): number {
  if (totalMatches === 0) return 0;
  return Math.round((totalKills / totalMatches) * 100) / 100;
}

export function getPerformanceLabel(
  winrate: number,
  excellent: number = 70,
  improve: number = 50
): { label: string; color: string } {
  if (winrate >= excellent)
    return { label: "ĐẠT", color: "text-emerald-500" };
  if (winrate >= improve)
    return { label: "CẦN CẢI THIỆN", color: "text-amber-500" };
  return { label: "KHÔNG ĐẠT", color: "text-red-500" };
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
