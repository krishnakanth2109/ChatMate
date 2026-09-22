// src/services/api.js
import axios from 'axios';

// This will now correctly read "http://localhost:5000" from your fixed .env file
const API_BASE_URL = import.meta.env.VITE_API_URL;

// This check is good practice to ensure the .env file is loaded.
if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined. Please check your .env file in the root of the frontend project.");
}

const api = axios.create({
  // The final URL will now be correct: http://localhost:5000/api
  baseURL: `${API_BASE_URL}/api`, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// This interceptor correctly adds your login token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;