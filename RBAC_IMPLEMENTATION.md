# CYDO RBAC Implementation Guide
## Roles: `office_head` · `meal_head` · `staff`

---

## ⚡ Quick Summary of Changes

| File | What Changes |
|---|---|
| `src/hooks/useRBAC.ts` | **NEW** — Central permission helper used everywhere |
| `src/types/meal.ts` | Add `assigned_to` / `assigned_by` fields to `MEALRecord` |
| `src/App.tsx` | Add `office_head` to `/administration` route |
| `src/components/Layout.tsx` | Add `office_head` to Administration nav, `staff` to Dashboard nav |
| `src/pages/MEALSystem.tsx` | Split `canManage` into three fine-grained permission flags |
| `src/components/meal/AdminTab.tsx` | Accept `canApprove` + `canAssign` props; show correct action buttons per role |
| `src/components/meal/ReportsTab.tsx` | Add `isMealHead` prop for impending-deadline highlighting |
| `Code.gs` | Seed new users, add `assigned_to/by` columns, new `assign_meal_record` action, restrict `approved` status to `office_head`/`admin` |

---

## Step 1 — `src/hooks/useRBAC.ts` (NEW FILE)

Create this file. It is the **single source of truth** for all permission checks.

```typescript
// src/hooks/useRBAC.ts
import { useAuth } from '../context/AuthContext';

const ROLES = {
  ADMIN: 'admin',
  OFFICE_HEAD: 'office_head',
  MEAL_HEAD: 'meal_head',
  STAFF: 'staff',
  SK: 'sk',
  LYDC: 'lydc',
} as const;

export type AppRole = typeof ROLES[keyof typeof ROLES];

export function useRBAC() {
  const { user } = useAuth();
  const role = (user?.role ?? '') as AppRole;

  return {
    role,

    // --- Navigation & Route Access ---
    canAccessAdministration: [ROLES.ADMIN, ROLES.OFFICE_HEAD].includes(role as any),
    canAccessAuditLogs:      [ROLES.ADMIN].includes(role as any),
    canAccessDashboard:      [ROLES.ADMIN, ROLES.SK, ROLES.LYDC, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD, ROLES.STAFF].includes(role as any),
    canAccessSKReports:      [ROLES.ADMIN, ROLES.SK, ROLES.OFFICE_HEAD].includes(role as any),
    canAccessLYDCReports:    [ROLES.ADMIN, ROLES.LYDC, ROLES.OFFICE_HEAD].includes(role as any),
    canAccessMEAL:           [ROLES.ADMIN, ROLES.STAFF, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),

    // --- MEAL System Granular ---
    canViewAnalytics:  [ROLES.ADMIN, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),
    canApproveReports: [ROLES.ADMIN, ROLES.OFFICE_HEAD].includes(role as any),   // definitive approval
    canAssignReports:  [ROLES.ADMIN, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),
    canViewAllRecords: [ROLES.ADMIN, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),

    // --- Convenience Booleans ---
    isAdmin:      role === ROLES.ADMIN,
    isOfficeHead: role === ROLES.OFFICE_HEAD,
    isMealHead:   role === ROLES.MEAL_HEAD,
    isStaff:      role === ROLES.STAFF,
  };
}
```

---

## Step 2 — `src/types/meal.ts` (UPDATE)

Add two optional fields to `MEALRecord`. Append them just before the closing `}` of the interface:

```typescript
// Add inside MEALRecord interface, after 'reviewer_notes':
  assigned_to?: string;   // staff name or id this record is assigned to
  assigned_by?: string;   // name of meal_head who assigned it
```

---

## Step 3 — `src/App.tsx` (UPDATE)

Two changes only:

### 3a. Import `useRBAC` (add after existing imports)
```typescript
import { useRBAC } from './hooks/useRBAC';
```

### 3b. Replace the `administration` route
Find this block:
```tsx
<Route
  path="administration"
  element={
    <ProtectedRoute roles={['admin']}>
      <Administration />
    </ProtectedRoute>
  }
/>
```

