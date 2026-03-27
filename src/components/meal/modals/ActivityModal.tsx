import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Check, X, Calendar, Activity } from 'lucide-react';

interface ActivityModalProps {
  isOpen: boolean;
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  title?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
  loading = false,
  title = 'Add Activity'
}) => {
  const [formData, setFormData] = useState({
    activity_name: '',
    assigned_to: '',
    submission_deadline: '',
    reported_status: 'pending'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-frostee rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-jewel/10 rounded-xl">
              <Activity size={20} className="text-jewel" />
            </div>
            <h2 className="text-xl font-bold text-jewel">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Activity Name *</label>
            <input
              type="text"
              value={formData.activity_name}
              onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel outline-none transition-all"
              placeholder="Enter activity name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assigned To *</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel outline-none transition-all"
              placeholder="Enter assignee name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Submission Deadline *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                value={formData.submission_deadline}
                onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <select
              value={formData.reported_status}
              onChange={(e) => setFormData({ ...formData, reported_status: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel outline-none transition-all"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-jewel to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {title.includes('Edit') ? 'Saving...' : 'Creating...'}
                </>
              ) : title.includes('Edit') ? (
                <>
                  <Check size={20} />
                  Update Activity
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Create Activity
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

