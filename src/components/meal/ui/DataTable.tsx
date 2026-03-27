import React from 'react';
import { Activity, ChevronDown, FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { MEALRecord, ActivityMonitor } from '../../../types/meal';
import { getStatusLabel } from '../../../utils/mealStatus';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T, index: number) => void;
  actionClick?: (item: T, action: string) => void;
  searchTerm?: string;
  filterStatus?: string;
  className?: string;
  emptyMessage?: string;
}

export const DataTable = <T extends Record<string, any>>({ 
  data, 
  columns, 
  onRowClick, 
  actionClick,
  searchTerm = '', 
  filterStatus, 
  className = '',
  emptyMessage = 'No data found'
}: DataTableProps<T>) => {
  const filteredData = data.filter((item) => {
    // Simple search across all string fields
    const matchesSearch = Object.values(item).some(val => 
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filter by status if provided
    const matchesFilter = !filterStatus || item.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`glass rounded-3xl overflow-hidden ${className}`}>
      <table className="w-full text-left">
        <thead className="bg-frostee/30 border border-jewel/30">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={String(column.key)} 
                className={`py-4 px-6 font-semibold text-jewel ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr 
              key={String(item.id || index)} 
              className="border-b border-jewel/5 hover:bg-white/30 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(item, index)}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className={`py-4 px-6 ${column.className || ''}`}>
                  {column.render 
                    ? column.render(item, index)
                    : String(item[column.key] || '')
                  }
                </td>
              ))}
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-jewel/50">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// MEAL-specific table helpers
export const mealColumns: Column<MEALRecord>[] = [
  { key: 'ppa_name' as keyof MEALRecord, header: 'Project Name', render: (record) => (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-jewel/10 rounded-lg">
        <FileText size={16} className="text-jewel" />
      </div>
      <span className="font-medium text-jewel">{record.ppa_name}</span>
    </div>
  )},
  { key: 'author_name' as keyof MEALRecord, header: 'Author' },
  { key: 'created_at' as keyof MEALRecord, header: 'Date', render: (record) => (
    new Date(record.created_at).toLocaleDateString()
  )},
  { 
    key: 'status' as keyof MEALRecord, 
    header: 'Status', 
    render: (record) => <StatusBadge status={record.status as any} />
  },
  { key: 'id' as keyof MEALRecord, header: 'Actions', className: 'text-right', render: (record: MEALRecord) => (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        actionClick?.(record, 'view');
      }}
      className="text-jewel hover:text-jewel/70 font-medium text-sm"
    >
      View
    </button>
  )}
];

export const activityColumns: Column<ActivityMonitor>[] = [
  { key: 'activity_name' as keyof ActivityMonitor, header: 'Activity Name', render: (activity) => (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-jewel/10 rounded-lg">
        <Activity size={16} className="text-jewel" />
      </div>
      <span className="font-medium text-jewel">{activity.activity_name}</span>
    </div>
  )},
  { key: 'assigned_to' as keyof ActivityMonitor, header: 'Assigned To' },
  { 
    key: 'submission_deadline' as keyof ActivityMonitor, 
    header: 'Deadline', 
    render: (activity) => new Date(activity.submission_deadline).toLocaleDateString()
  },
  { 
    key: 'reported_status' as keyof ActivityMonitor, 
    header: 'Status', 
    render: (activity) => <StatusBadge status={activity.reported_status as any} type="activity" />
  }
];

function actionClick(record: MEALRecord, arg1: string) {
  throw new Error('Function not implemented.');
}

