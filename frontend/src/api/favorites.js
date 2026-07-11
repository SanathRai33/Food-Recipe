import apiClient from './axios';

export const favoriteAPI = {
  getFavorites: () => apiClient.get('/favorites'),
  addFavorite: (data) => apiClient.post('/favorites', data),
  removeFavorite: (recipeId) => apiClient.delete(`/favorites/${recipeId}`),
  checkFavorite: (recipeId) => apiClient.get(`/favorites/check/${recipeId}`),
};