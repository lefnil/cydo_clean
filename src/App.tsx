import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense } from 'react';
import { useRBAC } from './hooks/useRBAC';
import Layout from './components/Layout';
import Login from './pages/Login';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SKReports = lazy(() => import('./pages/SKReports'));
const LYDCReports = lazy(() => import('./pages/LYDCReports'));

const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const MEALSystem = lazy(() => import('./pages/MEALSystem'));
const Administration = lazy(() => import('./pages/Administration'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-2xl p-12 max-w-md w-full mx-4 flex flex-col items-center gap-6 animate-pulse">
          <div className="w-24 h-24 border-4 border-jewel/30 border-t-jewel rounded-full animate-spin mx-auto mb-6">
            <img 
              src="https://i.imgur.com/xggJ5lV.png" 
              alt="TCYDO Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="text-2xl font-bold text-jewel text-center">Initializing TCYDO...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jewel"></div></div>}><Dashboard /></Suspense>} />
              <Route
                path="sk-reports"
                element={
                  <ProtectedRoute roles={['admin', 'sk', 'office_head']}>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jewel"></div></div>}><SKReports /></Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="lydc-reports"
                element={
                  <ProtectedRoute roles={['admin', 'lydc', 'office_head']}>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jewel"></div></div>}><LYDCReports /></Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="meal"

                element={
                  <ProtectedRoute roles={['admin', 'staff', 'meal_head', 'office_head']}>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jewel"></div></div>}><MEALSystem /></Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="administration"
                element={
                  <ProtectedRoute roles={['admin', 'office_head']}>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jewel"></div></div>}>
                      <Administration />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="account-settings"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jewel"></div></div>}>
                      <AccountSettings />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
