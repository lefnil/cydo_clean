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

  if (filteredData.length === 0) {
    return (
      <div className={`glass rounded-3xl overflow-hidden ${className}`}>
        <div className="py-12 text-center text-jewel/50">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-frostee/30 border border-jewel/30">
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={String(column.key)} 
                    className={`py-4 px-4 lg:px-6 font-semibold text-jewel whitespace-nowrap ${column.className || ''}`}
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
                    <td key={String(column.key)} className={`py-4 px-4 lg:px-6 ${column.className || ''}`}>
                      {column.render 
                        ? column.render(item, index)
                        : String(item[column.key] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 sm:space-y-4">
        {filteredData.map((item, index) => (
          <div
            key={String(item.id || index)}
            onClick={() => onRowClick?.(item, index)}
            className="glass rounded-2xl p-4 sm:p-5 cursor-pointer hover:shadow-lg transition-all duration-200 active:bg-white/40"
          >
            {/* Primary Column (Usually Name/Title) */}
            {columns[0] && (
              <div className="mb-3 pb-3 border-b border-jewel/10">
                <p className="text-xs font-medium text-jewel/60 uppercase tracking-wide mb-1">
                  {columns[0].header}
                </p>
                <p className="font-semibold text-jewel text-base break-words">
                  {columns[0].render 
                    ? columns[0].render(item, index)
                    : String(item[columns[0].key] || '-')
                  }
                </p>
              </div>
            )}

            {/* Remaining Columns in Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {columns.slice(1, -1).map((column) => (
                <div key={String(column.key)}>
                  <p className="text-xs font-medium text-jewel/60 uppercase tracking-wide mb-1">
                    {column.header}
                  </p>
                  <p className="text-jewel/80 text-sm break-words">
                    {column.render 
                      ? column.render(item, index)
                      : String(item[column.key] || '-')
                    }
                  </p>
                </div>
              ))}
            </div>

            {/* Actions Row */}
            {columns.length > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-jewel/10">
                <div className="text-xs font-medium text-jewel/60">
                  {columns[columns.length - 1] && (
                    <>
                      {columns[columns.length - 1].header}
                    </>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actionClick?.(item, 'view');
                  }}
                  className="text-jewel hover:text-jewel/70 font-medium text-sm px-3 py-1 rounded-lg hover:bg-jewel/10 transition-colors"
                >
                  View
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
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

