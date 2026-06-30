const API_BASE_URL = '/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ============ AUTH API ============
const authAPI = {
  register: (data) => {
    console.log("Calling API...", data);
    return apiClient.post("/auth/register", data)
  },
    login: (data) => apiClient.post('/auth/login', data),
    getCurrentUser: () => apiClient.get('/auth/me'),
};

// ============ USER API ============
export const userAPI = {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data) => apiClient.put('/users/profile', data),
    changePassword: (data) => apiClient.put('/users/change-password', data),
    getUserById: (id) => apiClient.get(`/users/${id}`),
    getUserRecipes: (id, params) => apiClient.get(`/users/${id}/recipes`, { params }),
    getUserFavorites: (id) => apiClient.get(`/users/${id}/favorites`),
};

// ============ RECIPE API ============
export const recipeAPI = {
    createRecipe: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'ingredients' || key === 'instructions' || key === 'dietary_preferences') {
                formData.append(key, JSON.stringify(data[key]));
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

// ============ FAVORITE API ============
export const favoriteAPI = {
    getFavorites: () => apiClient.get('/favorites'),
    addFavorite: (data) => apiClient.post('/favorites', data),
    removeFavorite: (recipeId) => apiClient.delete(`/favorites/${recipeId}`),
    checkFavorite: (recipeId) => apiClient.get(`/favorites/check/${recipeId}`),
};

// ============ COLLECTION API ============
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

// ============ RATING API ============
export const ratingAPI = {
    createOrUpdateRating: (recipeId, data) => apiClient.post(`/recipes/${recipeId}/rating`, data),
    getRecipeRatings: (recipeId) => apiClient.get(`/recipes/${recipeId}/ratings`),
    getUserRating: (recipeId) => apiClient.get(`/recipes/${recipeId}/rating`),
};

// ============ REVIEW API ============
export const reviewAPI = {
    getReviewsByRecipe: (recipeId, params) => apiClient.get(`/recipes/${recipeId}/reviews`, { params }),
    createReview: (recipeId, data) => apiClient.post(`/recipes/${recipeId}/reviews`, data),
    updateReview: (reviewId, data) => apiClient.put(`/reviews/${reviewId}`, data),
    deleteReview: (reviewId) => apiClient.delete(`/reviews/${reviewId}`),
};

// ============ FOLLOW API ============
export const followAPI = {
    followUser: (data) => apiClient.post('/follows/follow', data),
    unfollowUser: (userId) => apiClient.delete(`/follows/unfollow/${userId}`),
    checkFollow: (userId) => apiClient.get(`/follows/check/${userId}`),
    getFollowers: (userId) => apiClient.get(`/follows/followers/${userId}`),
    getFollowing: (userId) => apiClient.get(`/follows/following/${userId}`),
};

// ============ ACTIVITY API ============
export const activityAPI = {
    getActivityFeed: (params) => apiClient.get('/activities/feed', { params }),
    getMyActivities: (params) => apiClient.get('/activities/me', { params }),
    getUserActivities: (userId, params) => apiClient.get(`/activities/user/${userId}`, { params }),
};

// ============ ADMIN API ============
export const adminAPI = {
    getStats: () => apiClient.get('/admin/stats'),
    getAllUsers: (params) => apiClient.get('/admin/users', { params }),
    getUserById: (id) => apiClient.get(`/admin/users/${id}`),
    banUser: (id) => apiClient.patch(`/admin/users/${id}/ban`),
    unbanUser: (id) => apiClient.patch(`/admin/users/${id}/unban`),
    deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
    makeAdmin: (id) => apiClient.patch(`/admin/users/${id}/make-admin`),
    removeAdmin: (id) => apiClient.patch(`/admin/users/${id}/remove-admin`),
    getAllRecipes: (params) => apiClient.get('/admin/recipes', { params }),
    getAdminRecipeById: (id) => apiClient.get(`/admin/recipes/${id}`),
    deleteAdminRecipe: (id) => apiClient.delete(`/admin/recipes/${id}`),
    toggleRecipeVisibility: (id) => apiClient.patch(`/admin/recipes/${id}/toggle-visibility`),
};

// ============ LEGACY API REQUEST FUNCTION (for backward compatibility) ============
export const apiRequest = async (endpoint, method = 'GET', data = null, token = null) => {
    try {
        const config = {
            method,
            url: endpoint,
        };

        if (data) {
            config.data = data;
        }

        if (token) {
            config.headers = { Authorization: `Bearer ${token}` };
        }

        const response = await apiClient(config);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Default export for use in script tags
if (typeof window !== 'undefined') {
    window.API = {
        auth: authAPI,
        user: userAPI,
        recipe: recipeAPI,
        favorite: favoriteAPI,
        collection: collectionAPI,
        rating: ratingAPI,
        review: reviewAPI,
        follow: followAPI,
        activity: activityAPI,
        admin: adminAPI,
        apiRequest: apiRequest,
    };
}