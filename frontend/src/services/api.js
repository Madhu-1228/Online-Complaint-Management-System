import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("civiccare_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to communicate with the CivicCare server. Please ensure the backend and MongoDB are active.";
    return Promise.reject({ ...error, customMessage: message });
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  },
  getCitizens: async (search) => {
    const url = search ? `/auth/citizens?search=${encodeURIComponent(search)}` : "/auth/citizens";
    const response = await api.get(url);
    return response.data;
  },
  updateCitizenStatus: async (id, status) => {
    const response = await api.put(`/auth/citizens/${id}/status`, { status });
    return response.data;
  },
};

export const organizationAPI = {
  getActive: async () => {
    const response = await api.get("/organizations");
    return response.data;
  },
  getAll: async () => {
    const response = await api.get("/organizations/all");
    return response.data;
  },
  getById: async (idOrSlug) => {
    const response = await api.get(`/organizations/${idOrSlug}`);
    return response.data;
  },
  create: async (orgData) => {
    const response = await api.post("/organizations", orgData);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/organizations/${id}/status`, { status });
    return response.data;
  },
  addCategory: async (id, categoryData) => {
    const response = await api.post(`/organizations/${id}/categories`, categoryData);
    return response.data;
  },
  deleteCategory: async (id, categoryName) => {
    const response = await api.delete(`/organizations/${id}/categories/${encodeURIComponent(categoryName)}`);
    return response.data;
  },
  addDepartment: async (id, deptData) => {
    const response = await api.post(`/organizations/${id}/departments`, deptData);
    return response.data;
  },
  editDepartment: async (id, oldDeptName, deptData) => {
    const response = await api.put(`/organizations/${id}/departments/${encodeURIComponent(oldDeptName)}`, deptData);
    return response.data;
  },
  deleteDepartment: async (id, deptName) => {
    const response = await api.delete(`/organizations/${id}/departments/${encodeURIComponent(deptName)}`);
    return response.data;
  },
};

export const complaintAPI = {
  submit: async (complaintData) => {
    const response = await api.post("/complaints", complaintData);
    return response.data;
  },
  track: async (trackingId) => {
    const response = await api.get(`/complaints/track/${encodeURIComponent(trackingId.trim())}`);
    return response.data;
  },
  getAll: async (organizationId, domain) => {
    const params = new URLSearchParams();
    if (organizationId && organizationId !== "ALL") params.append("organizationId", organizationId);
    if (domain && domain !== "ALL") params.append("domain", domain);
    const qs = params.toString();
    const url = qs ? `/complaints?${qs}` : "/complaints";
    const response = await api.get(url);
    return response.data;
  },
  getMyComplaints: async () => {
    const response = await api.get("/complaints/my");
    return response.data;
  },
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/complaints/${id}/status`, statusData);
    return response.data;
  },
  assign: async (id, assignData) => {
    const response = await api.put(`/complaints/${id}/assign`, assignData);
    return response.data;
  },
  submitFeedback: async (id, feedbackData) => {
    const response = await api.put(`/complaints/${id}/feedback`, feedbackData);
    return response.data;
  },
  getFeedbacks: async () => {
    const response = await api.get("/complaints/feedbacks");
    return response.data;
  },
  reopen: async (id, reopenData) => {
    const response = await api.put(`/complaints/${id}/reopen`, reopenData);
    return response.data;
  },
  getAnalytics: async (organizationId, domain) => {
    const params = new URLSearchParams();
    if (organizationId && organizationId !== "ALL") params.append("organizationId", organizationId);
    if (domain && domain !== "ALL") params.append("domain", domain);
    const qs = params.toString();
    const url = qs ? `/complaints/analytics?${qs}` : "/complaints/analytics";
    const response = await api.get(url);
    return response.data;
  },
  deleteComplaint: async (id) => {
    const response = await api.delete(`/complaints/${id}`);
    return response.data;
  },
  checkDatabase: async () => {
    const response = await api.get("/complaints/debug/database");
    return response.data;
  },
};

export const notificationAPI = {
  getMyNotifications: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },
  sendNotification: async (notificationData) => {
    const response = await api.post("/notifications", notificationData);
    return response.data;
  },
};

export default api;
