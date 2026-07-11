import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipeAPI } from '../api/recipes';
import toast from 'react-hot-toast';
import { FaUpload, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

const EditRecipe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ingredients: [''],
        instructions: [''],
        prep_time: '',
        cook_time: '',
        servings: '',
        difficulty: 'Medium',
        dietary_preferences: [],
        is_public: true,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [currentImage, setCurrentImage] = useState('');
    const [dietaryInput, setDietaryInput] = useState('');

    useEffect(() => {
        loadRecipe();
    }, [id]);

    const loadRecipe = async () => {
        setLoading(true);
        try {
            const response = await recipeAPI.getRecipeById(id);
            const recipe = response.data.recipe;

            setFormData({
                title: recipe.title || '',
                description: recipe.description || '',
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [''],
                instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [''],
                prep_time: recipe.prep_time || '',
                cook_time: recipe.cook_time || '',
                servings: recipe.servings || '',
                difficulty: recipe.difficulty || 'Medium',
                dietary_preferences: recipe.dietary_preferences || [],
                is_public: recipe.is_public !== false,
            });
            setCurrentImage(recipe.image_url || '');
        } catch (error) {
            toast.error('Failed to load recipe');
            navigate('/recipes');
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

    const handleArrayChange = (index, value, type) => {
        const newArray = [...formData[type]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [type]: newArray }));
    };

    const addArrayItem = (type) => {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], '']
        }));
    };

    const removeArrayItem = (index, type) => {
        if (formData[type].length <= 1) return;
        const newArray = formData[type].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [type]: newArray }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addDietaryPreference = () => {
        if (dietaryInput.trim() && !formData.dietary_preferences.includes(dietaryInput.trim())) {
            setFormData(prev => ({
                ...prev,
                dietary_preferences: [...prev.dietary_preferences, dietaryInput.trim()]
            }));
            setDietaryInput('');
        }
    };

    const removeDietaryPreference = (pref) => {
        setFormData(prev => ({
            ...prev,
            dietary_preferences: prev.dietary_preferences.filter(p => p !== pref)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validIngredients = formData.ingredients.filter(i => i.trim());
        if (validIngredients.length === 0) {
            toast.error('Please add at least one ingredient');
            return;
        }
        const validInstructions = formData.instructions.filter(i => i.trim());
        if (validInstructions.length === 0) {
            toast.error('Please add at least one instruction step');
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                ...formData,
                ingredients: validIngredients,
                instructions: validInstructions,
                prep_time: parseInt(formData.prep_time) || 0,
                cook_time: parseInt(formData.cook_time) || 0,
                servings: parseInt(formData.servings) || 1,
                image: imageFile,
            };

            await recipeAPI.updateRecipe(id, data);
            toast.success('Recipe updated successfully! ✅');
            navigate(`/recipe/${id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update recipe');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteRecipe = async () => {
        if (!window.confirm('Are you sure you want to delete this recipe? This cannot be undone!')) return;
        try {
            await recipeAPI.deleteRecipe(id);
            toast.success('Recipe deleted successfully');
            navigate('/recipes');
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
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Recipe</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipe Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Enter recipe title"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="input-field"
                        placeholder="Describe your recipe..."
                        required
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipe Image
                    </label>
                    <div className="flex items-center gap-4">
                        {currentImage && !imagePreview && (
                            <img src={currentImage} alt="Current" className="h-20 w-20 object-cover rounded-lg" />
                        )}
                        {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                        )}
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                            <FaUpload />
                            {currentImage ? 'Change Image' : 'Choose Image'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                        {(imagePreview || currentImage) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setImageFile(null);
                                    setImagePreview('');
                                    setCurrentImage('');
                                }}
                                className="text-red-500 hover:text-red-600"
                            >
                                Remove Image
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
                </div>

                {/* Ingredients */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ingredients *
                    </label>
                    {formData.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={ingredient}
                                onChange={(e) => handleArrayChange(index, e.target.value, 'ingredients')}
                                className="input-field flex-1"
                                placeholder={`Ingredient ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem(index, 'ingredients')}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayItem('ingredients')}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                        <FaPlus /> Add Ingredient
                    </button>
                </div>

                {/* Instructions */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions *
                    </label>
                    {formData.instructions.map((instruction, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={instruction}
                                onChange={(e) => handleArrayChange(index, e.target.value, 'instructions')}
                                className="input-field flex-1"
                                placeholder={`Step ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem(index, 'instructions')}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayItem('instructions')}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                        <FaPlus /> Add Step
                    </button>
                </div>

                {/* Time & Servings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prep Time (min)
                        </label>
                        <input
                            type="number"
                            name="prep_time"
                            value={formData.prep_time}
                            onChange={handleChange}
                            className="input-field"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cook Time (min)
                        </label>
                        <input
                            type="number"
                            name="cook_time"
                            value={formData.cook_time}
                            onChange={handleChange}
                            className="input-field"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Servings
                        </label>
                        <input
                            type="number"
                            name="servings"
                            value={formData.servings}
                            onChange={handleChange}
                            className="input-field"
                            min="1"
                        />
                    </div>
                </div>

                {/* Difficulty */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                    </label>
                    <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="input-field"
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>

                {/* Dietary Preferences */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dietary Preferences
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={dietaryInput}
                            onChange={(e) => setDietaryInput(e.target.value)}
                            className="input-field flex-1"
                            placeholder="e.g., Vegan, Gluten-free"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDietaryPreference())}
                        />
                        <button
                            type="button"
                            onClick={addDietaryPreference}
                            className="btn-primary"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.dietary_preferences.map((pref) => (
                            <span key={pref} className="badge badge-primary flex items-center gap-2">
                                {pref}
                                <button
                                    type="button"
                                    onClick={() => removeDietaryPreference(pref)}
                                    className="hover:text-red-500"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Public/Private */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="is_public"
                        checked={formData.is_public}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-500"
                    />
                    <label className="text-sm text-gray-700">
                        Make this recipe public
                    </label>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary flex-1"
                    >
                        {submitting ? 'Updating...' : 'Update Recipe'}
                    </button>
                    <button
                        type="button"
                        onClick={deleteRecipe}
                        className="btn-danger"
                    >
                        Delete Recipe
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/recipe/${id}`)}
                        className="btn-outline"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditRecipe;