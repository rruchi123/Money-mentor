import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
});

// Add token to all requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyzeData = (data) => API.post("/analyze", data);

export const chatWithAI = (message, userData = null) =>
  API.post("/chat", {
    message,
    user_data: userData,
  });