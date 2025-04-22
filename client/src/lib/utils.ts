import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Status colors for different project states
export const statusColorMap: Record<string, { bg: string; text: string }> = {
  new: { 
    bg: 'bg-slate-100', 
    text: 'text-slate-600' 
  },
  pending_review: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
  awaiting_dp: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
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
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
};

// Format status labels for display
export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'new':
      return 'New Request';
    case 'pending_review':
      return 'Pending Review';
    case 'awaiting_dp':
      return 'Awaiting Payment';
    case 'in_progress':
      return 'In Progress';
    case 'under_review':
      return 'Under Review';
    case 'completed':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

// Format currency in USD
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get appropriate color class based on progress percentage
export function getProgressColorClass(progress: number): string {
  if (progress < 25) return "bg-red-500";
  if (progress < 50) return "bg-amber-500";
  if (progress < 75) return "bg-blue-500";
  return "bg-green-500";
}
