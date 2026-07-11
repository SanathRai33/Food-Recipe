import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoriteAPI } from '../api/favorites';
import toast from 'react-hot-toast';
import { FaHeart, FaTrash } from 'react-icons/fa';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const response = await favoriteAPI.getFavorites();
            setFavorites(response.data.favorites || []);
        } catch (error) {
            toast.error('Failed to load favorites');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (recipeId) => {
        if (!window.confirm('Remove this recipe from favorites?')) return;
        try {
            await favoriteAPI.removeFavorite(recipeId);
            toast.success('Removed from favorites');
            loadFavorites();
        } catch (error) {
            toast.error('Failed to remove favorite');
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
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Favorites</h1>
                    <p className="text-gray-600">{favorites.length} recipes saved</p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                    <div className="text-6xl mb-4">❤️</div>
                    <h3 className="text-xl font-semibold text-gray-800">No favorites yet</h3>
                    <p className="text-gray-600 mt-2">Start saving recipes you love!</p>
                    <Link to="/recipes" className="btn-primary inline-block mt-4">
                        Browse Recipes
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((fav) => {
                        const recipe = fav.Recipe;
                        return (
                            <div key={recipe.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                                <Link to={`/recipe/${recipe.id}`}>
                                    {recipe.image_url ? (
                                        <img
                                            src={recipe.image_url}
                                            alt={recipe.title}
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-6xl">
                                            🍳
                                        </div>
                                    )}
                                </Link>
                                <div className="p-4">
                                    <Link to={`/recipe/${recipe.id}`}>
                                        <h3 className="font-semibold text-gray-800 hover:text-primary-600 transition-colors duration-200 line-clamp-1">
                                            {recipe.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                        {recipe.description || 'No description available'}
                                    </p>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>🕒 {recipe.total_time || 0} min</span>
                                            {recipe.difficulty && <span>⭐ {recipe.difficulty}</span>}
                                        </div>
                                        <button
                                            onClick={() => removeFavorite(recipe.id)}
                                            className="text-red-500 hover:text-red-600 transition-colors duration-200"
                                            title="Remove from favorites"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Favorites;