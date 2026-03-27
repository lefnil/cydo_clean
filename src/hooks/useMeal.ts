import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFromGAS } from '../lib/api';
import type { MEALRecord, ActivityMonitor, MEALAnalyticsData } from '../types/meal';
import type { MealStatus, ActivityStatus } from '../utils/mealStatus';
import { calculateAnalytics } from '../utils/pdfExport';

export const useMealRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MEALRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromGAS('get_meal_records', { 
        user_id: user?.id, 
        role: user?.role 
      });
      setRecords(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch records');
      console.error('useMealRecords error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createRecord = async (recordData: Partial<MEALRecord>) => {
    try {
      await fetchFromGAS('create_meal_record', recordData);
      await fetchRecords(); // Refresh
      return true;
    } catch (err) {
      console.error('Create record failed:', err);
      return false;
    }
  };

  const updateStatus = async (id: string, status: MealStatus) => {
    try {
      await fetchFromGAS('update_meal_status', { id, status });
      await fetchRecords();
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  useEffect(() => {
    if (user) fetchRecords();
  }, [fetchRecords, user]);

  return { 
    records, 
    loading, 
    error, 
    refetch: fetchRecords,
    create: createRecord,
    updateStatus 
  };
};

export const useActivities = () => {
  const [activities, setActivities] = useState<ActivityMonitor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFromGAS('get_activities');
      setActivities(data || []);
    } catch (err) {
      console.error('Fetch activities failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createActivity = async (activityData: Omit<ActivityMonitor, 'id'>) => {
    try {
      await fetchFromGAS('create_activity', activityData);
      await fetchActivities();
    } catch (err) {
      console.error('Create activity failed:', err);
    }
  };

  const updateActivity = async (id: string, updates: Partial<ActivityMonitor>) => {
    try {
      await fetchFromGAS('update_activity', { id, ...updates });
      await fetchActivities();
    } catch (err) {
      console.error('Update activity failed:', err);
    }
  };

  const updateStatus = async (id: string, status: ActivityStatus) => {
    await updateActivity(id, { reported_status: status });
  };

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
    create: createActivity,
    update: updateActivity,
    updateStatus
  };
};

export const useMealAnalytics = (records: MEALRecord[]) => {
  return useMemo(() => calculateAnalytics(records), [records]);
};

