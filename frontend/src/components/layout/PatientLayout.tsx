import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Layout } from './Layout';
import { Spinner } from '../ui/Spinner';

export const PatientLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="xl" className="text-primary-600" />
      </div>
    );
  }

  // If not logged in, route to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

export default PatientLayout;
