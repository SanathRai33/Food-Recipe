import apiClient from './axios';

export const activityAPI = {
  getActivityFeed: (params) => apiClient.get('/activities/feed', { params }),
  getMyActivities: (params) => apiClient.get('/activities/me', { params }),
  getUserActivities: (userId, params) => apiClient.get(`/activities/user/${userId}`, { params }),
};