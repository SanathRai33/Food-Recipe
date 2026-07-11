import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';
import { FaSearch, FaEye, FaTrash, FaLock, FaGlobe } from 'react-icons/fa';

const AdminRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });
    const [search, setSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadRecipes();
    }, [pagination.page, searchTerm, statusFilter]);

    const loadRecipes = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 10,
                search: searchTerm,
                status: statusFilter,
            };
            const response = await adminAPI.getAllRecipes(params);
            setRecipes(response.data.recipes || []);
            setPagination({
                page: response.data.page || 1,
                totalPages: response.data.total_pages || 1,
                total: response.data.total || 0,
            });
        } catch (error) {
            toast.error('Failed to load recipes');
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

    const toggleVisibility = async (recipeId, currentStatus) => {
        if (!window.confirm(`${currentStatus ? 'Make private' : 'Make public'} this recipe?`)) return;
        try {
            await adminAPI.toggleRecipeVisibility(recipeId);
            toast.success(`Recipe ${currentStatus ? 'made private' : 'made public'} successfully`);
            loadRecipes();
        } catch (error) {
            toast.error('Failed to update recipe visibility');
        }
    };

    const deleteRecipe = async (recipeId) => {
        if (!window.confirm('Are you sure you want to delete this recipe? This cannot be undone!')) return;
        try {
            await adminAPI.deleteAdminRecipe(recipeId);
            toast.success('Recipe deleted successfully');
            loadRecipes();
        } catch (error) {
            toast.error('Failed to delete recipe');
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
                    <h1 className="text-3xl font-bold text-gray-800">Recipe Management</h1>
                    <p className="text-gray-600">{pagination.total} recipes total</p>
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
                                placeholder="Search by title or description..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button type="submit" className="btn-primary">Search</button>
                    </form>
                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All</option>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearch('');
                                setSearchTerm('');
                                setStatusFilter('');
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Recipes Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {recipes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No recipes found
                                    </td>
                                </tr>
                            ) : (
                                recipes.map((recipe) => (
                                    <tr key={recipe.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {recipe.image_url ? (
                                                    <img
                                                        src={recipe.image_url}
                                                        alt={recipe.title}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-2xl">
                                                        🍳
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-800">{recipe.title}</div>
                                                    <div className="text-sm text-gray-500 line-clamp-1">
                                                        {recipe.description || 'No description'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {recipe.User?.username || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {recipe.is_public ? (
                                                <span className="badge badge-success flex items-center gap-1">
                                                    <FaGlobe /> Public
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning flex items-center gap-1">
                                                    <FaLock /> Private
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(recipe.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    to={`/recipe/${recipe.id}`}
                                                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                                                >
                                                    <FaEye /> View
                                                </Link>
                                                <button
                                                    onClick={() => toggleVisibility(recipe.id, recipe.is_public)}
                                                    className={`text-sm flex items-center gap-1 ${recipe.is_public
                                                            ? 'text-yellow-500 hover:text-yellow-600'
                                                            : 'text-green-500 hover:text-green-600'
                                                        }`}
                                                >
                                                    {recipe.is_public ? 'Make Private' : 'Make Public'}
                                                </button>
                                                <button
                                                    onClick={() => deleteRecipe(recipe.id)}
                                                    className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                                                >
                                                    <FaTrash /> Delete
                                                </button>
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

export default AdminRecipes;