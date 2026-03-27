import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Clock, CheckCircle, Users 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { StatusBadge } from './ui/StatusBadge';
import type { MEALRecord } from '../../types/meal';
import { getStatusLabel } from '../../utils/mealStatus';

interface DashboardTabProps {
  records: MEALRecord[];
  onViewDetails: (record: MEALRecord) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ 
  records, 
  onViewDetails 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(r => 
    r.ppa_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: records.length,
    awaitingReview: records.filter(r => r.status === 'pending' || r.status === 'under_review').length,
    approved: records.filter(r => r.status === 'approved' || r.status === 'completed').length,
    totalBeneficiaries: records.reduce((sum, r) => sum + (r.actual_attendees || 0), 0),
  }), [records]);

  const statusData = useMemo(() => {
    const counts = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: getStatusLabel(name),
      value
    }));
  }, [records]);

  const COLORS = ['#177d49', '#f59e0b', '#3b82f6', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-jewel/70">All Reports</p>
              <h3 className="text-3xl font-bold text-jewel">{stats.total}</h3>
            </div>
            <div className="p-3 bg-jewel/10 rounded-xl">
              <FileText size={24} className="text-jewel" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-jewel/70">Awaiting Review</p>
              <h3 className="text-3xl font-bold text-amber-600">{stats.awaitingReview}</h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock size={24} className="text-amber-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-jewel/70">Approved Reports</p>
              <h3 className="text-3xl font-bold text-green-600">{stats.approved}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-jewel/70">Total Beneficiaries</p>
              <h3 className="text-3xl font-bold text-jewel">{stats.totalBeneficiaries.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-jewel/10 rounded-xl">
              <Users size={24} className="text-jewel" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Recent Table */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Pie Chart */}
          <div className="glass rounded-3xl p-6 lg:col-span-1">
            <h2 className="text-lg font-bold text-jewel mb-4">Status Breakdown</h2>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Records Table */}
          <div className="glass rounded-3xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-jewel">Recent MEAL Records</h2>
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-frostee/50 border border-white/30 rounded-xl text-sm focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-jewel/10">
                    <th className="py-3 px-3 font-semibold text-jewel/70 text-sm">Project Name</th>
                    <th className="py-3 px-3 font-semibold text-jewel/70 text-sm">Author</th>
                    <th className="py-3 px-3 font-semibold text-jewel/70 text-sm">Date</th>
                    <th className="py-3 px-3 font-semibold text-jewel/70 text-sm">Status</th>
                    <th className="py-3 px-3 font-semibold text-jewel/70 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice(0, 5).map((record) => (
                    <tr key={record.id} className="border-b border-jewel/5 hover:bg-white/30">
                      <td className="py-3 px-3 text-jewel font-medium text-sm">{record.ppa_name}</td>
                      <td className="py-3 px-3 text-jewel/70 text-sm">{record.author_name}</td>
                      <td className="py-3 px-3 text-jewel/70 text-sm">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={record.status as any} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => onViewDetails(record)}
                          className="text-jewel hover:text-jewel/70 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

