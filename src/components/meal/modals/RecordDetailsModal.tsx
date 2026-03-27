import React from 'react';
import { motion } from 'motion/react';
import { X, FileText, Clock, Users, Calendar, DollarSign, CheckCircle, Edit } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import type { MEALRecord } from '../../../types/meal';
import { getStatusColor, getStatusLabel } from '../../../utils/mealStatus';

interface RecordDetailsModalProps {
  record: MEALRecord | null;
  onClose: () => void;
  canManage?: boolean;
  onEdit?: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({
  record,
  onClose,
  canManage = false,
  onEdit,
  onApprove,
  onReject
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-frostee rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-jewel mb-1">{record.ppa_name}</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={record.status as any} />
              <span className="text-sm text-gray-500">
                Submitted by {record.author_name} on {new Date(record.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all self-start -m-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-2xl text-center">
              <Users size={24} className="mx-auto mb-2 text-jewel" />
              <p className="text-2xl font-bold text-jewel">{record.actual_attendees?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">Attendees</p>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <Calendar size={24} className="mx-auto mb-2 text-jewel" />
              <p className="text-2xl font-bold text-jewel">
                {record.start_date} - {record.end_date}
              </p>
              <p className="text-sm text-gray-600">Duration</p>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <DollarSign size={24} className="mx-auto mb-2 text-jewel" />
              <p className="text-xl font-bold text-jewel">₱{record.budget_utilized?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">Utilized</p>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm font-bold text-green-600">{getStatusLabel(record.status)}</p>
              <p className="text-xs text-gray-500">Status</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-jewel mb-4">Program Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <p className="ml-2 text-jewel">{record.ppa_type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">SDG Goal:</span>
                  <p className="ml-2 text-jewel">{record.sdg_goal}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Center:</span>
                  <p className="ml-2 text-jewel">{record.center_of_participation}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-jewel mb-4">Demographics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Male:</span> {record.male}</div>
                <div><span className="font-medium">Female:</span> {record.female}</div>
                <div><span className="font-medium">15:</span> {record.age_below_14}</div>
                <div><span className="font-medium">15-17:</span> {record.age_15_17}</div>
                <div><span className="font-medium">18-24:</span> {record.age_18_24}</div>
                <div><span className="font-medium">25-30:</span> {record.age_25_30}</div>
                <div><span className="font-medium">30+:</span> {record.age_30_and_above}</div>
              </div>
            </div>
          </div>

          {/* Objectives & Outcomes */}
          {(record.objective_1 || record.highlights) && (
            <div className="space-y-4">
              {record.objective_1 && (
                <div className="glass p-6 rounded-2xl">
                  <h4 className="font-bold text-jewel mb-3">Objectives</h4>
                  <p className="text-gray-800 leading-relaxed">{record.objective_1}</p>
                  {record.objective_2 && <p className="mt-2 text-gray-700">• {record.objective_2}</p>}
                  {record.objective_3 && <p className="mt-2 text-gray-700">• {record.objective_3}</p>}
                </div>
              )}
              {record.highlights && (
                <div className="glass p-6 rounded-2xl">
                  <h4 className="font-bold text-jewel mb-3">Highlights</h4>
                  <p className="text-gray-800 leading-relaxed">{record.highlights}</p>
                </div>
              )}
            </div>
          )}

          {/* Financials */}
          {(record.budget_allocated || record.budget_utilized) && (
            <div className="glass p-6 rounded-2xl">
              <h4 className="font-bold text-jewel mb-4 flex items-center gap-2">
                <DollarSign size={20} /> Financial Summary
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Allocated</p>
                  <p className="text-2xl font-bold text-jewel">₱{record.budget_allocated?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Utilized</p>
                  <p className="text-2xl font-bold text-green-600">₱{record.budget_utilized?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-jewel/20 bg-frostee/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-frostee/60 backdrop-blur-sm border border-jewel/20 text-jewel font-medium rounded-2xl hover:shadow-lg transition-all"
          >
            Close
          </button>
          {canManage && (
            <>
              <button
                onClick={onReject}
                disabled={!onReject}
                className="px-6 py-3 bg-red-100 text-red-700 font-medium rounded-2xl hover:bg-red-200 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <X size={18} />
                Reject
              </button>
              <button
                onClick={onApprove}
                disabled={!onApprove}
                className="px-6 py-3 bg-green-100 text-green-700 font-medium rounded-2xl hover:bg-green-200 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Approve
              </button>
            </>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-6 py-3 bg-jewel text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Edit size={18} />
              Edit
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

