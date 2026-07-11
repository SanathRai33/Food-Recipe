import apiClient from './axios';

export const reviewAPI = {
  getRecipeReviews: (recipeId, params) => apiClient.get(`/review-ratings/recipe/${recipeId}`, { params }),
  getUserReview: (recipeId) => apiClient.get(`/review-ratings/me/${recipeId}`),
  createOrUpdateReview: (recipeId, data) => apiClient.post(`/review-ratings/${recipeId}`, data),
  deleteReview: (reviewId) => apiClient.delete(`/review-ratings/${reviewId}`),
};