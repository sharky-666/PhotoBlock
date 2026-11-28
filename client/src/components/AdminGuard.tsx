import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminStatus } from '@client/src/hooks/useAdmin';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { data: status, isLoading } = useAdminStatus();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">加载中…</span>
        </div>
      </div>
    );
  }

  if (!status?.isLoggedIn) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