Replace with:
```tsx
<Route
  path="administration"
  element={
    <ProtectedRoute roles={['admin', 'office_head']}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jewel"></div></div>}>
        <Administration />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

---

## Step 4 — `src/components/Layout.tsx` (UPDATE)

Replace the entire `navItems` array with this version that adds `staff` to Dashboard and `office_head` to Administration:

```typescript
const navItems = [
  { name: 'Dashboard',      path: '/',               icon: LayoutDashboard, roles: ['admin', 'sk', 'lydc', 'meal_head', 'office_head', 'staff'] },
  { name: 'SK Reports',     path: '/sk-reports',     icon: FileText,        roles: ['admin', 'sk', 'office_head'] },
  { name: 'LYDC Reports',   path: '/lydc-reports',   icon: FileText,        roles: ['admin', 'lydc', 'office_head'] },
  { name: 'MEAL System',    path: '/meal',            icon: ClipboardCheck,  roles: ['admin', 'staff', 'meal_head', 'office_head'] },
  { name: 'Administration', path: '/administration',  icon: Shield,          roles: ['admin', 'office_head'] },
  { name: 'Audit Logs',     path: '/audit-logs',      icon: ShieldAlert,     roles: ['admin'] },
];
```

Also update the role badge display in the sidebar footer to show a friendlier label. Find the line that renders `user?.role` and replace with:

```tsx
<p className="text-xs text-jewel/60 uppercase tracking-wider">
  {user?.role === 'office_head' ? 'Office Head'
    : user?.role === 'meal_head' ? 'MEAL Head'
    : user?.role}
</p>
```

---

## Step 5 — `src/pages/MEALSystem.tsx` (FULL REPLACEMENT)

This is the most significant frontend change. The key updates are:
- Replace `canManage` with three separate flags from `useRBAC`
- Add `canApprove` and `canAssign` props to `<AdminTab>`
- Show Analytics only when `canViewAnalytics`
- Show Admin tab when `canAssign` OR `canApproveReports` (meal_head can assign, office_head can approve)
- Pass `isMealHead` to `<ReportsTab>` for deadline highlighting

```tsx
// src/pages/MEALSystem.tsx — FULL FILE
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { useMealRecords, useActivities, useMealAnalytics } from '../hooks/useMeal';
import { motion } from 'motion/react';
import {
  Plus, Search, Download, Upload, RefreshCw,
  BarChart3, Activity, FileText, TrendingUp, Shield
} from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { importCSV } from '../utils/csvImport';
import { fetchFromGAS } from '../lib/api';
import type { MEALRecord, ActivityMonitor } from '../types/meal';

import { DashboardTab } from '../components/meal/DashboardTab';
import { ActivitiesTab } from '../components/meal/ActivitiesTab';
import { ReportsTab } from '../components/meal/ReportsTab';
import { AnalyticsTab } from '../components/meal/AnalyticsTab';
import { AdminTab } from '../components/meal/AdminTab';
import { MealFormModal, ActivityModal, RecordDetailsModal } from '../components/meal/modals';

