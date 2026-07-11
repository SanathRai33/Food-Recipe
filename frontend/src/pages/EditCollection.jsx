import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionAPI } from '../api/collections';
import toast from 'react-hot-toast';
import { FaBookmark, FaGlobe, FaLock, FaTrash } from 'react-icons/fa';

const EditCollection = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_public: true,
    });

    useEffect(() => {
        loadCollection();
    }, [id]);

    const loadCollection = async () => {
        setLoading(true);
        try {
            const response = await collectionAPI.getCollectionById(id);
            const collection = response.data.collection;
            setFormData({
                name: collection.name || '',
                description: collection.description || '',
                is_public: collection.is_public !== false,
            });
        } catch (error) {
            toast.error('Failed to load collection');
            navigate('/collections');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Please enter a collection name');
            return;
        }

        setSubmitting(true);
        try {
            await collectionAPI.updateCollection(id, formData);
            toast.success('Collection updated successfully! ✅');
            navigate(`/collection/${id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update collection');
        } finally {
            setSubmitting(false);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Collection</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Collection Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g., Desserts, Weeknight Dinners"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="input-field"
                        placeholder="Describe what this collection is about..."
                    />
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="is_public"
                            checked={formData.is_public}
                            onChange={handleChange}
                            className="w-5 h-5 text-primary-500 rounded"
                        />
                        <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                {formData.is_public ? (
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
                            </label>
                            <p className="text-xs text-gray-500">
                                {formData.is_public
                                    ? 'Anyone can view this collection'
                                    : 'Only you can view this collection'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary flex-1 flex items-center justify-center"
                    >
                        <FaBookmark className="mr-2" />
                        {submitting ? 'Updating...' : 'Update Collection'}
                    </button>
                    <button
                        type="button"
                        onClick={deleteCollection}
                        className="btn-danger flex items-center"
                    >
                        <FaTrash className="mr-1" /> Delete
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/collection/${id}`)}
                        className="btn-outline"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditCollection;