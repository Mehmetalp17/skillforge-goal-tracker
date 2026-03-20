import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

interface ProtectedRouteProps {
    requiredRole?: 'learner' | 'manager';
}

const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;