import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collectionAPI } from '../api/collections';
import { recipeAPI } from '../api/recipes';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaBookmark, FaTrash, FaEdit, FaLock, FaGlobe, FaPlus, FaTimes } from 'react-icons/fa';

const CollectionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddRecipe, setShowAddRecipe] = useState(false);
    const [recipeId, setRecipeId] = useState('');
    const [allRecipes, setAllRecipes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCollection();
    }, [id]);

    const loadCollection = async () => {
        setLoading(true);
        try {
            const response = await collectionAPI.getCollectionById(id);
            setCollection(response.data.collection);
        } catch (error) {
            toast.error('Failed to load collection');
            navigate('/collections');
        } finally {
            setLoading(false);
        }
    };

    const deleteCollection = async () => {
        if (!window.confirm('Are you sure you want to delete this collection?')) return;
        try {
            await collectionAPI.deleteCollection(id);
            toast.success('Collection deleted successfully');
            navigate('/collections');
        } catch (error) {
            toast.error('Failed to delete collection');
        }
    };

    const removeRecipe = async (recipeId) => {
        if (!window.confirm('Remove this recipe from the collection?')) return;
        try {
            await collectionAPI.removeRecipeFromCollection(id, recipeId);
            toast.success('Recipe removed from collection');
            loadCollection();
        } catch (error) {
            toast.error('Failed to remove recipe');
        }
    };

    const addRecipe = async () => {
        if (!recipeId.trim()) {
            toast.error('Please enter a recipe ID');
            return;
        }
        try {
            await collectionAPI.addRecipeToCollection(id, { recipe_id: recipeId });
            toast.success('Recipe added to collection!');
            setRecipeId('');
            setShowAddRecipe(false);
            loadCollection();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add recipe');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">😢</div>
                <h3 className="text-xl font-semibold text-gray-800">Collection not found</h3>
                <Link to="/collections" className="btn-primary mt-4 inline-block">
                    Back to Collections
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-primary-600 transition-colors duration-200 mb-4"
            >
                <FaArrowLeft className="mr-2" />
                Back
            </button>

            {/* Collection Header */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <FaBookmark className="text-primary-500 text-2xl" />
                            <h1 className="text-2xl font-bold text-gray-800">{collection.name}</h1>
                        </div>
                        {collection.description && (
                            <p className="text-gray-600 mt-2">{collection.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span>📚 {collection.recipes?.length || 0} recipes</span>
                            <span className="flex items-center gap-1">
                                {collection.is_public ? (
                                    <>
                                        <FaGlobe className="text-green-500" />
                                        Public
                                    </>
                                ) : (
                                    <>
                                        <FaLock className="text-gray-400" />
                                        Private
                                    </>
                                )}
                            </span>
                            <span>📅 Created: {new Date(collection.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to={`/edit-collection/${collection.id}`}
                            className="btn-secondary flex items-center text-sm"
                        >
                            <FaEdit className="mr-1" /> Edit
                        </Link>
                        <button
                            onClick={deleteCollection}
                            className="btn-danger flex items-center text-sm"
                        >
                            <FaTrash className="mr-1" /> Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Recipe Section */}
            <div className="mb-6">
                {showAddRecipe ? (
                    <div className="bg-gray-50 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Add Recipe to Collection</h3>
                            <button
                                onClick={() => setShowAddRecipe(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={recipeId}
                                onChange={(e) => setRecipeId(e.target.value)}
                                placeholder="Enter Recipe ID"
                                className="input-field flex-1"
                            />
                            <button onClick={addRecipe} className="btn-primary">
                                <FaPlus className="mr-1" /> Add Recipe
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Tip: You can find the recipe ID in the recipe URL or by clicking "Copy Recipe ID" on any recipe card
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddRecipe(true)}
                        className="btn-primary flex items-center"
                    >
                        <FaPlus className="mr-2" />
                        Add Recipe to Collection
                    </button>
                )}
            </div>

            {/* Recipes List */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Recipes in this Collection ({collection.recipes?.length || 0})
                </h3>

                {collection.recipes?.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl shadow-lg">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-gray-500">No recipes in this collection yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {collection.recipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                            >
                                <Link to={`/recipe/${recipe.id}`} className="flex">
                                    {recipe.image_url ? (
                                        <img
                                            src={recipe.image_url}
                                            alt={recipe.title}
                                            className="w-32 h-32 object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-3xl flex-shrink-0">
                                            🍳
                                        </div>
                                    )}
                                    <div className="p-4 flex-1">
                                        <h4 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors duration-200">
                                            {recipe.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                            {recipe.description || 'No description'}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500">
                                                🕒 {recipe.total_time || 0} min
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    removeRecipe(recipe.id);
                                                }}
                                                className="text-red-500 hover:text-red-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectionDetail;