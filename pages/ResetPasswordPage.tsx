import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SpinnerIcon } from '../components/icons.tsx';
import { API_BASE_URL } from '../config.ts';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { resetToken } = useParams();
    const navigate = useNavigate();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        
        setIsSubmitting(true);
        setError('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password/${resetToken}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }
            
            // Automatically log in the user
            localStorage.setItem('skillforge_token', data.token);
            
            // Alert the user that the password was reset successfully
            alert('Your password has been reset successfully. You will now be redirected to the dashboard.');
            
            // Navigate to the dashboard
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full mx-4">
                <div className="bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8 border border-gray-700">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-white">Set New Password</h2>
                        <p className="mt-2 text-gray-400">
                            Please choose a new password for your account
                        </p>
                    </div>
                    
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
                        
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-300 block mb-2">
                                New Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="At least 6 characters"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300 block mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Confirm your new password"
                            />
                        </div>
                        
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? <SpinnerIcon /> : 'Reset Password'}
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

export default ResetPasswordPage;