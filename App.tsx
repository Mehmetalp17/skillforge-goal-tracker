import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';

const AppContent = () => {
    const { isAuthenticated } = useAuth();
    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
            <Header />
            <div className="flex-grow">
                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
                    
                    <Route path="/" element={<ProtectedRoute />}>
                        <Route path="/" element={<DashboardPage />} />
                    </Route>
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
            <Footer />
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
};

export default App;