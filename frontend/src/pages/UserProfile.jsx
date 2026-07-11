import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI } from '../api/users';
import { followAPI } from '../api/follows';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaUser, FaUtensils, FaHeart, FaUserFriends, FaArrowLeft } from 'react-icons/fa';

const UserProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('recipes');
    const [recipes, setRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [stats, setStats] = useState({
        recipes: 0,
        favorites: 0,
        followers: 0,
        following: 0,
    });

    useEffect(() => {
        loadProfile();
    }, [id]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const response = await userAPI.getUserById(id);
            const userData = response.data.user;
            setProfile(userData);

            // Check if user is banned
            if (userData.is_banned) {
                setStats({
                    recipes: 0,
                    favorites: 0,
                    followers: 0,
                    following: 0,
                });
                return;
            }

            // Load stats
            setStats({
                recipes: userData.recipes_count || 0,
                favorites: userData.favorites_count || 0,
                followers: userData.followers_count || 0,
                following: userData.following_count || 0,
            });

            // Check follow status if logged in
            if (user && user.id !== id) {
                const followResponse = await followAPI.checkFollow(id);
                setIsFollowing(followResponse.data.isFollowing);
            }

            // Load recipes
            loadUserRecipes(id);
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const loadUserRecipes = async (userId) => {
        try {
            const response = await userAPI.getUserRecipes(userId, { limit: 12 });
            setRecipes(response.data.recipes || []);
            setStats(prev => ({ ...prev, recipes: response.data.total || 0 }));
        } catch (error) {
            console.error('Failed to load recipes:', error);
        }
    };

    const loadUserFavorites = async (userId) => {
        try {
            const response = await userAPI.getUserFavorites(userId);
            setFavorites(response.data.favorites || []);
            setStats(prev => ({ ...prev, favorites: response.data.favorites?.length || 0 }));
        } catch (error) {
            console.error('Failed to load favorites:', error);
        }
    };

    const toggleFollow = async () => {
        if (!user) {
            toast.error('Please login to follow users');
            return;
        }
        try {
            if (isFollowing) {
                await followAPI.unfollowUser(id);
                setIsFollowing(false);
                setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
                toast.success('Unfollowed user');
            } else {
                await followAPI.followUser({ user_id: id });
                setIsFollowing(true);
                setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
                toast.success('Now following this user!');
            }
        } catch (error) {
            toast.error('Failed to update follow');
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'favorites' && profile && !profile.is_banned) {
            loadUserFavorites(id);
        } else if (tab === 'recipes' && profile && !profile.is_banned) {
            loadUserRecipes(id);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">😢</div>
                <h3 className="text-xl font-semibold text-gray-800">User not found</h3>
                <Link to="/dashboard" className="btn-primary mt-4 inline-block">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    const isOwnProfile = user?.id === id;
    const isBanned = profile.is_banned;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link to="/dashboard" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4">
                <FaArrowLeft className="mr-2" /> Back
            </Link>

            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        {profile.profile_picture ? (
                            <img
                                src={profile.profile_picture}
                                alt={profile.username}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-4xl text-white border-4 border-white shadow-lg">
                                {profile.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left text-white">
                            <h1 className="text-2xl font-bold">{profile.first_name || profile.username}</h1>
                            <p className="text-primary-100">@{profile.username}</p>
                            {isBanned ? (
                                <p className="mt-2 bg-red-500 bg-opacity-50 text-white px-4 py-2 rounded-lg inline-block">
                                    🚫 This account has been banned
                                </p>
                            ) : (
                                profile.bio && (
                                    <p className="text-primary-100 mt-2 max-w-md">{profile.bio}</p>
                                )
                            )}
                        </div>

                        {/* Follow Button */}
                        {!isOwnProfile && !isBanned && user && (
                            <button
                                onClick={toggleFollow}
                                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${isFollowing
                                        ? 'bg-white text-primary-600 hover:bg-gray-100'
                                        : 'bg-white text-primary-600 hover:bg-gray-100'
                                    }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        )}
                        {!isOwnProfile && !user && !isBanned && (
                            <Link to="/login" className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100">
                                Login to Follow
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats */}
                {!isBanned ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{stats.recipes}</p>
                            <p className="text-sm text-gray-600">Recipes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-500">{stats.favorites}</p>
                            <p className="text-sm text-gray-600">Favorites</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-secondary-600">{stats.followers}</p>
                            <p className="text-sm text-gray-600">Followers</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-accent-600">{stats.following}</p>
                            <p className="text-sm text-gray-600">Following</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 bg-red-50 text-center">
                        <p className="text-red-600 font-medium">This account has been banned. Content is not available.</p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            {!isBanned && (
                <div className="mt-6">
                    <div className="flex gap-2 border-b border-gray-200">
                        <button
                            onClick={() => handleTabChange('recipes')}
                            className={`px-6 py-3 font-medium transition-all duration-200 ${activeTab === 'recipes'
                                    ? 'text-primary-600 border-b-2 border-primary-500'
                                    : 'text-gray-600 hover:text-primary-600'
                                }`}
                        >
                            <FaUtensils className="inline mr-2" />
                            Recipes
                        </button>
                        <button
                            onClick={() => handleTabChange('favorites')}
                            className={`px-6 py-3 font-medium transition-all duration-200 ${activeTab === 'favorites'
                                    ? 'text-primary-600 border-b-2 border-primary-500'
                                    : 'text-gray-600 hover:text-primary-600'
                                }`}
                        >
                            <FaHeart className="inline mr-2" />
                            Favorites
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mt-6">
                        {activeTab === 'recipes' && (
                            <div>
                                {recipes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">🍳</div>
                                        <p className="text-gray-500">No recipes yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recipes.map((recipe) => (
                                            <Link
                                                key={recipe.id}
                                                to={`/recipe/${recipe.id}`}
                                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                                            >
                                                {recipe.image_url ? (
                                                    <img
                                                        src={recipe.image_url}
                                                        alt={recipe.title}
                                                        className="w-full h-40 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-4xl">
                                                        🍳
                                                    </div>
                                                )}
                                                <div className="p-4">
                                                    <h4 className="font-semibold text-gray-800">{recipe.title}</h4>
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {recipe.description || 'No description'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <span>🕒 {recipe.total_time || 0} min</span>
                                                        {recipe.difficulty && <span>⭐ {recipe.difficulty}</span>}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div>
                                {favorites.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">❤️</div>
                                        <p className="text-gray-500">No favorites yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {favorites.map((fav) => (
                                            <Link
                                                key={fav.id}
                                                to={`/recipe/${fav.id}`}
                                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                                            >
                                                {fav.image_url ? (
                                                    <img
                                                        src={fav.image_url}
                                                        alt={fav.title}
                                                        className="w-full h-40 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-4xl">
                                                        🍳
                                                    </div>
                                                )}
                                                <div className="p-4">
                                                    <h4 className="font-semibold text-gray-800">{fav.title}</h4>
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {fav.description || 'No description'}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;