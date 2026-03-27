import { LucideIcon } from 'lucide-react';

export type MealStatus = 'pending' | 'under_review' | 'approved' | 'completed' | 'rejected' | 'active';
export type ActivityStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'overdue';

export const MEAL_STATUS_COLORS: Record<MealStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  'under_review': 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  active: 'bg-blue-100 text-blue-700'
} as const;

export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  'in_progress': 'bg-blue-100 text-blue-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700'
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  'under_review': 'Under Review',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
  active: 'Active',
  'in_progress': 'In Progress',
  submitted: 'Submitted',
  overdue: 'Overdue'
};

export const getStatusColor = (status: MealStatus | ActivityStatus, type: 'meal' | 'activity' = 'meal'): string => {
  return type === 'meal' 
    ? MEAL_STATUS_COLORS[status as MealStatus] 
    : ACTIVITY_STATUS_COLORS[status as ActivityStatus];
};

export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

import { CheckCircle, Clock, RefreshCw, FileText, AlertCircle, XCircle, Activity } from 'lucide-react';

export const StatusIconMap = {
  approved: CheckCircle,
  completed: CheckCircle,
  pending: Clock,
  'under_review': Clock,
  'in_progress': RefreshCw,
  submitted: FileText,
  overdue: AlertCircle,
  rejected: XCircle,
  active: Activity
} as const;

