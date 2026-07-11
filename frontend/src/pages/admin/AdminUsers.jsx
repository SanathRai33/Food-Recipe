import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FaSearch, FaUser, FaBan, FaCheck, FaTrash, FaUserCog, FaUserMinus } from 'react-icons/fa';

const AdminUsers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });
    const [search, setSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showBanned, setShowBanned] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [pagination.page, searchTerm, showBanned]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 10,
                search: searchTerm,
                include_banned: showBanned,
            };
            const response = await adminAPI.getAllUsers(params);
            setUsers(response.data.users || []);
            setPagination({
                page: response.data.page || 1,
                totalPages: response.data.total_pages || 1,
                total: response.data.total || 0,
            });
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        setSearchTerm(search);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const banUser = async (userId) => {
        const reason = prompt('Enter ban reason (optional):');
        if (reason === null) return;

        try {
            await adminAPI.banUser(userId, { reason: reason || 'Violation of terms' });
            toast.success('User banned successfully');
            loadUsers();
        } catch (error) {
            toast.error('Failed to ban user');
        }
    };

    const unbanUser = async (userId) => {
        if (!window.confirm('Unban this user?')) return;
        try {
            await adminAPI.unbanUser(userId);
            toast.success('User unbanned successfully');
            loadUsers();
        } catch (error) {
            toast.error('Failed to unban user');
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This cannot be undone!')) return;
        try {
            await adminAPI.deleteUser(userId);
            toast.success('User deleted successfully');
            loadUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const makeAdmin = async (userId) => {
        if (!window.confirm('Make this user an admin?')) return;
        try {
            await adminAPI.makeAdmin(userId);
            toast.success('User made admin successfully');
            loadUsers();
        } catch (error) {
            toast.error('Failed to make admin');
        }
    };

    const removeAdmin = async (userId) => {
        if (!window.confirm('Remove admin privileges from this user?')) return;
        try {
            await adminAPI.removeAdmin(userId);
            toast.success('Admin privileges removed');
            loadUsers();
        } catch (error) {
            toast.error('Failed to remove admin');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-600">{pagination.total} users registered</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by username, email, or name..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button type="submit" className="btn-primary">Search</button>
                    </form>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={showBanned}
                                onChange={(e) => {
                                    setShowBanned(e.target.checked);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-4 h-4 text-primary-500 rounded"
                            />
                            Show banned users
                        </label>
                        <button
                            onClick={() => {
                                setSearch('');
                                setSearchTerm('');
                                setShowBanned(false);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.profile_picture ? (
                                                    <img
                                                        src={user.profile_picture}
                                                        alt={user.username}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                                                        {user.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-800">{user.username}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.first_name || ''} {user.last_name || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.is_admin && (
                                                    <span className="badge badge-primary">Admin</span>
                                                )}
                                                {user.is_banned ? (
                                                    <span className="badge badge-danger">Banned</span>
                                                ) : (
                                                    <span className="badge badge-success">Active</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    to={`/user/${user.id}`}
                                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                                >
                                                    View
                                                </Link>

                                                {user.id !== currentUser?.id && (
                                                    <>
                                                        {!user.is_admin ? (
                                                            <button
                                                                onClick={() => makeAdmin(user.id)}
                                                                className="text-secondary-500 hover:text-secondary-600 text-sm flex items-center gap-1"
                                                            >
                                                                <FaUserCog /> Admin
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => removeAdmin(user.id)}
                                                                className="text-yellow-500 hover:text-yellow-600 text-sm flex items-center gap-1"
                                                            >
                                                                <FaUserMinus /> Remove
                                                            </button>
                                                        )}

                                                        {user.is_banned ? (
                                                            <button
                                                                onClick={() => unbanUser(user.id)}
                                                                className="text-green-500 hover:text-green-600 text-sm flex items-center gap-1"
                                                            >
                                                                <FaCheck /> Unban
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => banUser(user.id)}
                                                                className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                                                            >
                                                                <FaBan /> Ban
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => deleteUser(user.id)}
                                                            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                                                        >
                                                            <FaTrash /> Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;