import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '../types';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function getDefaultRoleRoute(role: UserRole): string {
  const defaultRoleRedirect: Record<UserRole, string> = {
    Admin: '/invoices',
    Finance: '/invoices',
    Courier: '/courier/available',
    Client: '/my/invoices',
  };

  return defaultRoleRedirect[role] ?? '/login';
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-paper px-4 py-8 text-ink">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoleRoute(user.role)} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
