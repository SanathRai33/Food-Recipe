import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeAPI } from '../api/recipes';
import toast from 'react-hot-toast';
import { FaUpload, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

const CreateRecipe = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
    const [dietaryInput, setDietaryInput] = useState('');

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

        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter a recipe title');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Please enter a description');
            return;
        }
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

        setLoading(true);
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

            const response = await recipeAPI.createRecipe(data);
            toast.success('Recipe created successfully! 🎉');
            navigate(`/recipe/${response.data.recipe.id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create recipe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Recipe</h1>

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
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                            <FaUpload />
                            Choose Image
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                        {imagePreview && (
                            <div className="relative">
                                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview('');
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        )}
                    </div>
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
                        disabled={loading}
                        className="btn-primary flex-1"
                    >
                        {loading ? 'Creating...' : 'Create Recipe'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="btn-outline"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateRecipe;