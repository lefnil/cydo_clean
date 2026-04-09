import React, { useState, useMemo } from 'react';
import { FileText, Activity, Eye, Clock } from 'lucide-react';
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
  /** When true, shows impending-deadline filter and urgency badges */
  isMealHead?: boolean;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  records,
  activities = [],
  onViewDetails,
  onViewActivityDetails,
  isMealHead = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'activities'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeadlineFilter, setShowDeadlineFilter] = useState(false);

  // ── Impending deadline logic (meal_head focus) ────────────────────────
  const DEADLINE_WINDOW_DAYS = 7;

  const recordsWithDeadlineFlag = useMemo(() => records.map(r => {
    const end = r.end_date ? new Date(r.end_date) : null;
    const now = new Date();
    const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / 86_400_000) : null;
    return {
      ...r,
      _daysLeft: daysLeft,
      _isUrgent: daysLeft !== null && daysLeft >= 0 && daysLeft <= DEADLINE_WINDOW_DAYS,
    };
  }), [records]);

  const baseRecords = useMemo(() =>
    (isMealHead && showDeadlineFilter)
      ? recordsWithDeadlineFlag.filter(r => r._isUrgent)
      : recordsWithDeadlineFlag,
  [isMealHead, showDeadlineFilter, recordsWithDeadlineFlag]);

  // My Reports Logic
  const userPpaNames = useMemo(() => 
    baseRecords.map(r => r.ppa_name?.toLowerCase()).filter(Boolean), [baseRecords]
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
    baseRecords.filter(r => {
      const matchesSearch = r.ppa_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [baseRecords, searchTerm, filterStatus]);

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

      {/* Deadline filter — meal_head only */}
      {isMealHead && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeadlineFilter(prev => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              showDeadlineFilter
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock size={16} />
            {showDeadlineFilter ? 'Showing Impending Deadlines' : 'Filter: Impending Deadlines (≤7 days)'}
          </button>
          {showDeadlineFilter && (
            <span className="text-sm text-amber-600">{filteredReports.length} report(s) expiring soon</span>
          )}
        </div>
      )}

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

