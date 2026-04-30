import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'proprietaire' | 'locataire';
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, requireAdmin }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-[#B8860B] mb-4" size={48} />
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/connexion" state={{ from: location }} replace />;
  }

  // Vérification super admin
  if (requireAdmin && !profile?.is_super_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Vérification rôle
  if (requiredRole && !requireAdmin && profile?.role !== requiredRole) {
    if (profile?.role === 'locataire') {
      return <Navigate to="/locataire" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
