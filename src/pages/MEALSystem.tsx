import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { useMealRecords, useActivities, useMealAnalytics } from '../hooks/useMeal';
import { motion } from 'motion/react';
import {
  Plus, Download, Upload, RefreshCw,
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
