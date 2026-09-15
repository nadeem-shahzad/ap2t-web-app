// lib/axios.js
import axios from 'axios';
import { BASE_URL } from '@/lib/constants';
import { toast } from 'sonner';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  config.baseURL = BASE_URL;

  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong';
    toast.error(message);

    return Promise.reject(error);
  }
);

export default axiosInstance;
