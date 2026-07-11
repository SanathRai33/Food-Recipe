import apiClient from './axios';

export const followAPI = {
  followUser: (data) => apiClient.post('/follows', data),
  unfollowUser: (userId) => apiClient.delete(`/follows/${userId}`),
  checkFollow: (userId) => apiClient.get(`/follows/check/${userId}`),
  getFollowers: (userId) => apiClient.get(`/follows/${userId}/followers`),
  getFollowing: (userId) => apiClient.get(`/follows/${userId}/following`),
};