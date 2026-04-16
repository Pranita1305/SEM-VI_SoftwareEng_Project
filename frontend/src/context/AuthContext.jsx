import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { email, role }
  const [token, setToken]     = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then((res) => setUser(res.data))
      .catch(() => { localStorage.removeItem("token"); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password);
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    // Fetch user profile
    const me = await authAPI.me();
    setUser(me.data);
    return me.data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const res = await authAPI.signup(email, password);
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    const me = await authAPI.me();
    setUser(me.data);
    return me.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
