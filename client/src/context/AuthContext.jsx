import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("synergy_token");

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("synergy_token");
        setUser(null);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem("synergy_token", data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("synergy_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        checkingAuth,
        isAuthenticated: Boolean(user),
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

