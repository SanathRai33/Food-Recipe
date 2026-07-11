import apiClient from './axios';

export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  changePassword: (data) => apiClient.put('/users/change-password', data),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  getUserRecipes: (id, params) => apiClient.get(`/users/${id}/recipes`, { params }),
  getUserFavorites: (id) => apiClient.get(`/users/${id}/favorites`),
  getMyRecipes: (params) => apiClient.get('/users/my-recipes', { params }),
};