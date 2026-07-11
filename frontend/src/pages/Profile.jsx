import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/users';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    FaUser, FaEnvelope, FaEdit, FaLock, FaSave,
    FaTimes, FaUtensils, FaHeart, FaUserFriends
} from 'react-icons/fa';

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        dietary_preferences: [],
        profile_picture: '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [dietaryInput, setDietaryInput] = useState('');
    const [stats, setStats] = useState({
        recipes: 0,
        favorites: 0,
        followers: 0,
        following: 0,
    });

    useEffect(() => {
        loadProfile();
        loadStats();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const response = await userAPI.getProfile();
            const userData = response.data.user;
            setFormData({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                bio: userData.bio || '',
                dietary_preferences: userData.dietary_preferences || [],
                profile_picture: userData.profile_picture || '',
            });
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            // Get recipes count
            const recipesResponse = await userAPI.getMyRecipes({ limit: 1 });
            setStats(prev => ({ ...prev, recipes: recipesResponse.data.total || 0 }));

            // Get favorites count
            const favoritesResponse = await userAPI.getUserFavorites(user.id);
            setStats(prev => ({ ...prev, favorites: favoritesResponse.data.favorites?.length || 0 }));

            // Get followers/following from user data
            if (user) {
                // These would come from a real API call
                setStats(prev => ({
                    ...prev,
                    followers: user.followers_count || 0,
                    following: user.following_count || 0,
                }));
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
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

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await userAPI.updateProfile(formData);
            setUser(response.data.user);
            toast.success('Profile updated successfully! ✅');
            setEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordData.new_password.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        try {
            await userAPI.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            toast.success('Password changed successfully! 🔒');
            setChangingPassword(false);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
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
            <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                    <FaUtensils className="text-2xl text-primary-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{stats.recipes}</p>
                    <p className="text-sm text-gray-600">Recipes</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                    <FaHeart className="text-2xl text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{stats.favorites}</p>
                    <p className="text-sm text-gray-600">Favorites</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                    <FaUserFriends className="text-2xl text-secondary-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{stats.followers}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                    <FaUserFriends className="text-2xl text-accent-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{stats.following}</p>
                    <p className="text-sm text-gray-600">Following</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                <FaEdit /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {editing ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows="3"
                                    className="input-field"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Profile Picture URL
                                </label>
                                <input
                                    type="url"
                                    name="profile_picture"
                                    value={formData.profile_picture}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>

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

                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button type="submit" className="btn-primary flex items-center">
                                    <FaSave className="mr-2" /> Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                {formData.profile_picture ? (
                                    <img
                                        src={formData.profile_picture}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover border-4 border-primary-100"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-3xl border-4 border-primary-100">
                                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {user?.first_name || user?.username}
                                    </h3>
                                    <p className="text-gray-600 flex items-center">
                                        <FaEnvelope className="mr-1" /> {user?.email}
                                    </p>
                                </div>
                            </div>

                            {formData.bio && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-700">{formData.bio}</p>
                                </div>
                            )}

                            {formData.dietary_preferences.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Dietary Preferences</p>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.dietary_preferences.map((pref) => (
                                            <span key={pref} className="badge badge-primary">{pref}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6">
                <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">Change Password</h2>
                        {!changingPassword && (
                            <button
                                onClick={() => setChangingPassword(true)}
                                className="flex items-center gap-2 bg-white text-secondary-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                <FaLock /> Change Password
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {changingPassword ? (
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    name="current_password"
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    name="new_password"
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    className="input-field"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={passwordData.confirm_password}
                                    onChange={handlePasswordChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="btn-secondary flex items-center">
                                    <FaLock className="mr-2" /> Update Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChangingPassword(false)}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            Your password is secure. Click the button above to change it.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;