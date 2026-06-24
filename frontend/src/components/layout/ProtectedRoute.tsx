import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/domain';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: Role[];
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
