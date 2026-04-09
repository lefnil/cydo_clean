import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { exportToPDF } from '../utils/pdfExport';
import { 
  Users, FileText, Activity, BarChart3, CheckCircle, Clock, 
  Download, Search, Edit, Trash2, Check, Plus, X, AlertCircle,
  KeyRound
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  Legend, LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { fetchFromGAS } from '../lib/api';

interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  totalBeneficiaries: number;
  activeActivities: number;
}

interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface ReportRecord {
  id: string;
  title: string;
  author_name: string;
  status: string;
  created_at: string;
  type: 'sk' | 'lydc' | 'meal';
}

interface ActivityRecord {
  id: string;
  activity_name: string;
  assigned_to: string;
  submission_deadline: string;
  reported_status: string;
}

interface NewUserForm {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  role: string;
}

const COLORS = ['#177d49', '#81d2ad', '#f59e0b', '#3b82f6', '#ef4444'];

export default function Administration() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'reports' | 'activities'>('overview');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    role: 'staff'
  });

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [editUser, setEditUser] = useState<Partial<UserRecord>>({});

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Activity Modal State
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [editActivity, setEditActivity] = useState<Partial<ActivityRecord>>({});

  // Password Reset Modal State
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, skReports, lydcReports, activitiesData, mealRecords] = await Promise.all([
        fetchFromGAS('get_users').catch(() => []),
        fetchFromGAS('get_sk_reports', { user_id: user?.id, role: 'admin' }).catch(() => []),
        fetchFromGAS('get_lydc_reports', { user_id: user?.id, role: 'admin' }).catch(() => []),
        fetchFromGAS('get_activities').catch(() => []),
        fetchFromGAS('get_meal_records').catch(() => [])
      ]);

      setUsers(usersData || []);

      const allReports: ReportRecord[] = [
        ...(skReports || []).map((r: any) => ({ ...r, type: 'sk' as const })),
        ...(lydcReports || []).map((r: any) => ({ ...r, type: 'lydc' as const })),
        ...(mealRecords || []).map((r: any) => ({ ...r, title: r.project_name, type: 'meal' as const }))
      ];
      setReports(allReports);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setUsers([
        { id: '1', username: 'admin', name: 'System Administrator', email: 'admin@tcydo.gov', role: 'admin', status: 'active', created_at: '2026-01-01' },
        { id: '2', username: 'sk_user', name: 'SK Representative', email: 'sk@barangay.gov', role: 'sk', status: 'active', created_at: '2026-01-05' },
        { id: '3', username: 'lydc_user', name: 'LYDC Representative', email: 'lydc@tcydo.gov', role: 'lydc', status: 'active', created_at: '2026-01-05' },
        { id: '4', username: 'staff1', name: 'John Doe', email: 'john@tcydo.gov', role: 'staff', status: 'active', created_at: '2026-01-10' },
        { id: '5', username: 'staff2', name: 'Jane Smith', email: 'jane@tcydo.gov', role: 'staff', status: 'inactive', created_at: '2026-01-12' },
      ]);
      setReports([
        { id: '1', title: 'Q3 Financial Report', author_name: 'SK Rep', status: 'approved', created_at: '2026-01-15', type: 'sk' },
        { id: '2', title: 'Youth Summit Proposal', author_name: 'LYDC Coord', status: 'pending', created_at: '2026-01-20', type: 'lydc' },
        { id: '3', title: 'Skills Training Program', author_name: 'John Doe', status: 'under_review', created_at: '2026-01-22', type: 'meal' },
        { id: '4', title: 'Sports Fest Report', author_name: 'SK Rep', status: 'approved', created_at: '2026-01-18', type: 'sk' },
        { id: '5', title: 'Health Campaign', author_name: 'Jane Smith', status: 'active', created_at: '2026-01-25', type: 'meal' },
      ]);
      setActivities([
        { id: '1', activity_name: 'Q4 Youth Summit', assigned_to: 'John Doe', submission_deadline: '2026-12-15', reported_status: 'pending' },
        { id: '2', activity_name: 'Barangay Training', assigned_to: 'Jane Smith', submission_deadline: '2026-12-20', reported_status: 'in_progress' },
        { id: '3', activity_name: 'Community Outreach', assigned_to: 'Mike Johnson', submission_deadline: '2026-12-10', reported_status: 'submitted' },
        { id: '4', activity_name: 'Leadership Workshop', assigned_to: 'Sarah Lee', submission_deadline: '2026-12-05', reported_status: 'overdue' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo((): DashboardStats => ({
    totalUsers: users.length,
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'pending' || r.status === 'under_review').length,
    approvedReports: reports.filter(r => r.status === 'approved' || r.status === 'completed').length,
    totalBeneficiaries: 1245,
    activeActivities: activities.filter(a => a.reported_status !== 'approved' && a.reported_status !== 'overdue').length,
  }), [users, reports, activities]);

  const reportStatusData = useMemo(() => {
    if (!Array.isArray(reports)) {
      return [];
    }
    const counts = reports.reduce((acc, r) => {
      const status = r.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const userRoleData = useMemo(() => {
    const counts = users.reduce((acc, u) => {
      const role = u.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [users]);

  const monthlyData = [
    { month: 'Jan', reports: 12, users: 5 },
    { month: 'Feb', reports: 15, users: 6 },
    { month: 'Mar', reports: 18, users: 6 },
    { month: 'Apr', reports: 14, users: 7 },
    { month: 'May', reports: 20, users: 8 },
    { month: 'Jun', reports: 22, users: 8 },
  ];

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(r => {
    const matchesSearch = (r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.author_name?.toLowerCase().includes(searchTerm.toLowerCase())) || false;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    if (status === 'approved' || status === 'completed' || status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'pending' || status === 'under_review') return 'bg-amber-100 text-amber-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getRoleBadge = (role: string | undefined) => {
    if (!role) return 'bg-gray-100 text-gray-700';
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'sk': return 'bg-blue-100 text-blue-700';
      case 'lydc': return 'bg-green-100 text-green-700';
      case 'staff': return 'bg-gray-100 text-gray-700';
      case 'meal_head': return 'bg-amber-100 text-amber-700';
      case 'office_head': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatReportedStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  // Handle Create User Form Submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validate passwords match
    if (newUser.password !== newUser.confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    // Validate required fields
    if (!newUser.username || !newUser.password || !newUser.name || !newUser.email) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    // Validate password length
    if (newUser.password.length < 6) {
      setSubmitError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await fetchFromGAS('create_user', {
        username: newUser.username,
        password: newUser.password,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'active'
      });

      // Refresh users list
      const usersData = await fetchFromGAS('get_users');
      setUsers(usersData || []);

      // Show success and reset form
      setSubmitSuccess(true);
      setNewUser({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        role: 'staff'
      });

      // Close modal after short delay
      setTimeout(() => {
        setShowAddUserModal(false);
        setSubmitSuccess(false);
      }, 1500);

    } catch (error: any) {
      console.error('Error creating user:', error);
      setSubmitError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewUser({
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      role: 'staff'
    });
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Handle Edit User Click
  const handleEditUserClick = (user: UserRecord) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowEditUserModal(true);
  };

  // Handle Delete User Click
  const handleDeleteUserClick = (user: UserRecord) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  // Handle Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editUser.name || !editUser.email) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await fetchFromGAS('update_user', {
        id: selectedUser.id,
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        status: editUser.status
      });

      // Refresh users list
      const usersData = await fetchFromGAS('get_users');
      setUsers(usersData || []);

      // Show success and close modal
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowEditUserModal(false);
        setSelectedUser(null);
        setEditUser({});
        setSubmitSuccess(false);
      }, 1500);

    } catch (error: any) {
      console.error('Error updating user:', error);
      setSubmitError(error.message || 'Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete User
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);

    try {
      await fetchFromGAS('delete_user', {
        id: deletingUser.id
      });

      // Refresh users list
      const usersData = await fetchFromGAS('get_users');
      setUsers(usersData || []);

      // Close modal
      setShowDeleteModal(false);
      setDeletingUser(null);

    } catch (error: any) {
      console.error('Error deleting user:', error);
      setSubmitError(error.message || 'Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Edit Activity Click
  const handleEditActivityClick = (activity: ActivityRecord) => {
    setSelectedActivity(activity);
    setEditActivity({
      activity_name: activity.activity_name,
      assigned_to: activity.assigned_to,
      submission_deadline: activity.submission_deadline
    });
    setShowEditActivityModal(true);
  };

  // Handle View Activity Details
  const handleViewActivityDetails = (activity: ActivityRecord) => {
    setSelectedActivity(activity);
  };

  // Handle Close Activity Details
  const handleCloseActivityDetails = () => {
    setSelectedActivity(null);
  };

  // Handle Mark Activity Complete
  const handleMarkActivityComplete = async (activity: ActivityRecord) => {
    try {
      await fetchFromGAS('update_activity', {
        id: activity.id,
        reported_status: 'approved'
      });

      // Refresh activities list
      const activitiesData = await fetchFromGAS('get_activities');
      setActivities(activitiesData || []);

    } catch (error: any) {
      console.error('Error marking activity complete:', error);
      // Fallback to local update
      setActivities(activities.map(a => 
        a.id === activity.id ? { ...a, reported_status: 'approved' } : a
      ));
    }
  };

  // Handle Update Activity
  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !editActivity.activity_name || !editActivity.assigned_to) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await fetchFromGAS('update_activity', {
        id: selectedActivity.id,
        activity_name: editActivity.activity_name,
        assigned_to: editActivity.assigned_to,
        submission_deadline: editActivity.submission_deadline
      });

      // Refresh activities list
      const activitiesData = await fetchFromGAS('get_activities');
      setActivities(activitiesData || []);

      // Close modal
      setShowEditActivityModal(false);
      setSelectedActivity(null);
      setEditActivity({});

    } catch (error: any) {
      console.error('Error updating activity:', error);
      // Fallback to local update
      setActivities(activities.map(a => 
        a.id === selectedActivity.id ? {
          ...a,
          activity_name: editActivity.activity_name || a.activity_name,
          assigned_to: editActivity.assigned_to || a.assigned_to,
          submission_deadline: editActivity.submission_deadline || a.submission_deadline
        } : a
      ));
      setShowEditActivityModal(false);
      setSelectedActivity(null);
      setEditActivity({});
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Reset Click
  const handlePasswordResetClick = (user: UserRecord) => {
    setPasswordResetUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setSubmitError(null);
    setShowPasswordResetModal(true);
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await fetchFromGAS('reset_password', {
        id: passwordResetUser?.id,
        new_password: newPassword
      });

      // Show success and close modal
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowPasswordResetModal(false);
        setPasswordResetUser(null);
        setNewPassword('');
        setConfirmNewPassword('');
        setSubmitSuccess(false);
      }, 1500);

    } catch (error: any) {
      console.error('Error resetting password:', error);
      setSubmitError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-jewel">Admin Dashboard</h1>
          <p className="text-jewel/70 mt-1">System overview and management</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportToPDF(reports, 'all_reports')}
            className="px-4 py-2 bg-frostee/50 hover:bg-white/80 text-jewel rounded-xl transition-colors text-sm font-medium border border-jewel/10 flex items-center gap-2"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="glass rounded-2xl p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'activities', label: 'Activities', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeSubTab === tab.id
                  ? 'bg-jewel text-white'
                  : 'bg-frostee/50 font-semibold text-deyork hover:bg-white/100'
              }`}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-jewel/10 rounded-lg">
                  <Users size={20} className="text-jewel" />
                </div>
                <div>
                  <p className="text-xs text-jewel/70">Total Users</p>
                  <p className="text-xl font-bold text-jewel">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-jewel/70">Total Reports</p>
                  <p className="text-xl font-bold text-jewel">{stats.totalReports}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-jewel/70">Pending</p>
                  <p className="text-xl font-bold text-amber-600">{stats.pendingReports}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-jewel/70">Approved</p>
                  <p className="text-xl font-bold text-green-600">{stats.approvedReports}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-jewel/70">Beneficiaries</p>
                  <p className="text-xl font-bold text-jewel">{stats.totalBeneficiaries}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-vista/20 rounded-lg">
                  <Activity size={20} className="text-jewel" />
                </div>
                <div>
                  <p className="text-xs text-jewel/70">Active Activities</p>
                  <p className="text-xl font-bold text-jewel">{stats.activeActivities}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-bold text-jewel mb-4">Report Status Distribution</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reportStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-bold text-jewel mb-4">User Roles Distribution</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="glass rounded-3xl p-6">
            <h3 className="text-lg font-bold text-jewel mb-4">Monthly Activity Trend</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#177d49" opacity={0.1} />
                  <XAxis dataKey="month" stroke="#177d49" tick={{fill: '#177d49'}} />
                  <YAxis stroke="#177d49" tick={{fill: '#177d49'}} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reports" name="Reports" stroke="#177d49" strokeWidth={3} />
                  <Line type="monotone" dataKey="users" name="Users" stroke="#81d2ad" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-x1 font-bold text-jewel">User Management</h2>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-jewel font-semibold text-white rounded-xl hover:bg-jewel/90 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Add User
            </button>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-jewel/50" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-4 px-6 font-semibold text-jewel w-full pl-10 pr-4 py-2 bg-frostee/50 border border-jewel/50 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-frostee/30 border-b border-jewel/30 sticky top-0">
                  <tr>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">User</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Email</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Role</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Created</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-jewel/5 hover:bg-white/30 transition-colors">
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 bg-jewel/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-jewel font-medium text-xs">
                            {u.name?.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-jewel truncate text-xs sm:text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-jewel/80 truncate max-w-[120px] text-xs sm:text-sm">{u.email}</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                        {u.role ? u.role.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {formatStatus(u.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-jewel/80 whitespace-nowrap text-xs sm:text-sm">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
<td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handlePasswordResetClick(u)}
                          className="p-1.5 sm:p-2 text-amber-500 hover:bg-amber-50 rounded-lg active:bg-amber-100 transition-colors" 
                          title="Reset Password"
                        >
                          <KeyRound size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditUserClick(u)}
                          className="p-1.5 sm:p-2 text-jewel hover:bg-white/50 rounded-lg active:bg-white/70 transition-colors" 
                          title="Edit"
                        >
                          <Edit size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUserClick(u)}
                          className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg active:bg-red-100 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-jewel">All Reports</h2>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-jewel/50" size={20} />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl font-semibold text-jewel/50 focus:ring-2 focus:ring-jewel outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                
              </select>
            </div>
          </div>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-frostee/30 border-b border-jewel/30 sticky top-0">
                  <tr>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Title</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Type</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Author</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Date</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id} className="border-b border-jewel/5 hover:bg-white/30 transition-colors">
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-jewel/10 rounded-lg flex-shrink-0">
                          <FileText size={14} className="sm:w-4 sm:h-4 text-jewel" />
                        </div>
                        <span className="font-medium text-jewel truncate max-w-[120px] text-xs sm:text-sm">{r.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        r.type === 'sk' ? 'bg-blue-100 text-blue-700' :
                        r.type === 'lydc' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {r.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-jewel/80 truncate max-w-[100px] text-xs sm:text-sm">{r.author_name}</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                        {formatStatus(r.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-jewel/80 whitespace-nowrap text-xs sm:text-sm">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-right">
                      <button className="text-jewel hover:text-jewel/70 font-medium text-xs sm:text-sm whitespace-nowrap">
                        View Details
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

      {/* Activities Tab */}
      {activeSubTab === 'activities' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-jewel">Activity Monitoring</h2>
            <button className="px-4 py-2 bg-jewel text-white rounded-xl hover:bg-jewel/90 transition-colors flex items-center gap-2">
              <Plus size={18} /> Add Activity
            </button>
          </div>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-frostee/30 border-b border-jewel/30 sticky top-0">
                  <tr>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Activity Name</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Assigned To</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Deadline</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 font-semibold text-jewel whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-b border-jewel/5 hover:bg-white/30 transition-colors">
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-jewel/10 rounded-lg flex-shrink-0">
                          <Activity size={14} className="sm:w-4 sm:h-4 text-jewel" />
                        </div>
                        <span className="font-medium text-jewel truncate max-w-[120px] text-xs sm:text-sm">{a.activity_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-jewel/80 truncate max-w-[100px] text-xs sm:text-sm">{a.assigned_to}</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-jewel/80 whitespace-nowrap text-xs sm:text-sm">
                      {new Date(a.submission_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(a.reported_status)}`}>
                        {formatReportedStatus(a.reported_status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handleEditActivityClick(a)}
                          className="p-1.5 sm:p-2 text-jewel hover:bg-white/50 rounded-lg active:bg-white/70 transition-colors" 
                          title="Edit"
                        >
                          <Edit size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => handleMarkActivityComplete(a)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg active:bg-green-100 transition-colors" 
                          title="Mark Complete"
                        >
                          <Check size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jewel">Add New User</h2>
              <button 
                onClick={() => {
                  setShowAddUserModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X size={20} className="text-jewel" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-jewel mb-2">User Created Successfully!</h3>
                <p className="text-jewel/70">The new user has been added to the system.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="sk">SK Representative</option>
                    <option value="lydc">LYDC Representative</option>
                    <option value="meal_head">MEAL Head</option>
                    <option value="office_head">Office Head</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Enter password (min 6 characters)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Confirm password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-frostee/50 hover:bg-white/80 text-jewel rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-jewel hover:bg-jewel/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jewel">Edit User</h2>
              <button 
                onClick={() => {
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                  setEditUser({});
                }}
                className="p-2 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X size={20} className="text-jewel" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-jewel mb-2">User Updated Successfully!</h3>
                <p className="text-jewel/70">The user details have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleUpdateUser} className="space-y-4">
                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Username</label>
                  <input
                    type="text"
                    value={selectedUser.username}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editUser.name || ''}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Email *</label>
                  <input
                    type="email"
                    value={editUser.email || ''}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Role *</label>
                  <select
                    value={editUser.role || 'staff'}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="sk">SK Representative</option>
                    <option value="lydc">LYDC Representative</option>
                    <option value="meal_head">MEAL Head</option>
                    <option value="office_head">Office Head</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Status *</label>
                  <select
                    value={editUser.status || 'active'}
                    onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                    className="w-full px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUserModal(false);
                      setSelectedUser(null);
                      setEditUser({});
                    }}
                    className="flex-1 px-4 py-2 bg-frostee/50 hover:bg-white/80 text-jewel rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-jewel hover:bg-jewel/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 w-full max-w-md"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-jewel mb-2">Delete User</h3>
              <p className="text-jewel/70 mb-6">
                Are you sure you want to delete <strong>{deletingUser.name}</strong>? This action cannot be undone.
              </p>
              
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-frostee/50 hover:bg-white/80 text-jewel rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {showEditActivityModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jewel">Edit Activity</h2>
              <button 
                onClick={() => {
                  setShowEditActivityModal(false);
                  setSelectedActivity(null);
                  setEditActivity({});
                }}
                className="p-2 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X size={20} className="text-jewel" />
              </button>
            </div>

            <form onSubmit={handleUpdateActivity} className="space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-jewel mb-1">Activity Name *</label>
                <input
                  type="text"
                  value={editActivity.activity_name || ''}
                  onChange={(e) => setEditActivity({ ...editActivity, activity_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                  placeholder="Enter activity name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jewel mb-1">Assigned To *</label>
                <input
                  type="text"
                  value={editActivity.assigned_to || ''}
                  onChange={(e) => setEditActivity({ ...editActivity, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                  placeholder="Enter assignee name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jewel mb-1">Submission Deadline</label>
                <input
                  type="date"
                  value={editActivity.submission_deadline || ''}
                  onChange={(e) => setEditActivity({ ...editActivity, submission_deadline: e.target.value })}
                  className="w-full px-4 py-2 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditActivityModal(false);
                    setSelectedActivity(null);
                    setEditActivity({});
                  }}
                  className="flex-1 px-4 py-2 bg-white/50 hover:bg-white/80 text-jewel rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-jewel hover:bg-jewel/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
</motion.div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && passwordResetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jewel">Reset Password</h2>
              <button 
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setPasswordResetUser(null);
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="p-2 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X size={20} className="text-jewel" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-jewel mb-2">Password Reset Successfully!</h3>
                <p className="text-jewel/70">The password for {passwordResetUser.name} has been reset.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {submitError}
                  </div>
                )}

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    You are resetting the password for: <strong>{passwordResetUser.name}</strong>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Username: {passwordResetUser.username}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">New Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jewel mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordResetModal(false);
                      setPasswordResetUser(null);
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="flex-1 px-4 py-2 bg-white/50 hover:bg-white/80 text-jewel rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <KeyRound size={18} />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

