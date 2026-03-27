import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { FileText, Plus, Search, CheckCircle, Clock, Download, X } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { fetchFromGAS } from '../lib/api';

export default function SKReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user can approve reports (admin or office_head)
  const canApprove = user?.role === 'admin' || user?.role === 'office_head';

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setError(null);
    try {
      const data = await fetchFromGAS('get_sk_reports', { user_id: user?.id, role: user?.role }).catch(err => {
        console.error('SK Reports API Error:', err);
        throw new Error('Backend not available. Configure VITE_GAS_URL in .env.local with your Google Apps Script URL.');
      });
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setError(error.message || 'Failed to load reports. Please check your GAS backend configuration.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchFromGAS('create_sk_report', { 
        user_id: user?.id,
        author_name: user?.name,
        title, 
        content 
      });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle approve report
  const handleApprove = async (reportId: string) => {
    try {
      await fetchFromGAS('update_sk_report_status', {
        id: reportId,
        status: 'approved'
      });
      fetchReports();
    } catch (error) {
      console.error('Error approving report:', error);
      // Fallback to local update
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status: 'approved' } : r
      ));
    }
  };

  // Handle reject report
  const handleReject = async (reportId: string) => {
    try {
      await fetchFromGAS('update_sk_report_status', {
        id: reportId,
        status: 'rejected'
      });
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      // Fallback to local update
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status: 'rejected' } : r
      ));
    }
  };

  const statusData = useMemo(() => {
    if (!Array.isArray(reports)) {
      return [];
    }
    const counts = reports.reduce((acc, report) => {
      const status = report.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [reports]);

  const COLORS = ['#177d49', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-jewel">SK Reports</h1>
          <p className="text-jewel/70 mt-1">Manage and view Sangguniang Kabataan submissions.</p>
        </div>
      </div>

      {error && (
        <div className="glass rounded-3xl p-6 bg-red-50/50 border border-red-200">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-red-500/70 text-sm mt-1">Please configure VITE_GAS_URL in your .env.local file to connect to your Google Apps Script backend.</p>
          <button 
            onClick={fetchReports}
            className="mt-3 px-4 py-2 bg-jewel text-white rounded-xl hover:bg-jewel/90 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex gap-3">
        {canApprove && (
          <>
            <button
              onClick={() => exportToPDF(reports, 'sk_reports')}
              className="px-4 py-2 bg-frostee/50 hover:bg-white/80 text-jewel rounded-xl transition-colors text-sm font-medium border border-jewel/10 flex items-center gap-2"
            >
              <Download size={20} /> Export PDF
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-jewel text-white rounded-xl shadow-lg shadow-jewel/30 hover:bg-jewel/90 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> New Report
            </button>
          </>
        )}
        {!canApprove && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-jewel text-white rounded-xl shadow-lg shadow-jewel/30 hover:bg-jewel/90 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> New Report
          </button>
        )}
      </div>

      {reports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass rounded-3xl p-6 lg:col-span-1 flex flex-col items-center justify-center">
            <h2 className="text-lg font-bold text-jewel mb-4 w-full text-left">Report Status Overview</h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="glass rounded-3xl p-6 lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-jewel/50" size={20} />
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="w-full pl-10 pr-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none transition-all placeholder-jewel/40 text-jewel"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-jewel/10">
                <th className="py-3 px-4 font-semibold text-jewel/70">Title</th>
                {(user?.role === 'admin' || user?.role === 'office_head') && <th className="py-3 px-4 font-semibold text-jewel/70">Author</th>}
                <th className="py-3 px-4 font-semibold text-jewel/70">Date Submitted</th>
                <th className="py-3 px-4 font-semibold text-jewel/70">Status</th>
                <th className="py-3 px-4 font-semibold text-jewel/70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-jewel/5 hover:bg-white/30 transition-colors">
                  <td className="py-4 px-4 font-medium text-jewel">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-jewel/10 rounded-lg text-jewel">
                        <FileText size={16} />
                      </div>
                      {report.title}
                    </div>
                  </td>
                  {(user?.role === 'admin' || user?.role === 'office_head') && <td className="py-4 px-4 text-jewel/80">{report.author}</td>}
                  <td className="py-4 px-4 text-jewel/80">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      (report.status || 'pending') === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {(report.status || 'pending') === 'approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {(report.status || 'pending').charAt(0).toUpperCase() + (report.status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {canApprove && report.status !== 'approved' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(report.id)}
                          className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button 
                          onClick={() => handleReject(report.id)}
                          className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="text-jewel hover:text-jewel/70 font-medium text-sm"
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="text-jewel hover:text-jewel/70 font-medium text-sm"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </div>
        </div>
      )}

      {reports.length === 0 && (
        <div className="glass rounded-3xl p-6 text-center py-12">
          <p className="text-jewel/50">No reports found.</p>
        </div>
      )}

      {/* Create Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-jewel">Submit New SK Report</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                  placeholder="e.g., Q3 Financial Statement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content / Description</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none resize-none"
                  placeholder="Provide details about the report..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-jewel text-white rounded-xl shadow-lg shadow-jewel/30 hover:bg-jewel/90 transition-all disabled:opacity-70"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-jewel">Report Details</h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                <p className="text-jewel font-medium">{selectedReport.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Author</label>
                <p className="text-jewel">{selectedReport.author}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date Submitted</label>
                <p className="text-jewel">{new Date(selectedReport.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  (selectedReport.status || 'pending') === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {(selectedReport.status || 'pending') === 'approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {((selectedReport.status || 'pending') as string).charAt(0).toUpperCase() + (selectedReport.status || 'pending').slice(1)}
                </span>
              </div>
              {(user?.role === 'admin' || user?.role === 'office_head') && selectedReport.status !== 'approved' && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await fetchFromGAS('update_sk_report_status', {
                          id: selectedReport.id,
                          status: 'approved'
                        });
                        setSelectedReport({ ...selectedReport, status: 'approved' });
                        fetchReports();
                      } catch (error) {
                        console.error('Error approving report:', error);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Approve Report
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Content</label>
                <p className="text-jewel bg-gray-50 p-3 rounded-lg">{selectedReport.content}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-jewel text-white rounded-xl hover:bg-jewel/90 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
