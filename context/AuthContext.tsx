
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, AuthContextType } from '../types.ts';
import { useNavigate } from 'react-router-dom';
import { SpinnerIcon } from '../components/icons.tsx';
import { API_BASE_URL } from '../config.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_API_URL = `${API_BASE_URL}/auth`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('skillforge_token'));
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                try {
                    const res = await fetch(`${AUTH_API_URL}/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (res.ok) {
                        const { data } = await res.json();
                        setUser(data);
                    } else {
                        // Token is invalid or expired
                        localStorage.removeItem('skillforge_token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Failed to validate session", error);
                    localStorage.removeItem('skillforge_token');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        validateToken();
    }, [token]);

    const handleAuthResponse = (data: { token: string; user: User }) => {
        localStorage.setItem('skillforge_token', data.token);
        setToken(data.token);
        setUser(data.user);
        navigate('/');
    };

    const login = async (email: string, password: string): Promise<void> => {
        const res = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }
        handleAuthResponse(data);
    };

    const register = async (name: string, email: string, password: string): Promise<void> => {
        const res = await fetch(`${AUTH_API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        handleAuthResponse(data);
    };

    const logout = () => {
        localStorage.removeItem('skillforge_token');
        setUser(null);
        setToken(null);
        navigate('/login');
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {isLoading ? (
                 <div className="flex justify-center items-center h-screen bg-gray-900">
                    <SpinnerIcon className="w-12 h-12 text-indigo-400" />
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
