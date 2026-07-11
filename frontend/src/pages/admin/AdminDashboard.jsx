import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';
import { 
  FaUsers, FaUtensils, FaStar, FaComment, 
  FaUserPlus, FaEye, FaHeart, FaClock 
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
      setRecentActivities(response.data.recentActivities || []);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: <FaUsers className="text-3xl" />,
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: <FaUtensils className="text-3xl" />,
      label: 'Total Recipes',
      value: stats?.totalRecipes || 0,
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: <FaComment className="text-3xl" />,
      label: 'Total Reviews',
      value: stats?.totalReviews || 0,
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: <FaStar className="text-3xl" />,
      label: 'Average Rating',
      value: stats?.averageRating ? stats.averageRating.toFixed(1) : 'N/A',
      color: 'from-yellow-500 to-yellow-600',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/admin/users" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
              <FaUsers className="text-blue-500 text-xl" />
              <span className="text-gray-700">Manage Users</span>
            </a>
            <a href="/admin/recipes" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
              <FaUtensils className="text-primary-500 text-xl" />
              <span className="text-gray-700">Manage Recipes</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Recipes</span>
              <span className="font-semibold">{stats?.totalRecipes || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Reviews</span>
              <span className="font-semibold">{stats?.totalReviews || 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Average Rating</span>
              <span className="font-semibold">{stats?.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaClock className="mr-2 text-gray-500" />
          Recent Activities
        </h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activities</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <FaUserPlus />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{activity.username || 'User'}</span> joined the platform
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;