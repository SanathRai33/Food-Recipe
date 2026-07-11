import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityAPI } from '../api/activities';
import toast from 'react-hot-toast';
import { FaUtensils, FaHeart, FaStar, FaUserPlus, FaComment, FaClock } from 'react-icons/fa';

const MyActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        limit: 20,
        offset: reset ? 0 : (page - 1) * 20,
      };
      const response = await activityAPI.getMyActivities(params);
      const newActivities = response.data.activities || [];
      
      if (reset) {
        setActivities(newActivities);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
      }
      
      setHasMore(newActivities.length === 20);
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadActivities(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      created_recipe: <FaUtensils className="text-primary-500" />,
      favorited_recipe: <FaHeart className="text-red-500" />,
      reviewed_recipe: <FaComment className="text-blue-500" />,
      rated_recipe: <FaStar className="text-yellow-500" />,
      followed_user: <FaUserPlus className="text-secondary-500" />,
    };
    return icons[type] || <FaClock className="text-gray-500" />;
  };

  const formatActivityText = (activity) => {
    const data = activity.data || {};

    switch (activity.type) {
      case 'created_recipe':
        return (
          <>
            You created recipe{' '}
            <Link to={`/recipe/${data.recipe_id}`} className="text-primary-600 hover:underline">
              "{data.recipe_title}"
            </Link>
          </>
        );
      case 'favorited_recipe':
        return (
          <>
            You favorited{' '}
            <Link to={`/recipe/${data.recipe_id}`} className="text-primary-600 hover:underline">
              "{data.recipe_title}"
            </Link>
          </>
        );
      case 'reviewed_recipe':
        return (
          <>
            You reviewed{' '}
            <Link to={`/recipe/${data.recipe_id}`} className="text-primary-600 hover:underline">
              "{data.recipe_title}"
            </Link>
          </>
        );
      case 'rated_recipe':
        return (
          <>
            You rated{' '}
            <Link to={`/recipe/${data.recipe_id}`} className="text-primary-600 hover:underline">
              "{data.recipe_title}"
            </Link>
          </>
        );
      case 'followed_user':
        return (
          <>
            You started following{' '}
            <Link to={`/user/${data.followed_id}`} className="text-primary-600 hover:underline">
              {data.followed_username}
            </Link>
          </>
        );
      default:
        return <>You performed an activity</>;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Activities</h1>
        <p className="text-gray-600">All your recent actions</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800">No activities yet</h3>
          <p className="text-gray-600 mt-2">
            Start creating recipes, reviewing, or following other users!
          </p>
          <Link to="/create-recipe" className="btn-primary inline-block mt-4">
            Create Your First Recipe
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="text-gray-800">
                    {formatActivityText(activity)}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FaClock className="mr-1" /> {formatTime(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary"
              >
                {loadingMore ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⟳</span>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyActivities;