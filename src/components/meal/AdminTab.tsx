import React, { useState, useMemo } from 'react';
import { Shield, Users, CheckCircle, Check, X, Eye, Edit, Trash2, Plus } from 'lucide-react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchFilter } from './ui/SearchFilter';
import { DataTable, mealColumns } from './ui/DataTable';
import { StatusBadge } from './ui/StatusBadge';
import type { MEALRecord } from '../../types/meal';
import type { MealStatus } from '../../utils/mealStatus';

interface AdminTabProps {
  records: MEALRecord[];
  onViewDetails?: (record: MEALRecord) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  records,
  onApprove,
  onReject
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'validation' | 'users'>('validation');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingRecords = useMemo(() => 
    records.filter(r => r.status === 'pending' || r.status === 'under_review')
  , [records]);

  const filteredPendingRecords = useMemo(() => 
    pendingRecords.filter(r => 
      r.ppa_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [pendingRecords, searchTerm]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' }
  ];

  const pendingRecordsWithActions = useMemo(() => filteredPendingRecords.map(record => ({
    ...record,
    statusRender: (
      <StatusBadge status={record.status as any} />
    ),
    actionsRender: (
      <div className="flex items-center justify-end gap-2">
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
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(record);
          }}
          className="p-2 text-jewel hover:bg-white/50 rounded-lg" 
          title="View"
        >
          <Eye size={16} />
        </button>
      </div>
    )
  })), [filteredPendingRecords, onApprove, onReject]);

  const finalColumns = useMemo(() => [
    mealColumns[0], // ppa_name
    mealColumns[1], // author_name
    mealColumns[2], // date
    {
      ...mealColumns[3],
      render: (_: MEALRecord, index: number) => pendingRecordsWithActions[index]?.statusRender
    },
    {
      key: 'actions' as any,
      header: 'Actions',
      className: 'text-right',
      render: (_: MEALRecord, index: number) => pendingRecordsWithActions[index]?.actionsRender
    }
  ], [pendingRecordsWithActions]);

  // Mock users data for demo
  const users = [
    { id: '1', name: 'Admin User', email: 'admin@tcydo.gov', role: 'admin', status: 'active' as const },
    { id: '2', name: 'John Doe', email: 'john.doe@tcydo.gov', role: 'staff' as const, status: 'active' as const },
    // ... more mock users
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('validation')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeSubTab === 'validation' 
              ? 'bg-jewel text-white' 
              : 'bg-frostee/50 text-jewel hover:bg-white/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={18} /> Data Validation ({pendingRecords.length})
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeSubTab === 'users' 
              ? 'bg-jewel text-white' 
              : 'bg-frostee/50 text-jewel hover:bg-white/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} /> User Management
          </div>
        </button>
      </div>

      {activeSubTab === 'validation' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-jewel">Data Validation</h2>
              <p className="text-jewel/70 text-sm">Master control panel for report management</p>
            </div>
            <div className="text-sm text-jewel/70">
              {pendingRecords.length} reports pending review
            </div>
          </div>

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterValue="pending"
            filterOptions={statusOptions}
          />

          <DataTable
            data={records}
            columns={finalColumns}
            searchTerm={searchTerm}
            emptyMessage={
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                <p className="text-jewel/70">All reports have been reviewed!</p>
              </div>
            }
          />
        </>
      )}

      {activeSubTab === 'users' && (
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-jewel">User Management</h2>
              <p className="text-jewel/70 text-sm">Manage system users and their roles</p>
            </div>
            <button className="px-4 py-2 bg-jewel text-white rounded-xl hover:bg-jewel/90 transition-colors flex items-center gap-2">
              <Plus size={18} /> Add User
            </button>
          </div>
          {/* Users table placeholder */}
          <div className="glass rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-frostee/30">
                <tr>
                  <th className="py-4 px-6 font-semibold text-jewel">Name</th>
                  <th className="py-4 px-6 font-semibold text-jewel">Email</th>
                  <th className="py-4 px-6 font-semibold text-jewel">Role</th>
                  <th className="py-4 px-6 font-semibold text-jewel">Status</th>
                  <th className="py-4 px-6 font-semibold text-jewel text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-jewel/5 hover:bg-white/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-jewel/10 rounded-full flex items-center justify-center">
                          <span className="text-jewel font-medium text-sm">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-jewel">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-jewel/80">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={user.status as any} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-jewel hover:bg-white/50 rounded-lg">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function onViewDetails(record: any) {
  throw new Error('Function not implemented.');
}

