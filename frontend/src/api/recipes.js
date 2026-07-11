import apiClient from './axios';

export const recipeAPI = {
  createRecipe: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'ingredients' || key === 'instructions' || key === 'dietary_preferences') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'image' && data[key]) {
        formData.append('image', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return apiClient.post('/recipes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getRecipes: (params) => apiClient.get('/recipes', { params }),
  getRecipeById: (id) => apiClient.get(`/recipes/${id}`),
  updateRecipe: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'ingredients' || key === 'instructions' || key === 'dietary_preferences') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'image' && data[key]) {
        formData.append('image', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return apiClient.put(`/recipes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteRecipe: (id) => apiClient.delete(`/recipes/${id}`),
};