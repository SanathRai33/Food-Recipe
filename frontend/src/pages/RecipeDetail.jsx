import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { recipeAPI } from '../api/recipes';
import { favoriteAPI } from '../api/favorites';
import { reviewAPI } from '../api/reviews';
import { followAPI } from '../api/follows';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FaHeart, FaRegHeart, FaStar, FaRegStar, FaClock, 
  FaUser, FaEdit, FaTrash, FaArrowLeft, FaShare,
  FaBookmark, FaRegBookmark, FaStarHalfAlt
} from 'react-icons/fa';

const RecipeDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadRecipe();
    if (user) {
      checkFavorite();
      checkFollow();
      loadUserReview();
    }
  }, [id, user]);

  const loadRecipe = async () => {
    setLoading(true);
    try {
      const response = await recipeAPI.getRecipeById(id);
      setRecipe(response.data.recipe);
      
      // Load reviews
      const reviewsResponse = await reviewAPI.getRecipeReviews(id);
      setReviews(reviewsResponse.data.data || []);
    } catch (error) {
      toast.error('Failed to load recipe');
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await favoriteAPI.checkFavorite(id);
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const checkFollow = async () => {
    if (recipe?.User?.id === user?.id) return;
    try {
      const response = await followAPI.checkFollow(recipe?.User?.id);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Failed to check follow:', error);
    }
  };

  const loadUserReview = async () => {
    try {
      const response = await reviewAPI.getUserReview(id);
      if (response.data.review) {
        setUserReview(response.data.review);
        setReviewRating(response.data.review.rating);
        setReviewContent(response.data.review.review_content);
        setShowReviewForm(true);
      }
    } catch (error) {
      console.error('Failed to load user review:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoriteAPI.removeFavorite(id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await favoriteAPI.addFavorite({ recipe_id: id });
        setIsFavorite(true);
        toast.success('Added to favorites! ❤️');
      }
      // Refresh recipe to update counts
      loadRecipe();
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Please login to follow users');
      return;
    }
    try {
      if (isFollowing) {
        await followAPI.unfollowUser(recipe.User.id);
        setIsFollowing(false);
        toast.success('Unfollowed user');
      } else {
        await followAPI.followUser({ user_id: recipe.User.id });
        setIsFollowing(true);
        toast.success('Now following this user!');
      }
    } catch (error) {
      toast.error('Failed to update follow');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) {
      toast.error('Please write a review');
      return;
    }
    if (reviewRating === 0) {
      toast.error('Please rate the recipe');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewAPI.createOrUpdateReview(id, {
        rating: reviewRating,
        review_content: reviewContent.trim()
      });
      toast.success(userReview ? 'Review updated! ✅' : 'Review added! 🎉');
      setShowReviewForm(false);
      loadRecipe();
      loadUserReview();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await reviewAPI.deleteReview(userReview.id);
      toast.success('Review deleted');
      setUserReview(null);
      setReviewRating(0);
      setReviewContent('');
      loadRecipe();
    } catch (error) {
      toast.error('Failed to delete review');
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

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <span className="flex items-center text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} />
        ))}
        {halfStar && <FaStarHalfAlt />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} />
        ))}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😢</div>
        <h3 className="text-xl font-semibold text-gray-800">Recipe not found</h3>
        <Link to="/recipes" className="btn-primary mt-4 inline-block">
          Browse Recipes
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === recipe.User?.id;
  const isBanned = recipe.User?.is_banned;

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

      {/* Recipe Header */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Image */}
        <div className="relative h-80 overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-6xl">
              🍳
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            {!isBanned && (
              <button
                onClick={toggleFavorite}
                className="bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isFavorite ? (
                  <FaHeart className="text-red-500 text-xl" />
                ) : (
                  <FaRegHeart className="text-gray-700 text-xl" />
                )}
              </button>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaShare className="text-gray-700 text-xl" />
            </button>
          </div>

          {/* Difficulty Badge */}
          {recipe.difficulty && (
            <span className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              {recipe.difficulty}
            </span>
          )}
        </div>

        {/* Recipe Content */}
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{recipe.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Link to={`/user/${recipe.User?.id}`} className="flex items-center text-gray-600 hover:text-primary-600">
                  <FaUser className="mr-1" />
                  {recipe.User?.username || 'Unknown Chef'}
                </Link>
                {isOwner && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Your Recipe</span>}
                {isBanned && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">User Banned</span>}
              </div>
            </div>
            
            {/* Follow Button */}
            {!isOwner && user && !isBanned && (
              <button
                onClick={toggleFollow}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Recipe Stats */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            <span className="flex items-center">
              <FaClock className="mr-1" />
              Prep: {recipe.prep_time || 0} min
            </span>
            <span className="flex items-center">
              <FaClock className="mr-1" />
              Cook: {recipe.cook_time || 0} min
            </span>
            <span className="flex items-center">
              Total: {recipe.total_time || 0} min
            </span>
            <span>🍽️ {recipe.servings || 1} servings</span>
            <span>👁️ {recipe.views_count || 0} views</span>
            {recipe.favorites_count > 0 && (
              <span className="flex items-center text-red-500">
                <FaHeart className="mr-1" />
                {recipe.favorites_count}
              </span>
            )}
          </div>

          {/* Rating Display */}
          <div className="flex items-center gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-800">
                {recipe.average_rating ? recipe.average_rating.toFixed(1) : '0'}
              </span>
              <span className="text-gray-500">/5</span>
              <div className="text-sm text-gray-600">
                {recipe.total_reviews || 0} reviews
              </div>
            </div>
            <div className="flex-1">
              {recipe.average_rating ? (
                renderStars(recipe.average_rating)
              ) : (
                <span className="text-gray-500">No ratings yet</span>
              )}
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{recipe.description}</p>
            </div>
          )}

          {/* Dietary Preferences */}
          {recipe.dietary_preferences?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {recipe.dietary_preferences.map((pref, index) => (
                <span key={index} className="badge badge-primary">
                  {pref}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients?.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-primary-500 mt-1">•</span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
            <ol className="space-y-3">
              {recipe.instructions?.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Recipe Actions for Owner */}
          {isOwner && (
            <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-gray-200">
              <Link
                to={`/edit-recipe/${recipe.id}`}
                className="btn-primary flex items-center"
              >
                <FaEdit className="mr-2" />
                Edit Recipe
              </Link>
              <button
                onClick={deleteRecipe}
                className="btn-danger flex items-center"
              >
                <FaTrash className="mr-2" />
                Delete Recipe
              </button>
            </div>
          )}

          {/* Reviews Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Reviews ({reviews.length})
              </h3>
              {user && !isBanned && !isOwner && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-primary text-sm"
                >
                  {showReviewForm ? 'Cancel' : userReview ? 'Edit Review' : 'Write Review'}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && user && !isBanned && !isOwner && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-3xl focus:outline-none transition-transform hover:scale-110"
                        >
                          {star <= reviewRating ? (
                            <FaStar className="text-yellow-400" />
                          ) : (
                            <FaRegStar className="text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Share your thoughts about this recipe..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary"
                    >
                      {submittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    {userReview && (
                      <button
                        type="button"
                        onClick={deleteReview}
                        className="btn-danger"
                      >
                        Delete Review
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No reviews yet. Be the first to review this recipe!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/user/${review.User?.id}`} className="font-semibold text-gray-800 hover:text-primary-600">
                          {review.User?.username || 'Unknown User'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {review.user_id === user?.id && (
                        <button
                          onClick={() => {
                            setReviewRating(review.rating);
                            setReviewContent(review.review_content);
                            setShowReviewForm(true);
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          <FaEdit />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mt-2">{review.review_content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;