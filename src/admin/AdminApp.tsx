import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AdminAuthProvider } from './AdminAuthContext';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminNavbar } from './components/AdminNavbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { QueryAnalyzerPage } from './pages/QueryAnalyzerPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UsersPage } from './pages/UsersPage';
import { InsightsPage } from './pages/InsightsPage';

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminApp() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" index element={<DashboardPage />} />
              <Route path="/admin/query" element={<QueryAnalyzerPage />} />
              <Route path="/admin/datasets" element={<DatasetsPage />} />
              <Route path="/admin/history" element={<HistoryPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/insights" element={<InsightsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
