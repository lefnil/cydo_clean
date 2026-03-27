import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowRight, Download, AlertCircle, FileText, Users, Eye, Clock, CheckCircle, BarChart3, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { exportToPDF } from '../utils/pdfExport';
import { fetchFromGAS } from '../lib/api';
import type { DashboardStats, ChartDataPoint, StaffStats } from '../types/dashboard';
import type { MEALRecord, SKLYDCAnalyticsData } from '../types/meal';

const COLORS = {
  sk: '#177d49',
  lydc: '#81d2ad',
  meal: '#3b82f6',
  extra: ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
};

const fmt = (n: number) => n.toLocaleString();
const peso = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const { user } = useAuth();

  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff states
  const [staffRecords, setStaffRecords] = useState<MEALRecord[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Analytics states
  const [skLydcData, setSkLydcData] = useState<any | null>(null);
  const [mealData, setMealData] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  // Main dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchFromGAS('get_dashboard_stats');
        if (response && typeof response === 'object') {
          setStatsData(response as DashboardStats);
          setChartData(Array.isArray(response.chartData) ? response.chartData : []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setAnalyticsLoading(true);
        const analyticsResRaw = await fetchFromGAS('get_analytics');
        const mealResRaw = await fetchFromGAS('get_meal_analytics');
        setSkLydcData(analyticsResRaw && typeof analyticsResRaw === 'object' ? analyticsResRaw : null);
        setMealData(mealResRaw && typeof mealResRaw === 'object' ? mealResRaw : null);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Staff data
  useEffect(() => {
    if (user?.role === 'staff') {
      const fetchStaffData = async () => {
        try {
          setStaffLoading(true);
          setStaffError(null);
          const records = await fetchFromGAS('get_meal_records', { user_id: user.id, role: user.role });
          setStaffRecords(records || []);

          if (Array.isArray(records)) {
            const stats = {
              total: records.length,
              awaitingReview: records.filter((r: MEALRecord) => r.status === 'pending' || r.status === 'under_review').length,
              approved: records.filter((r: MEALRecord) => r.status === 'approved' || r.status === 'completed').length,
              totalBeneficiaries: records.reduce((sum: number, r: MEALRecord) => sum + (r.actual_attendees || 0), 0),
              recentRecords: records.slice(0, 5).sort((a: MEALRecord, b: MEALRecord) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            };
            setStaffStats(stats);
          }
        } catch (err) {
          console.error('Staff dashboard fetch error:', err);
          setStaffError(err instanceof Error ? err.message : 'Failed to fetch MEAL data');
        } finally {
          setStaffLoading(false);
        }
      };

      fetchStaffData();
    }
  }, [user]);

interface Stat {
  label: string;
  value: string;
  icon: any;
  color: string;
  bg: string;
}

const stats: Stat[] = statsData ? [
    { label: 'Pending SK Reports', value: String(statsData.pendingSK), icon: FileText, color: 'text-jewel', bg: 'bg-jewel/10' },
    { label: 'Pending LYDC Reports', value: String(statsData.pendingLYDC), icon: FileText, color: 'text-vista', bg: 'bg-vista/10' },
    { label: 'Active Youth Councils', value: String(statsData.councils), icon: Users, color: 'text-deyork', bg: 'bg-deyork/10' },
    { label: 'Recent Activities', value: String(statsData.recentActivities), icon: Activity, color: 'text-jewel', bg: 'bg-jewel/10' },
  ] : [];

  // Analytics derived data (from original Analytics.tsx)
  const skCount = skLydcData?.summary?.skReports ?? 0;
  const lydcCount = skLydcData?.summary?.lydcReports ?? 0;
  const mealCount = mealData?.totalRecords ?? 0;
  const totalAll = skCount + lydcCount + mealCount;

  const reportTypePie = [
    { name: 'SK Reports', value: skCount },
    { name: 'LYDC Reports', value: lydcCount },
    { name: 'MEAL Records', value: mealCount },
  ];
  const pieColors = [COLORS.sk, COLORS.lydc, COLORS.meal];

  const monthlyTrend = (skLydcData?.monthlyData ?? []).map((pt: any) => ({
    month: pt.month,
    SK: pt.skReports ?? pt.SK ?? 0,
    LYDC: pt.lydcReports ?? pt.LYDC ?? 0,
  }));

  const mealMonthly = mealData?.monthlyData ?? [];
  const mealStatusPie = (mealData?.statusBreakdown ?? []).map((s, i) => ({
    ...s,
    fill: [COLORS.sk, COLORS.lydc, COLORS.meal, ...COLORS.extra][i % COLORS.extra.length] ?? '#ccc',
  }));

  const vulnBar = Object.entries(mealData?.vulnerableGroups ?? {}).map(([key, val]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: val as number,
  }));

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 bg-jewel/20 rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-jewel/20 rounded w-96 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <motion.div key={i} className="glass rounded-2xl p-6 flex items-start justify-between animate-pulse">
              <div>
                <div className="h-4 bg-jewel/20 rounded w-24 mb-3" />
                <div className="h-8 bg-jewel/20 rounded w-16" />
              </div>
              <div className="w-12 h-12 bg-jewel/20 rounded-xl" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-jewel">Welcome back, {user?.name}</h1>
          <p className="text-jewel/70 mt-1">Here's what's happening in Tagum City Youth Development today.</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'sk' && (
            <Link to="/sk-reports" className="px-4 py-2 bg-jewel text-white rounded-xl shadow-lg shadow-jewel/30 hover:bg-jewel/90 transition-all flex items-center gap-2">
              Submit SK Report <ArrowRight size={16} />
            </Link>
          )}
          {user?.role === 'lydc' && (
            <Link to="/lydc-reports" className="px-4 py-2 bg-vista text-white rounded-xl shadow-lg shadow-vista/30 hover:bg-vista/90 transition-all flex items-center gap-2">
              Submit LYDC Report <ArrowRight size={16} />
            </Link>
          )}
          {user?.role === 'staff' && (
            <Link to="/meal" className="px-4 py-2 bg-jewel text-white rounded-xl shadow-lg shadow-jewel/30 hover:bg-jewel/90 transition-all flex items-center gap-2">
              Access MEAL System <ArrowRight size={16} />
            </Link>
          )}
          {user?.role === 'office_head' && (
            <>
              <Link to="/sk-reports" className="px-4 py-2 bg-jewel text-white rounded-xl shadow-lg shadow-jewel/30 hover:bg-jewel/90 transition-all flex items-center gap-2">
                SK Reports <ArrowRight size={16} />
              </Link>
              <Link to="/lydc-reports" className="px-4 py-2 bg-vista text-white rounded-xl shadow-lg shadow-vista/30 hover:bg-vista/90 transition-all flex items-center gap-2">
                LYDC Reports <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Staff MEAL Dashboard */}
      {user?.role === 'staff' && (
        <>
          {staffLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <motion.div key={i} className="glass rounded-2xl p-6 flex items-start justify-between animate-pulse">
                  <div>
                    <div className="h-4 bg-jewel/20 rounded w-24 mb-3" />
                    <div className="h-8 bg-jewel/20 rounded w-16" />
                  </div>
                  <div className="w-12 h-12 bg-jewel/20 rounded-xl" />
                </motion.div>
              ))}
            </div>
          ) : staffError ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 flex items-center gap-4 text-jewel/80 mb-6">
              <AlertCircle size={24} />
              <div>
                <p className="font-medium">Failed to load MEAL stats</p>
                <p className="text-sm">{staffError}</p>
              </div>
            </motion.div>
          ) : staffStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'All MEAL Reports', value: staffStats.total.toString(), icon: FileText, color: 'text-jewel', bg: 'bg-jewel/10' },
                  { label: 'Awaiting Review', value: staffStats.awaitingReview.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
                  { label: 'Approved Reports', value: staffStats.approved.toString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
                  { label: 'Total Beneficiaries', value: staffStats.totalBeneficiaries.toLocaleString(), icon: Users, color: 'text-jewel', bg: 'bg-jewel/10' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-6 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-jewel/70 mb-1">{stat.label}</p>
                        <h3 className={`text-3xl font-bold ${stat.color}`}>
                          {stat.value}
                        </h3>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        <Icon size={24} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {staffStats.recentRecords && staffStats.recentRecords.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-jewel">Recent MEAL Records</h2>
                      <p className="text-sm text-jewel/70">Your latest submissions</p>
                    </div>
                    <Link to="/meal" className="flex items-center gap-2 px-4 py-2 bg-jewel text-white rounded-xl hover:bg-jewel/90 transition-all text-sm font-medium">
                      View All <ArrowRight size={16} />
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-jewel/10">
                          <th className="py-3 px-4 font-semibold text-jewel/70 text-sm">PPA Name</th>
                          <th className="py-3 px-4 font-semibold text-jewel/70 text-sm">Status</th>
                          <th className="py-3 px-4 font-semibold text-jewel/70 text-sm">Submitted</th>
                          <th className="py-3 px-4 font-semibold text-jewel/70 text-sm text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffStats.recentRecords.map((record) => (
                          <tr key={record.id} className="border-b border-jewel/5 hover:bg-white/30">
                            <td className="py-4 px-4 font-medium text-jewel text-sm max-w-xs truncate">{record.ppa_name}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === 'approved' || record.status === 'completed' ? 'bg-green-100 text-green-700' :
                                record.status === 'pending' || record.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-jewel/70 text-sm">
                              {new Date(record.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Link to="/meal" className="text-jewel hover:text-jewel/70 text-sm font-medium flex items-center gap-1">
                                View <Eye size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Admin tabs */}
      {user?.role === 'admin' && (
        <>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 ${activeTab === 'overview' ? 'bg-jewel text-white shadow-lg shadow-jewel/30' : 'glass hover:bg-white/50'}`}>
              <BarChart3 size={18} />
              Overview
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-jewel text-white shadow-lg shadow-jewel/30' : 'glass hover:bg-white/50'}`}>
              <TrendingUp size={18} />
              Analytics
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              {error ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 flex items-center gap-4 text-jewel/80">
                  <AlertCircle size={24} />
                  <div>
                    <p className="font-medium">Failed to load dashboard data</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass rounded-2xl p-6 flex items-start justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-jewel/70 mb-1">{stat.label}</p>
                          <h3 className="text-3xl font-bold text-jewel">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                          <Icon size={24} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
                {/* Original Dashboard chart */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-jewel">Report Submissions</h2>
                    <p className="text-sm text-jewel/70">Monthly overview of SK and LYDC reports</p>
                  </div>
                  <button onClick={() => exportToPDF(chartData, 'report_submissions')} disabled={chartData.length === 0} className="flex items-center gap-2 px-4 py-2 bg-frostee/50 hover:bg-white/80 text-jewel rounded-xl transition-colors text-sm font-medium border border-jewel/10 disabled:opacity-50">
                    <Download size={16} />
                    Export PDF
                  </button>
                </div>
                <div className="h-[300px]">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-jewel/60">
                      No chart data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#177d49" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#177d49" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorLydc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#81d2ad" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#81d2ad" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#177d49" opacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#177d49', opacity: 0.7, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#177d49', opacity: 0.7, fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid rgba(23, 125, 73, 0.1)' }} />
                        <Area type="monotone" dataKey="skReports" name="SK Reports" stroke="#177d49" strokeWidth={3} fillOpacity={1} fill="url(#colorSk)" />
                        <Area type="monotone" dataKey="lydcReports" name="LYDC Reports" stroke="#81d2ad" strokeWidth={3} fillOpacity={1} fill="url(#colorLydc)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              {/* Complete Analytics from original Analytics.tsx */}
              {analyticsLoading ? (
                <div className="min-h-[600px] flex items-center justify-center">
                  <div className="glass rounded-2xl p-12 max-w-md w-full mx-4 flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-24 h-24 border-4 border-jewel/30 border-t-jewel rounded-full animate-spin mx-auto mb-6" />
                    <div className="text-2xl font-bold text-jewel text-center">Loading Analytics...</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Report Type Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Reports', value: fmt(totalAll), color: 'text-jewel' },
                      { label: 'SK Reports', value: fmt(skCount), color: 'text-jewel' },
                      { label: 'LYDC Reports', value: fmt(lydcCount), color: 'text-vista' },
                      { label: 'MEAL Records', value: fmt(mealCount), color: 'text-blue-600' },
                    ].map((s) => (
                      <div key={s.label} className="glass rounded-3xl p-6 text-center">
                        <p className="text-sm font-medium text-jewel/70 mb-2">{s.label}</p>
                        <h3 className={`text-4xl font-bold ${s.color}`}>{s.value}</h3>
                      </div>
                    ))}
                  </div>

                  {/* MEAL KPI if available */}
                  {mealData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Beneficiaries', value: fmt(mealData.totalBeneficiaries) },
                        { label: 'Avg Budget Utilization', value: `${mealData.averageBudgetUtilization?.toFixed(1)}%` },
                      ].map((s) => (
                        <div key={s.label} className="glass rounded-3xl p-6 text-center">
                          <p className="text-sm font-medium text-jewel/70 mb-2">{s.label}</p>
                          <h3 className="text-2xl font-bold text-jewel">{s.value}</h3>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submission Type Pie */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass rounded-3xl p-6">
                      <h2 className="text-xl font-bold text-jewel mb-6">Submissions by Type</h2>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={reportTypePie} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                              {reportTypePie.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Monthly Trend Bar */}
                    <div className="glass rounded-3xl p-6">
                      <h2 className="text-xl font-bold text-jewel mb-6">Monthly SK & LYDC Trend</h2>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff50" vertical={false} />
                            <XAxis dataKey="month" stroke="#177d49" />
                            <YAxis stroke="#177d49" />
                            <Tooltip />
                            <Bar dataKey="SK" stackId="a" fill={COLORS.sk} radius={[0, 0, 4, 4]} />
                            <Bar dataKey="LYDC" stackId="a" fill={COLORS.lydc} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* More charts... */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* MEAL Monthly */}
                    <div className="glass rounded-3xl p-6">
                      <h2 className="text-xl font-bold text-jewel mb-6">MEAL Monthly Trend</h2>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mealMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradImpl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.meal} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={COLORS.meal} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#177d49" opacity={0.1} />
                            <XAxis dataKey="month" stroke="#177d49" />
                            <YAxis stroke="#177d49" />
                            <Tooltip />
                            <Area type="monotone" dataKey="implementations" stroke={COLORS.meal} fillOpacity={1} fill="url(#gradImpl)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Vulnerable Groups */}
                    <div className="glass rounded-3xl p-6">
                      <h2 className="text-xl font-bold text-jewel mb-6">Vulnerable Sectors</h2>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={vulnBar.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#177d49" opacity={0.1} />
                            <XAxis type="number" stroke="#177d49" />
                            <YAxis type="category" dataKey="name" stroke="#177d49" width={120} />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.sk} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Age Distribution Radar */}
                  <div className="glass rounded-3xl p-6">
                    <h2 className="text-xl font-bold text-jewel mb-6">Age Distribution</h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={mealData?.ageDistribution ?? []} cx="50%" cy="50%" outerRadius={100}>
                          <PolarGrid stroke="#177d49" opacity={0.2} />
                          <PolarAngleAxis dataKey="age" tick={{ fill: '#177d49', fontSize: 12 }} />
                          <Radar name="Count" dataKey="count" stroke={COLORS.meal} fill={COLORS.meal} fillOpacity={0.35} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
