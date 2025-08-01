import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Link } from 'react-router-dom';
import { SpinnerIcon } from '../components/icons.tsx';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
            // Navigation is handled by the AuthContext
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full mx-4">
                <div className="bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8 border border-gray-700">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-white">Sign in to SkillForge</h2>
                        <p className="mt-2 text-gray-400">
                            Or{' '}
                            <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
                                create a new account
                            </Link>
                        </p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-300 block mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-300 block mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="********"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? <SpinnerIcon /> : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;