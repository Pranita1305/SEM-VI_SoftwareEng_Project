import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({ baseURL: BASE_URL });

// ─── Request interceptor: attach token ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: auto-logout on 401 ───────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login:  (email, password) => api.post("/auth/login",  { email, password }),
  signup: (email, password) => api.post("/auth/signup", { email, password }),
  me:     ()                => api.get("/auth/me"),
};

// ─── Zones ───────────────────────────────────────────────────
export const zonesAPI = {
  list:    ()   => api.get("/zones"),
  getById: (id) => api.get(`/zones/${id}`),
};

// ─── Predictions ─────────────────────────────────────────────
export const predictionsAPI = {
  list: (modelName = "RandomForest") =>
    api.get("/predictions", { params: { model_name: modelName } }),
};

// ─── Chatbot ─────────────────────────────────────────────────
export const chatbotAPI = {
  query: (message, modelName = "RandomForest") =>
    api.post("/chatbot/query", { message, model_name: modelName }),
};

// ─── Pricing ─────────────────────────────────────────────────
export const pricingAPI = {
  estimate: (zoneId, distanceKm, hour = null, weather = "Clear") =>
    api.post("/pricing/estimate", {
      zone_id: zoneId,
      distance_km: distanceKm,
      hour,
      weather,
    }),
};

export default api;