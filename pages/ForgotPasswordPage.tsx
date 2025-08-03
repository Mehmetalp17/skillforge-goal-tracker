import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SpinnerIcon } from '../components/icons.tsx';
import { API_BASE_URL } from '../config.ts';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }
            
            setSuccess('Password reset link sent to your email');
            setEmail('');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full mx-4">
                <div className="bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8 border border-gray-700">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-white">Reset Your Password</h2>
                        <p className="mt-2 text-gray-400">
                            We'll email you a link to reset your password
                        </p>
                    </div>
                    
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
                        {success && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-center">{success}</p>}
                        
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
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? <SpinnerIcon /> : 'Send Reset Link'}
                            </button>
                        </div>
                        
                        <div className="text-center">
                            <Link to="/login" className="text-sm text-indigo-400 hover:text-indigo-300">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;