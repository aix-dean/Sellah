import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: any): string {
  if (!timestamp) return "N/A"
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}
