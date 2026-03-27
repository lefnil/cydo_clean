import React, { useState, useMemo } from 'react';
import { FileText, Activity, Eye } from 'lucide-react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchFilter } from './ui/SearchFilter';
import { DataTable, mealColumns, activityColumns } from './ui/DataTable';
import { StatusBadge } from './ui/StatusBadge';
import type { MEALRecord, ActivityMonitor } from '../../types/meal';
import { getStatusLabel } from '../../utils/mealStatus';

interface ReportsTabProps {
  records: MEALRecord[];
  activities?: ActivityMonitor[];
  onViewDetails: (record: MEALRecord) => void;
  onViewActivityDetails?: (activity: ActivityMonitor) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  records,
  activities = [],
  onViewDetails,
  onViewActivityDetails
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'activities'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // My Reports Logic
  const userPpaNames = useMemo(() => 
    records.map(r => r.ppa_name?.toLowerCase()).filter(Boolean), [records]
  );

  const relatedActivities = useMemo(() => 
    activities.filter(activity => {
      const activityName = activity.activity_name?.toLowerCase() || '';
      const matchesPpaName = userPpaNames.some(ppaName => 
        activityName.includes(ppaName) || ppaName.includes(activityName)
      );
      return matchesPpaName;
    }), [activities, userPpaNames]
  );

  const filteredReports = useMemo(() => 
    records.filter(r => {
      const matchesSearch = r.ppa_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [records, searchTerm, filterStatus]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' }
  ], []);

  const reportsWithActions = useMemo(() => filteredReports.map(record => ({
    ...record,
    statusRender: <StatusBadge status={record.status as any} />,
    actionsRender: (
      <div className="flex items-center justify-end gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(record);
          }}
          className="p-2 text-jewel hover:bg-white/50 rounded-lg" 
          title="View"
        >
          <Eye size={16} />
        </button>
      </div>
    )
  })), [filteredReports]);

  const finalReportColumns = useMemo(() => [
    mealColumns[0], // ppa_name with icon
    mealColumns[1], // author_name
    {
      ...mealColumns[2],
      render: (record: MEALRecord) => new Date(record.created_at).toLocaleDateString()
    },
    {
      ...mealColumns[3],
      render: (_: MEALRecord, index: number) => reportsWithActions[index]?.statusRender
    },
    {
      key: 'actions' as any,
      header: 'Actions',
      className: 'text-right',
      render: (_: MEALRecord, index: number) => reportsWithActions[index]?.actionsRender
    }
  ], [reportsWithActions]);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="glass rounded-2xl p-2 flex gap-1">
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'reports'
              ? 'bg-jewel text-white'
              : 'text-jewel/70 hover:bg-white/50 hover:text-jewel'
          }`}
        >
          <FileText size={18} />
          My Reports ({filteredReports.length})
        </button>
        <button
          onClick={() => setActiveSubTab('activities')}
          className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'activities'
              ? 'bg-jewel text-white'
              : 'text-jewel/70 hover:bg-white/50 hover:text-jewel'
          }`}
        >
          <Activity size={18} />
          Related Activities ({relatedActivities.length})
        </button>
      </div>

      {/* Filters */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={filterStatus}
        onFilterChange={setFilterStatus}
        filterOptions={statusOptions}
      />

      {/* Content */}
      {activeSubTab === 'reports' && (
        <DataTable
          data={records}
          columns={finalReportColumns}
          onRowClick={onViewDetails}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          emptyMessage="No reports found"
        />
      )}

      {activeSubTab === 'activities' && (
        <DataTable
          data={relatedActivities}
          columns={activityColumns}
          onRowClick={onViewActivityDetails!}
          searchTerm={searchTerm}
          emptyMessage={
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto text-jewel/30 mb-4" />
              <p className="text-jewel/50">No related activities found</p>
              <p className="text-sm text-jewel/40 mt-2">Activities will appear here when they match your submitted reports</p>
            </div>
          }
        />
      )}
    </div>
  );
};

