import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = 'http://192.168.1.21:8000';
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adjuntar el Token JWT automáticamente en peticiones protegidas
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- SERVICIOS DE AUTENTICACIÓN ---

// 1. Registro de usuario (Envía JSON estándar)
export const registerUser = async (nombre, email, password) => {
  const response = await api.post('/auth/register', {
    nombre,
    email,
    password,
  });
  return response.data;
};

// 2. Inicio de sesión (Envía application/x-www-form-urlencoded)
export const loginUser = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email); // FastAPI exige la clave 'username'
  params.append('password', password);

  const response = await api.post('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data; // Devuelve { access_token: "...", token_type: "bearer" }
};

export default api;