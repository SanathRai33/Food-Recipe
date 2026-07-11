import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaBook, FaHeart, FaUtensils, FaUserFriends, FaStar, FaFire } from 'react-icons/fa';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        recipes: 0,
        favorites: 0,
        followers: 0,
        following: 0,
    });

    // Mock stats - In real app, fetch from API
    useEffect(() => {
        // You would fetch actual stats here
        setStats({
            recipes: 12,
            favorites: 8,
            followers: 45,
            following: 32,
        });
    }, []);

    const quickActions = [
        {
            icon: <FaPlus className="text-2xl" />,
            label: 'Create Recipe',
            description: 'Share your culinary creation',
            to: '/create-recipe',
            color: 'bg-primary-500',
        },
        {
            icon: <FaBook className="text-2xl" />,
            label: 'My Recipes',
            description: 'View your recipes',
            to: '/profile',
            color: 'bg-secondary-500',
        },
        {
            icon: <FaHeart className="text-2xl" />,
            label: 'Favorites',
            description: 'Your saved recipes',
            to: '/favorites',
            color: 'bg-red-500',
        },
        {
            icon: <FaUserFriends className="text-2xl" />,
            label: 'Activity Feed',
            description: 'See what others are cooking',
            to: '/activity-feed',
            color: 'bg-accent-500',
        },
    ];

    const statsCards = [
        {
            icon: <FaUtensils className="text-3xl" />,
            label: 'My Recipes',
            value: stats.recipes,
            color: 'from-primary-500 to-primary-600',
        },
        {
            icon: <FaHeart className="text-3xl" />,
            label: 'Favorites',
            value: stats.favorites,
            color: 'from-red-500 to-red-600',
        },
        {
            icon: <FaUserFriends className="text-3xl" />,
            label: 'Followers',
            value: stats.followers,
            color: 'from-secondary-500 to-secondary-600',
        },
        {
            icon: <FaStar className="text-3xl" />,
            label: 'Following',
            value: stats.following,
            color: 'from-accent-500 to-accent-600',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.first_name || user?.username || 'Chef'}! 👨‍🍳
                </h1>
                <p className="text-primary-100 text-lg">
                    Ready to discover new recipes and share your culinary creations?
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg transform transition-all hover:scale-105 duration-300`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">{stat.label}</p>
                                <p className="text-3xl font-bold">{stat.value}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-full p-3">
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.to}
                            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                        >
                            <div className={`${action.color} w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4 group-hover:rotate-6 transition-transform duration-300`}>
                                {action.icon}
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800">{action.label}</h4>
                            <p className="text-sm text-gray-600">{action.description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Featured Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <FaFire className="text-primary-500 mr-2" />
                        Trending Recipes
                    </h3>
                    <Link to="/recipes" className="text-primary-600 hover:text-primary-700 font-medium">
                        View All →
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                            <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;