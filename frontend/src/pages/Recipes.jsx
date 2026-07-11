import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recipeAPI } from '../api/recipes';
import toast from 'react-hot-toast';
import { FaSearch, FaFilter, FaTimes, FaStar, FaClock, FaUser, FaHeart } from 'react-icons/fa';

const Recipes = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });

    // Filter states
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        dietary: searchParams.get('dietary') || '',
        difficulty: searchParams.get('difficulty') || '',
        maxTime: searchParams.get('maxTime') || '',
        sort: searchParams.get('sort') || 'created_at',
    });

    const [showFilters, setShowFilters] = useState(false);

    const dietaryOptions = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Keto', 'Paleo'];
    const difficultyOptions = ['Easy', 'Medium', 'Hard'];
    const sortOptions = [
        { value: 'created_at', label: 'Newest' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'most_favorited', label: 'Most Favorited' },
        { value: 'highest_rated', label: 'Highest Rated' },
    ];

    const loadRecipes = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12,
                ...filters,
            };
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const response = await recipeAPI.getRecipes(params);
            setRecipes(response.data.recipes || []);
            setPagination({
                page: response.data.page || 1,
                totalPages: response.data.total_pages || 1,
                total: response.data.total || 0,
            });

            // Update URL params
            const urlParams = {};
            Object.keys(filters).forEach(key => {
                if (filters[key]) urlParams[key] = filters[key];
            });
            setSearchParams(urlParams);
        } catch (error) {
            toast.error('Failed to load recipes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecipes();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            dietary: '',
            difficulty: '',
            maxTime: '',
            sort: 'created_at',
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadRecipes(newPage);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Explore Recipes</h1>
                    <p className="text-gray-600">Discover delicious recipes from our community</p>
                </div>
                <Link to="/create-recipe" className="btn-primary flex items-center">
                    <FaSearch className="mr-2" />
                    Create Recipe
                </Link>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search recipes by title, description, or ingredients..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-outline flex items-center justify-center md:w-auto"
                >
                    <FaFilter className="mr-2" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-lg p-6 animate-slide-down">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Dietary Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary</label>
                            <select
                                value={filters.dietary}
                                onChange={(e) => handleFilterChange('dietary', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All</option>
                                {dietaryOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                            <select
                                value={filters.difficulty}
                                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All</option>
                                {difficultyOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {/* Max Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Time (min)</label>
                            <input
                                type="number"
                                placeholder="e.g., 60"
                                value={filters.maxTime}
                                onChange={(e) => handleFilterChange('maxTime', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <select
                                value={filters.sort}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button onClick={clearFilters} className="btn-secondary flex items-center">
                            <FaTimes className="mr-2" />
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Results Count */}
            <div className="flex justify-between items-center">
                <p className="text-gray-600">
                    Showing {recipes.length} of {pagination.total} recipes
                </p>
            </div>

            {/* Recipes Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                            <div className="h-48 bg-gray-200"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : recipes.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍳</div>
                    <h3 className="text-xl font-semibold text-gray-800">No recipes found</h3>
                    <p className="text-gray-600 mt-2">Try adjusting your filters or search terms</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recipes.map((recipe) => (
                        <Link
                            key={recipe.id}
                            to={`/recipe/${recipe.id}`}
                            className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="relative h-48 overflow-hidden">
                                {recipe.image_url ? (
                                    <img
                                        src={recipe.image_url}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-4xl">
                                        🍳
                                    </div>
                                )}
                                {recipe.difficulty && (
                                    <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                                        {recipe.difficulty}
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors duration-200 line-clamp-1">
                                    {recipe.title}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                    {recipe.description || 'No description available'}
                                </p>
                                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <FaUser className="mr-1 text-xs" />
                                        <span>{recipe.User?.username || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center">
                                            <FaClock className="mr-1 text-xs" />
                                            {recipe.total_time || 0}min
                                        </span>
                                        {recipe.favorites_count > 0 && (
                                            <span className="flex items-center">
                                                <FaHeart className="mr-1 text-xs text-red-500" />
                                                {recipe.favorites_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Recipes;