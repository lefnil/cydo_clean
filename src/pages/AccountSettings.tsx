import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFromGAS } from '../lib/api';
import { motion } from 'motion/react';
import { User, Lock, Mail, Eye, EyeOff, Check, X } from 'lucide-react';

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Validate
      if (!formData.name.trim()) {
        setErrorMessage('Name cannot be empty');
        setLoading(false);
        return;
      }
      if (!formData.username.trim()) {
        setErrorMessage('Username cannot be empty');
        setLoading(false);
        return;
      }

      const result = await fetchFromGAS('update_user', {
        id: user?.id,
        name: formData.name,
        username: formData.username,
      });

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        updateUser({
          name: formData.name,
          username: formData.username,
        });
        setSuccessMessage('✅ Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Validation
      if (!passwordData.currentPassword) {
        setErrorMessage('Current password is required');
        setLoading(false);
        return;
      }
      if (!passwordData.newPassword) {
        setErrorMessage('New password is required');
        setLoading(false);
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrorMessage('Passwords do not match');
        setLoading(false);
        return;
      }

      const result = await fetchFromGAS('change_password', {
        id: user?.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage('✅ Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-frostee via-white to-vista/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-jewel mb-2">Account Settings</h1>
          <p className="text-jewel/70">Manage your profile information and security</p>
        </motion.div>

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-2xl flex items-center gap-3"
          >
            <Check size={20} />
            {successMessage}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-2xl flex items-center gap-3"
          >
            <X size={20} />
            {errorMessage}
          </motion.div>
        )}

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8 mb-6"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-jewel to-vista rounded-2xl flex items-center justify-center text-white shadow-lg">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-jewel">{user?.name}</h2>
              <p className="text-jewel/70">@{user?.username}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-jewel mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-jewel/20 rounded-xl focus:outline-none focus:border-jewel focus:ring-2 focus:ring-jewel/30 bg-white transition-all"
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-jewel mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-jewel/20 rounded-xl focus:outline-none focus:border-jewel focus:ring-2 focus:ring-jewel/30 bg-white transition-all"
              />
            </div>

            {/* Email Display */}
            <div>
              <label className="block text-sm font-semibold text-jewel mb-2 flex items-center gap-2">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-jewel/20 rounded-xl bg-jewel/5 text-jewel/70 cursor-not-allowed"
              />
              <p className="text-xs text-jewel/60 mt-2">Email cannot be changed currently</p>
            </div>

            {/* Update Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-jewel text-white font-semibold rounded-xl hover:bg-jewel/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Update Profile
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Password Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Lock size={24} />
            </div>
            <h3 className="text-2xl font-bold text-jewel">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-jewel mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 pr-12 border border-jewel/20 rounded-xl focus:outline-none focus:border-jewel focus:ring-2 focus:ring-jewel/30 bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-jewel/60 hover:text-jewel"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-jewel mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-4 py-3 pr-12 border border-jewel/20 rounded-xl focus:outline-none focus:border-jewel focus:ring-2 focus:ring-jewel/30 bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-jewel/60 hover:text-jewel"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-jewel mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 pr-12 border border-jewel/20 rounded-xl focus:outline-none focus:border-jewel focus:ring-2 focus:ring-jewel/30 bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-jewel/60 hover:text-jewel"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <p className="font-semibold mb-2">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Minimum 6 characters</li>
                <li>Must match confirmation password</li>
              </ul>
            </div>

            {/* Change Password Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Changing...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Change Password
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
