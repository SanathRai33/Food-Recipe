import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionAPI } from '../api/collections';
import toast from 'react-hot-toast';
import { FaBookmark, FaPlus, FaTrash, FaEdit, FaLock, FaGlobe } from 'react-icons/fa';

const Collections = () => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setLoading(true);
        try {
            const response = await collectionAPI.getCollections();
            setCollections(response.data.collections || []);
        } catch (error) {
            toast.error('Failed to load collections');
        } finally {
            setLoading(false);
        }
    };

    const deleteCollection = async (id) => {
        if (!window.confirm('Are you sure you want to delete this collection?')) return;
        try {
            await collectionAPI.deleteCollection(id);
            toast.success('Collection deleted successfully');
            loadCollections();
        } catch (error) {
            toast.error('Failed to delete collection');
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
                    <h1 className="text-3xl font-bold text-gray-800">My Collections</h1>
                    <p className="text-gray-600">{collections.length} collections created</p>
                </div>
                <Link to="/create-collection" className="btn-primary flex items-center">
                    <FaPlus className="mr-2" />
                    Create Collection
                </Link>
            </div>

            {collections.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-gray-800">No collections yet</h3>
                    <p className="text-gray-600 mt-2">Organize your favorite recipes into collections</p>
                    <Link to="/create-collection" className="btn-primary inline-block mt-4">
                        Create Your First Collection
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                        >
                            <Link to={`/collection/${collection.id}`} className="block p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <FaBookmark className="text-primary-500 text-xl" />
                                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors duration-200">
                                                {collection.name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {collection.description || 'No description'}
                                        </p>
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
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            <div className="px-6 pb-4 flex gap-2">
                                <Link
                                    to={`/edit-collection/${collection.id}`}
                                    className="flex-1 text-center text-sm bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <FaEdit className="inline mr-1" /> Edit
                                </Link>
                                <button
                                    onClick={() => deleteCollection(collection.id)}
                                    className="flex-1 text-center text-sm bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors duration-200"
                                >
                                    <FaTrash className="inline mr-1" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Collections;