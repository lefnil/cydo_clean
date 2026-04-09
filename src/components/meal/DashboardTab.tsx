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
    <div className="space-y-4 sm:space-y-6">
      {/* Status Cards - Responsive Grid */}
      <div className="grid-auto-fit gap-responsive-sm">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-responsive-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-jewel/70 truncate">All Reports</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-jewel mt-1">{stats.total}</h3>
            </div>
            <div className="p-2 sm:p-3 bg-jewel/10 rounded-xl flex-shrink-0">
              <FileText size={20} className="sm:w-6 sm:h-6 text-jewel" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-responsive-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-jewel/70 truncate">Awaiting Review</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{stats.awaitingReview}</h3>
            </div>
            <div className="p-2 sm:p-3 bg-amber-100 rounded-xl flex-shrink-0">
              <Clock size={20} className="sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-responsive-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-jewel/70 truncate">Approved Reports</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{stats.approved}</h3>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-xl flex-shrink-0">
              <CheckCircle size={20} className="sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-responsive-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-jewel/70 truncate">Total Beneficiaries</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-jewel mt-1">{stats.totalBeneficiaries.toLocaleString()}</h3>
            </div>
            <div className="p-2 sm:p-3 bg-jewel/10 rounded-xl flex-shrink-0">
              <Users size={20} className="sm:w-6 sm:h-6 text-jewel" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Recent Table - Stacked on mobile, side-by-side on lg */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-responsive-sm">
          {/* Status Pie Chart */}
          <div className="glass rounded-3xl p-responsive-sm lg:col-span-1">
            <h2 className="text-responsive-heading font-bold text-jewel mb-3 sm:mb-4">Status Breakdown</h2>
            <div className="h-[250px] sm:h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Records Table */}
          <div className="glass rounded-3xl p-responsive-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-jewel/10">
              <h2 className="text-responsive-heading font-bold text-jewel">Recent MEAL Records</h2>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-frostee/50 border border-white/30 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-jewel focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-frostee/20">
                  <tr className="border-b border-jewel/10">
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-jewel/70 whitespace-nowrap">Project</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-jewel/70 whitespace-nowrap">Author</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-jewel/70 whitespace-nowrap">Date</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-jewel/70 whitespace-nowrap">Status</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-jewel/70 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice(0, 5).map((record) => (
                    <tr key={record.id} className="border-b border-jewel/5 hover:bg-white/30 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-jewel font-medium truncate max-w-[120px]">{record.ppa_name}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-jewel/70 truncate max-w-[100px]">{record.author_name}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-jewel/70 whitespace-nowrap">
                        {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <StatusBadge status={record.status as any} />
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-right">
                        <button 
                          onClick={() => onViewDetails(record)}
                          className="text-jewel hover:text-jewel/70 text-xs sm:text-sm font-medium whitespace-nowrap"
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

