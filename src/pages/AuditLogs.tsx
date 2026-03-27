import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Search, Clock } from 'lucide-react';
import { fetchFromGAS } from '../lib/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchFromGAS('get_audit_logs')
      .then(setLogs)
      .catch(console.error);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-jewel">Audit Logs</h1>
          <p className="text-jewel/70 mt-1">Track user actions and maintain accountability.</p>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-jewel/50" size={20} />
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none transition-all placeholder-jewel/40 text-jewel"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-jewel/10">
                <th className="py-3 px-4 font-semibold text-jewel/70">Action</th>
                <th className="py-3 px-4 font-semibold text-jewel/70">User</th>
                <th className="py-3 px-4 font-semibold text-jewel/70">Details</th>
                <th className="py-3 px-4 font-semibold text-jewel/70">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-jewel/5 hover:bg-white/30 transition-colors">
                  <td className="py-4 px-4 font-medium text-jewel">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-jewel/10 rounded-lg text-jewel">
                        <ShieldAlert size={16} />
                      </div>
                      {log.action}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-jewel/80 font-mono text-sm">{log.username || 'System'}</td>
                  <td className="py-4 px-4 text-jewel/80 text-sm max-w-xs truncate">{log.details}</td>
                  <td className="py-4 px-4 text-jewel/60 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-jewel/50">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
