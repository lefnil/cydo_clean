import React from 'react';
import { getStatusLabel, getStatusColor, type MealStatus, type ActivityStatus } from '../../../utils/mealStatus';

interface StatusBadgeProps {
  status: MealStatus | ActivityStatus;
  type?: 'meal' | 'activity';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type,
  className = '',
  showIcon = false 
}) => {
  const effectiveType: 'meal' | 'activity' = type || 'meal';
  const colorClass = getStatusColor(status, effectiveType);
  const label = getStatusLabel(status);

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {showIcon && <span className="w-3 h-3 rounded-full bg-current" />}
      {label}
    </span>
  );
};

