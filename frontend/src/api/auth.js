import apiClient from "./axios";

export const authAPI = {
  login: (data) => apiClient.post("/auth/login", data),

  register: (data) => apiClient.post("/auth/register", data),

  getCurrentUser: () => apiClient.get("/auth/me"),

  forgotPassword: (data) =>
    apiClient.post("/auth/forgot-password", data),

  resetPassword: (token, data) =>
    apiClient.post(`/auth/reset-password/${token}`, data),
};