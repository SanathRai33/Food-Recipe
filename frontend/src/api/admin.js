import apiClient from './axios';

export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getAllUsers: (params) => apiClient.get('/admin/users', { params }),
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),
  banUser: (id, data) => apiClient.patch(`/admin/users/${id}/ban`, data),
  unbanUser: (id) => apiClient.patch(`/admin/users/${id}/unban`),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  makeAdmin: (id) => apiClient.patch(`/admin/users/${id}/make-admin`),
  removeAdmin: (id) => apiClient.patch(`/admin/users/${id}/remove-admin`),
  getAllRecipes: (params) => apiClient.get('/admin/recipes', { params }),
  getAdminRecipeById: (id) => apiClient.get(`/admin/recipes/${id}`),
  deleteAdminRecipe: (id) => apiClient.delete(`/admin/recipes/${id}`),
  toggleRecipeVisibility: (id) => apiClient.patch(`/admin/recipes/${id}/toggle-visibility`),
};