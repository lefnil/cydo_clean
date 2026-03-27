import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Activity, Calendar, AlertCircle, Eye } from 'lucide-react';
import { SearchFilter } from './ui/SearchFilter';
import { DataTable, activityColumns } from './ui/DataTable';
import { StatusBadge } from './ui/StatusBadge';
import type { ActivityMonitor } from '../../types/meal';
import type { ActivityStatus } from '../../utils/mealStatus';

interface ActivitiesTabProps {
  activities: ActivityMonitor[];
  onViewDetails: (record: ActivityMonitor) => void;
  canManage?: boolean;
  onAddClick?: () => void;
  onEditClick?: (activity: ActivityMonitor) => void;
  onStatusChange?: (activityId: string, newStatus: ActivityStatus) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  activities,
  onViewDetails,
  canManage = false,
  onAddClick,
  onEditClick,
  onStatusChange
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActivities = useMemo(() => activities.filter(a => {
    const matchesStatus = filterStatus === 'all' || a.reported_status === filterStatus;
    const matchesSearch = a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.assigned_to.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }), [activities, filterStatus, searchTerm]);

  const sortedActivities = useMemo(() => 
    [...filteredActivities].sort((a, b) => 
      new Date(b.submission_deadline).getTime() - new Date(a.submission_deadline).getTime()
    ), [filteredActivities]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Statuses' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' }
  ], []);

  const handleStatusChange = useCallback((id: string, status: ActivityStatus) => {
    onStatusChange?.(id, status);
  }, [onStatusChange]);

  const activitiesWithActions = useMemo(() => sortedActivities.map(activity => ({
    ...activity,
    statusRender: canManage && onStatusChange ? (
      <select
        value={activity.reported_status}
        onChange={(e) => handleStatusChange(activity.id, e.target.value as ActivityStatus)}
        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-jewel ${
          activity.reported_status === 'approved' ? 'bg-green-100 text-green-700' :
          activity.reported_status === 'overdue' ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        }`}
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="submitted">Submitted</option>
        <option value="approved">Approved</option>
        <option value="overdue">Overdue</option>
      </select>
    ) : (
      <StatusBadge status={activity.reported_status} type="activity" />
    ),
    actionsRender: (
      <div className="flex items-center justify-end gap-2">
        {canManage && onEditClick && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(activity);
            }}
            className="p-2 text-jewel hover:bg-white/50 rounded-lg"
            title="Edit"
          >
            <Edit size={16} />
          </button>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(activity);
          }}
          className="text-jewel hover:underline font-semibold text-sm"
        >
          View Details
        </button>
      </div>
    )
  })), [sortedActivities, canManage, onEditClick, onViewDetails, onStatusChange, handleStatusChange]);

  const finalColumns = useMemo(() => [
    activityColumns[0],
    activityColumns[1], 
    activityColumns[2],
    {
      ...activityColumns[3],
      render: (activity: ActivityMonitor) => {
        const actionItem = activitiesWithActions.find(a => a.id === activity.id);
        return actionItem ? actionItem.statusRender : <StatusBadge status={activity.reported_status} type="activity" />;
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (activity: ActivityMonitor) => {
        const actionItem = activitiesWithActions.find(a => a.id === activity.id);
        return actionItem ? actionItem.actionsRender : null;
      }
    }
  ], [activitiesWithActions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterValue={filterStatus}
          onFilterChange={setFilterStatus}
          filterOptions={statusOptions}
        />
{canManage && onAddClick && (
          <button
            onClick={onAddClick}
            className="ml-4 px-4 py-2 bg-jewel text-white rounded-xl hover:bg-jewel/90 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> Add Activity
          </button>
        )}
      </div>

      {/* DataTable */}
      <DataTable
        data={activities}
        columns={finalColumns}
        onRowClick={onViewDetails}
        searchTerm={searchTerm}
        filterStatus={filterStatus}
      />
    </div>
  );
};

