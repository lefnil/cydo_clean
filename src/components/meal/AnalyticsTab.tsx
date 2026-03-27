import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, TrendingUp, Target, Users, User, Award, Download 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar 
} from 'recharts';
import type { MEALRecord, MEALAnalyticsData } from '../../types/meal';

interface AnalyticsTabProps {
  records: MEALRecord[];
  analyticsData?: MEALAnalyticsData | null;
  onExportPDF?: () => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ 
  records, 
  analyticsData, 
  onExportPDF 
}) => {
  // Ensure valid data
  const validRecords = records || [];
  
  const computedAnalytics = useMemo(() => {
    // Use provided data or compute from records
    return analyticsData || {
      barangayData: [],
      monthlyData: [],
      ppaClassification: [],
      genderData: [],
      ageDistribution: [],
      sdgGoals: []
    };
  }, [analyticsData]);

  const {
    barangayData = [],
    monthlyData = [],
    ppaClassification = [],
    genderData = [],
    ageDistribution = [],
    sdgGoals = []
  } = computedAnalytics;

  const COLORS = ['#177d49', '#81d2ad', '#f59e0b', '#3b82f6', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-jewel">Analytics Dashboard</h2>
          <p className="text-jewel/70 text-sm">{new Date().getFullYear()} Program Effectiveness Data</p>
        </div>
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="px-4 py-2 bg-jewel text-white rounded-xl hover:bg-jewel/90 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Download size={18} /> Export PDF
          </button>
        )}
      </div>

      {/* Geographic Distribution */}
      <div className="glass rounded-3xl p-6">
        <h3 className="text-lg font-bold text-jewel mb-4 flex items-center gap-2">
          <MapPin size={20} /> Geographic Distribution
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barangayData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#177d49" opacity={0.1} />
              <XAxis type="number" stroke="#177d49" />
              <YAxis dataKey="name" type="category" stroke="#177d49" width={80} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#177d49" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="glass rounded-3xl p-6">
        <h3 className="text-lg font-bold text-jewel mb-4 flex items-center gap-2">
          <TrendingUp size={20} /> Monthly PPA Implementation
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#177d49" opacity={0.1} />
              <XAxis dataKey="month" stroke="#177d49" />
              <YAxis stroke="#177d49" />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="implementations" name="Implementations" stroke="#177d49" strokeWidth={3} />
              <Line type="monotone" dataKey="participants" name="Participants" stroke="#81d2ad" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PPA Classification */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-bold text-jewel mb-4 flex items-center gap-2">
            <Target size={20} /> PPA Classification
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ppaClassification}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ppaClassification.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-bold text-jewel mb-4 flex items-center gap-2">
            <Users size={20} /> Gender Distribution
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#177d49' : '#81d2ad'} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="glass rounded-3xl p-6">
        <h3 className="text-lg font-bold text-jewel mb-4 flex items-center gap-2">
          <User size={20} /> Age Distribution
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#177d49" opacity={0.1} />
              <XAxis dataKey="age" stroke="#177d49" />
              <YAxis stroke="#177d49" />
              <RechartsTooltip />
              <Bar dataKey="count" fill="#177d49" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SDG Goals */}
      {sdgGoals.length > 0 && (
        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-bold text-jewel mb-4 flex items-center gap-2">
            <Award size={20} /> SDG Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sdgGoals.map((sdg, index) => (
              <div key={index} className="p-4 bg-frostee/40 rounded-xl border border-jewel/10">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-jewel text-sm">{sdg.goal}</span>
                  <span className="text-lg font-bold text-jewel">{sdg.count}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-jewel rounded-full" 
                    style={{ width: `${Math.min((sdg.count / 300) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

