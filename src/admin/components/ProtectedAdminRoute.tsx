import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';

export function ProtectedAdminRoute() {
  const { token } = useAdminAuth();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