export default function MEALSystem() {
  const { user } = useAuth();
  const { canViewAnalytics, canApproveReports, canAssignReports, isMealHead } = useRBAC();

  const { records, loading, refetch: refreshRecords } = useMealRecords();
  const { activities, refetch: refreshActivities } = useActivities();
  const analyticsData = useMealAnalytics(records);

  const [importingCSV, setImportingCSV] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MEALRecord | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityMonitor | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'reports' | 'analytics' | 'admin'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleViewRecord = useCallback((record: MEALRecord) => setSelectedRecord(record), []);
  const handleViewActivity = useCallback((activity: ActivityMonitor) => setSelectedActivity(activity), []);

  const refreshData = useCallback(async () => {
    await Promise.all([refreshRecords(), refreshActivities()]);
  }, [refreshRecords, refreshActivities]);

  const handleFormSubmit = useCallback(async () => {
    setShowFormModal(false);
    await refreshData();
  }, [refreshData]);

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingCSV(true);
    try {
      const importedRecords = await importCSV(file, user?.id || '', user?.name || 'Unknown');
      const savedRecords: MEALRecord[] = [];
      for (const record of importedRecords) {
        try {
          const result = await fetchFromGAS('saveRecord', { record, userId: user?.id });
          savedRecords.push(result.record);
        } catch (saveError) {
          console.error('Save error:', saveError);
        }
      }
      await refreshRecords();
      alert(`✅ Successfully imported ${savedRecords.length} records!`);
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('❌ Failed to import CSV. Check format and try again.');
    } finally {
      setImportingCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Admin tab is shown if user can either assign OR approve
  const showAdminTab = canAssignReports || canApproveReports;

  const tabs = useMemo(() => [
    { id: 'dashboard'  as const, label: 'Dashboard',  icon: BarChart3 },
    { id: 'activities' as const, label: 'Activities', icon: Activity },
    { id: 'reports'    as const, label: 'Reports',    icon: FileText },
    ...(canViewAnalytics ? [{ id: 'analytics' as const, label: 'Analytics', icon: TrendingUp }] : []),
    ...(showAdminTab    ? [{ id: 'admin'     as const, label: 'Admin',     icon: Shield }]    : []),
  ], [canViewAnalytics, showAdminTab]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 p-6 glass rounded-3xl">
        <div>
          <h1 className="text-4xl font-bold text-jewel">TCYDO MEAL System</h1>
          <p className="text-jewel/70 mt-2">Monitoring, Evaluation, Accountability & Learning</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-end">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          <button
            onClick={() => fileInputRef?.current?.click()}
            disabled={importingCSV || loading}
            className="px-5 py-3 bg-frostee/60 backdrop-blur-sm border border-jewel/20 text-jewel rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {importingCSV ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
            {importingCSV ? 'Importing...' : 'Import CSV'}
          </button>
          <button
            onClick={() => exportToPDF(records, 'meal_records_' + Date.now())}
            disabled={loading}
            className="px-5 py-3 bg-frostee/60 backdrop-blur-sm border border-jewel/20 text-jewel rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={18} /> Export PDF
          </button>
          <button
            className="px-6 py-3 bg-jewel text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            onClick={() => setShowFormModal(true)}
            disabled={loading}
          >
            <Plus size={20} /> Create Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass rounded-2xl p-1 mb-8 overflow-x-auto">
        <div className="flex gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              layout
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === id ? 'bg-jewel text-white shadow-lg' : 'text-jewel/70 hover:bg-white/30 hover:text-jewel'
              }`}
            >
              <Icon size={18} />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'dashboard' && (
          <DashboardTab records={records} onViewDetails={handleViewRecord} canManage={showAdminTab} />
        )}
        {activeTab === 'activities' && (
          <ActivitiesTab activities={activities} onViewDetails={handleViewActivity} canManage={showAdminTab} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab
            records={records}
            activities={activities}
            onViewDetails={handleViewRecord}
            isMealHead={isMealHead}
          />
        )}
        {activeTab === 'analytics' && canViewAnalytics && (
          <AnalyticsTab records={records} analyticsData={analyticsData} />
        )}
        {activeTab === 'admin' && showAdminTab && (
          <AdminTab
            records={records}
            onViewDetails={handleViewRecord}
            canApprove={canApproveReports}
            canAssign={canAssignReports}
            onApprove={async (id) => {
              await fetchFromGAS('update_meal_status', { id, status: 'approved' as const });
              await refreshRecords();
            }}
            onReject={async (id) => {
              await fetchFromGAS('update_meal_status', { id, status: 'rejected' as const });
              await refreshRecords();
            }}
            onAssign={async (id, assignedTo) => {
              await fetchFromGAS('assign_meal_record', { id, assigned_to: assignedTo });
              await refreshRecords();
            }}
          />
        )}
      </div>

      {/* Modals */}
      <MealFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} onSubmit={handleFormSubmit} />
      <ActivityModal
        isOpen={!!selectedActivity}
        initialData={selectedActivity || undefined}
        onClose={() => setSelectedActivity(null)}
        onSubmit={async (data) => {
          await fetchFromGAS('update_activity', data);
          setSelectedActivity(null);
          await refreshActivities();
        }}
      />
      <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </>
  );
}
```

---

## Step 6 — `src/components/meal/AdminTab.tsx` (FULL REPLACEMENT)

This version adds:
- `canApprove` prop — only shows Approve/Reject buttons when true (`office_head`/`admin`)
- `canAssign` prop — shows an "Assign" dropdown for `meal_head`
- The "Data Validation" sub-tab label now adapts to role
- Deadline urgency badges on records

```tsx
// src/components/meal/AdminTab.tsx — FULL FILE
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
```

---

## Step 7 — `src/components/meal/ReportsTab.tsx` (UPDATE)

Add `isMealHead` prop and deadline-urgency highlighting. Find the `interface ReportsTabProps` block and add the prop, then add the deadline filter UI for meal heads.

### 7a. Update the interface
```typescript
interface ReportsTabProps {
  records: MEALRecord[];
  activities?: ActivityMonitor[];
  onViewDetails: (record: MEALRecord) => void;
  onViewActivityDetails?: (activity: ActivityMonitor) => void;
  /** When true, shows impending-deadline filter and urgency badges */
  isMealHead?: boolean;
}
```

### 7b. Update the component signature
```typescript
export const ReportsTab: React.FC<ReportsTabProps> = ({
  records,
  activities = [],
  onViewDetails,
  onViewActivityDetails,
  isMealHead = false,
}) => {
```

### 7c. Add deadline helpers (insert after the `useState` calls near the top of the component body)
```typescript
  // ── Impending deadline logic (meal_head focus) ────────────────────────
  const [showDeadlineFilter, setShowDeadlineFilter] = useState(false);

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
```

### 7d. Replace `filteredReports` to use `baseRecords` instead of `records`
```typescript
  const filteredReports = useMemo(() =>
    baseRecords.filter(r => {
      const matchesSearch = r.ppa_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [baseRecords, searchTerm, filterStatus]);
```

### 7e. Add the deadline toggle button for meal_head — insert just before `<SearchFilter …>`

```tsx
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
```

> **Note:** You will also need to add `import { Clock } from 'lucide-react';` to the ReportsTab imports.

---

## Step 8 — `Code.gs` Backend Changes

These are the changes you must apply to your Google Apps Script file.

---

### 8a. Seed `office_head` and `meal_head` users in `setup()`

Find the `// Seed default users if empty` block and add these two rows after the existing seeds:

```javascript
userSheet.appendRow([generateId(), 'office_head', hashPassword('head123'), 'office_head', 'Office Head', 'head@tcydo.gov', 'active', now]);
userSheet.appendRow([generateId(), 'meal_head',   hashPassword('meal123'), 'meal_head',   'MEAL Head',   'meal@tcydo.gov', 'active', now]);
```

---

### 8b. Add `assigned_to` and `assigned_by` columns to `meal_records` in `setup()`

Find the `meal_records` headers array and add two fields at the end, before the last closing `]`:

```javascript
// After 'outside_tagum', add:
'assigned_to',
'assigned_by'
```

---

### 8c. Add `assign_meal_record` case to the `switch` in `doPost()`

Find the `case 'update_meal_status':` block and add directly after it:

```javascript
case 'assign_meal_record':
  result = assignMealRecord(params, currentUser);
  break;
```

---

### 8d. Add `assignMealRecord()` function

Add this new function after `updateMealStatus()`:

```javascript
/**
 * Assigns a meal record to a staff member.
 * Allowed roles: admin, office_head, meal_head
 */
function assignMealRecord(params, user) {
  var allowedRoles = ['admin', 'office_head', 'meal_head'];
  if (allowedRoles.indexOf(user.role) === -1) {
    return { error: 'Forbidden: Only meal heads and office heads can assign records.' };
  }
  if (!params.id || !params.assigned_to) {
    return { error: 'Missing required fields: id, assigned_to' };
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meal_records');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var assignedToCol = headers.indexOf('assigned_to');
  var assignedByCol = headers.indexOf('assigned_by');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === params.id) {
      if (assignedToCol >= 0) {
        sheet.getRange(i + 1, assignedToCol + 1).setValue(params.assigned_to);
      }
      if (assignedByCol >= 0) {
        sheet.getRange(i + 1, assignedByCol + 1).setValue(user.name);
      }
      logAction(user.id, user.name, 'ASSIGN_MEAL_RECORD',
        'Assigned record ' + params.id + ' to ' + params.assigned_to);
      return { id: params.id, assigned_to: params.assigned_to, assigned_by: user.name };
    }
  }
  throw new Error('MEAL record not found');
}
```

---

### 8e. Restrict definitive `approved` status to `office_head` and `admin`

Find `function updateMealStatus(id, status, user)` and replace its entire body with:

```javascript
function updateMealStatus(id, status, user) {
  // Only office_head and admin can set the final 'approved' status
  var approvalRoles = ['admin', 'office_head'];
  if (status === 'approved' && approvalRoles.indexOf(user.role) === -1) {
    return { error: 'Forbidden: Only the Office Head can definitively approve records.' };
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meal_records');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      logAction(user.id, user.name, 'UPDATE_MEAL_STATUS',
        'Updated MEAL record ' + id + ' status to ' + status);
      return { id: id, status: status };
    }
  }
  throw new Error('MEAL record not found');
}
```

---

### 8f. Restrict `approved` in `updateReportStatus()` to `office_head` and `admin`

Find `function updateReportStatus(sheetName, id, status, user)` and add this guard at the very top of the function body:

```javascript
function updateReportStatus(sheetName, id, status, user) {
  // RBAC: Only office_head and admin can set 'approved'
  var approvalRoles = ['admin', 'office_head'];
  if (status === 'approved' && approvalRoles.indexOf(user.role) === -1) {
    return { error: 'Forbidden: Only the Office Head can approve reports.' };
  }

  // ... rest of the existing function body unchanged ...
```

---

### 8g. Update `getReports()` — `meal_head` sees all MEAL records but NOT SK/LYDC reports

The existing `getReports` function already correctly limits non-admin/non-office_head to their own reports. No change needed here — `meal_head` only accesses `/meal`, not `/sk-reports` or `/lydc-reports`.

However, if you ever want `meal_head` to view SK/LYDC for context, you can add it:
```javascript
// Optional: add meal_head to see-all in getReports
if (role !== 'admin' && role !== 'office_head' && role !== 'meal_head') {
  reports = reports.filter(function(r) { return r.user_id === userId; });
}
```

---

### 8h. Update `createUser()` and `deleteUser()` — allow `office_head` to manage users

Find `function createUser(params, user)` and update the role check:

```javascript
// Replace: if (user.role !== 'admin') {
// With:
if (user.role !== 'admin' && user.role !== 'office_head') {
  throw new Error('Unauthorized: Only administrators can create users.');
}
```

Find `function deleteUser(id, user)` and update similarly:

```javascript
// Replace: if (user.role !== 'admin') {
// With:
if (user.role !== 'admin' && user.role !== 'office_head') {
  throw new Error('Unauthorized: Only administrators can delete users.');
}
```

---

## Summary: Permission Matrix

| Action | admin | office_head | meal_head | staff |
|---|:---:|:---:|:---:|:---:|
| Access Dashboard | ✅ | ✅ | ✅ | ✅ |
| Access Administration page | ✅ | ✅ | ❌ | ❌ |
| Access Audit Logs | ✅ | ❌ | ❌ | ❌ |
| View SK/LYDC Reports (all) | ✅ | ✅ | ❌ | ❌ |
| View MEAL Records (all) | ✅ | ✅ | ✅ | ❌ |
| View MEAL Records (own only) | ✅ | ✅ | ✅ | ✅ |
| View Analytics Tab | ✅ | ✅ | ✅ | ❌ |
| View Admin Tab | ✅ | ✅ | ✅ | ❌ |
| **Assign** records to staff | ✅ | ✅ | ✅ | ❌ |
| **Approve** records (definitive) | ✅ | ✅ | ❌ | ❌ |
| Reject records | ✅ | ✅ | ❌ | ❌ |
| Create/submit reports | ✅ | ✅ | ✅ | ✅ |
| Deadline filter (≤7 days) | — | — | ✅ | — |
| Manage users | ✅ | ✅ | ❌ | ❌ |

---

## Quick Start

1. Apply all `Code.gs` changes and **redeploy** the Web App as a new version.
2. Run `setup()` **once** in Apps Script to add the new columns and seed the new users.
3. Copy the new/updated frontend files.
4. Run `npm run dev` to verify — log in as `office_head` / `meal_head` / `staff1` with the seeded passwords.
