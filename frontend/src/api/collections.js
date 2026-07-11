import apiClient from './axios';

export const collectionAPI = {
  getCollections: () => apiClient.get('/collections'),
  getCollectionById: (id) => apiClient.get(`/collections/${id}`),
  createCollection: (data) => apiClient.post('/collections', data),
  updateCollection: (id, data) => apiClient.put(`/collections/${id}`, data),
  deleteCollection: (id) => apiClient.delete(`/collections/${id}`),
  addRecipeToCollection: (collectionId, data) => apiClient.post(`/collections/${collectionId}/recipes`, data),
  removeRecipeFromCollection: (collectionId, recipeId) => 
    apiClient.delete(`/collections/${collectionId}/recipes/${recipeId}`),
};