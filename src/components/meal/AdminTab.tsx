import React, { useState, useMemo } from 'react';
import { Shield, Users, Check, X, Eye, UserCheck, Clock } from 'lucide-react';
import { SearchFilter } from './ui/SearchFilter';
import { DataTable, mealColumns } from './ui/DataTable';
import { StatusBadge } from './ui/StatusBadge';
import type { MEALRecord } from '../../types/meal';

// ─── Inline staff list (replace with a real API call if you build a /get_staff endpoint) ───
const STAFF_MEMBERS = [
  { id: 'staff1', name: 'John Doe' },
  { id: 'staff2', name: 'Jane Smith' },
  { id: 'staff3', name: 'Mike Johnson' },
];

interface AdminTabProps {
  records: MEALRecord[];
  onViewDetails?: (record: MEALRecord) => void;
  /** Only office_head and admin can approve/reject */
  canApprove?: boolean;
  /** meal_head, office_head, and admin can assign */
  canAssign?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onAssign?: (id: string, assignedTo: string) => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  records,
  onViewDetails,
  canApprove = false,
  canAssign = false,
  onApprove,
  onReject,
  onAssign,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'validation' | 'assigned'>('validation');
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState('');

  const pendingRecords = useMemo(() =>
    records.filter(r => r.status === 'pending' || r.status === 'under_review'),
  [records]);

  const assignedRecords = useMemo(() =>
    records.filter(r => r.assigned_to),
  [records]);

  const filteredPendingRecords = useMemo(() =>
    pendingRecords.filter(r =>
      r.ppa_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [pendingRecords, searchTerm]);

  const handleAssignConfirm = async (recordId: string) => {
    if (!assignTarget) return;
    await onAssign?.(recordId, assignTarget);
    setAssigningId(null);
    setAssignTarget('');
  };

  const pendingRecordsWithActions = useMemo(() => filteredPendingRecords.map(record => ({
    ...record,
    statusRender: <StatusBadge status={record.status as any} />,
    actionsRender: (
      <div className="flex items-center justify-end gap-2">
        {/* APPROVE — office_head and admin only */}
        {canApprove && (
          <>
            <button
              onClick={() => onApprove?.(record.id)}
              className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg"
              title="Approve"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => onReject?.(record.id)}
              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
              title="Reject"
            >
              <X size={16} />
            </button>
          </>
        )}

        {/* ASSIGN — meal_head, office_head, admin */}
        {canAssign && (
          assigningId === record.id ? (
            <div className="flex items-center gap-1">
              <select
                value={assignTarget}
                onChange={e => setAssignTarget(e.target.value)}
                className="text-xs border border-jewel/20 rounded-lg px-2 py-1 bg-white"
              >
                <option value="">Select staff…</option>
                {STAFF_MEMBERS.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={() => handleAssignConfirm(record.id)}
                disabled={!assignTarget}
                className="p-1.5 bg-jewel text-white rounded-lg disabled:opacity-40"
                title="Confirm assign"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setAssigningId(null)}
                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAssigningId(record.id); setAssignTarget(''); }}
              className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg"
              title={record.assigned_to ? `Re-assign (currently: ${record.assigned_to})` : 'Assign to staff'}
            >
              <UserCheck size={16} />
            </button>
          )
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails?.(record); }}
          className="p-2 text-jewel hover:bg-white/50 rounded-lg"
          title="View"
        >
          <Eye size={16} />
        </button>
      </div>
    ),
  })), [filteredPendingRecords, canApprove, canAssign, assigningId, assignTarget]);

  const finalColumns = useMemo(() => [
    mealColumns[0],
    mealColumns[1],
    mealColumns[2],
    // assigned_to column
    {
      key: 'assigned_to' as any,
      header: 'Assigned To',
      render: (record: MEALRecord) =>
        record.assigned_to
          ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{record.assigned_to}</span>
          : <span className="text-xs text-jewel/40">—</span>,
    },
    {
      ...mealColumns[3],
      render: (_: MEALRecord, index: number) => pendingRecordsWithActions[index]?.statusRender,
    },
    {
      key: 'actions' as any,
      header: 'Actions',
      className: 'text-right',
      render: (_: MEALRecord, index: number) => pendingRecordsWithActions[index]?.actionsRender,
    },
  ], [pendingRecordsWithActions]);

  const subTabLabel = canApprove ? 'Validation & Approval' : 'Incoming Reports';

  return (
    <div className="space-y-6">
      {/* Role context banner */}
      {!canApprove && canAssign && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 text-sm">
          <Clock size={18} />
          <span>You can <strong>check and assign</strong> incoming reports to staff. Final approval requires the Office Head.</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('validation')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeSubTab === 'validation' ? 'bg-jewel text-white' : 'bg-frostee/50 text-jewel hover:bg-white/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={18} /> {subTabLabel} ({pendingRecords.length})
          </div>
        </button>
        {canAssign && (
          <button
            onClick={() => setActiveSubTab('assigned')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeSubTab === 'assigned' ? 'bg-jewel text-white' : 'bg-frostee/50 text-jewel hover:bg-white/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} /> Assigned ({assignedRecords.length})
            </div>
          </button>
        )}
      </div>

      {/* Search */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue="all"
        onFilterChange={() => {}}
        filterOptions={[]}
      />

      {/* Content */}
      {activeSubTab === 'validation' && (
        <DataTable
          data={filteredPendingRecords}
          columns={finalColumns}
          onRowClick={onViewDetails!}
          searchTerm={searchTerm}
          emptyMessage="No pending reports"
        />
      )}

      {activeSubTab === 'assigned' && (
        <DataTable
          data={assignedRecords}
          columns={[
            mealColumns[0],
            mealColumns[1],
            {
              key: 'assigned_to' as any,
              header: 'Assigned To',
              render: (record: MEALRecord) => (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {record.assigned_to}
                </span>
              ),
            },
            {
              ...mealColumns[3],
              render: (record: MEALRecord) => <StatusBadge status={record.status as any} />,
            },
          ]}
          onRowClick={onViewDetails!}
          searchTerm={searchTerm}
          emptyMessage="No assigned records"
        />
      )}
    </div>
  );
};

