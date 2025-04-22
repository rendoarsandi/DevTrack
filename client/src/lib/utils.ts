import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Status colors for different project states
export const statusColorMap: Record<string, { bg: string; text: string }> = {
  pending_review: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  awaiting_dp: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
  },
  in_progress: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  under_review: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
};

// Format status labels for display
export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'pending_review':
      return 'Pending Review';
    case 'awaiting_dp':
      return 'Awaiting Down Payment';
    case 'in_progress':
      return 'In Progress';
    case 'under_review':
      return 'Under Review';
    case 'completed':
      return 'Completed';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
