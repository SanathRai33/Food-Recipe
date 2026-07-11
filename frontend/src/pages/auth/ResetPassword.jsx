import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { FaLock, FaCheckCircle } from 'react-icons/fa';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [validToken, setValidToken] = useState(false);
    const [checking, setChecking] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid reset link');
            navigate('/login');
            return;
        }

        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            await axios.get(`/password/validate-token/${token}`);
            setValidToken(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or expired token');
            navigate('/login');
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/password/reset-password', {
                token,
                new_password: newPassword,
            });
            setSubmitted(true);
            toast.success('Password reset successfully! 🎉');

            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Validating your reset link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <FaLock className="text-white text-4xl" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Create New Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Choose a strong password for your account
                    </p>
                </div>

                {submitted ? (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <FaCheckCircle className="text-green-500 text-6xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Password Reset Successfully!</h3>
                        <p className="text-gray-600">
                            You can now login with your new password.
                        </p>
                        <div className="text-sm text-gray-500">Redirecting to login...</div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;