import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const API = "http://localhost:8000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || "Login failed" };
      const userData = { username: data.username, role: data.role, name: data.name };
      setUser(userData);
      sessionStorage.setItem("auth_user", JSON.stringify(userData));
      return { success: true, role: data.role };
    } catch {
      return { success: false, error: "Cannot connect to server. Is the backend running?" };
    }
  };

  const register = async (username, password, name, role) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name, role })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || "Registration failed" };
      return { success: true };
    } catch {
      return { success: false, error: "Cannot connect to server. Is the backend running?" };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("screening_results");
    sessionStorage.removeItem("job_info");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}