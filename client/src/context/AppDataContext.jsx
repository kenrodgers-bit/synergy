import { createContext, startTransition, useContext, useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "./AuthContext";

const initialState = {
  analytics: null,
  clients: [],
  collections: [],
  templates: [],
  reminders: [],
  inquiries: [],
  settings: null,
  users: []
};

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshAll() {
    if (!isAuthenticated) {
      setState(initialState);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requests = [
        api.get("/analytics/overview"),
        api.get("/clients"),
        api.get("/collections"),
        api.get("/reminders"),
        api.get("/settings/global")
      ];

      if (user?.role !== "collection-agent") {
        requests.push(api.get("/documents/templates"));
        requests.push(api.get("/inquiries"));
        requests.push(api.get("/users"));
      }

      const responses = await Promise.all(requests);
      const [analytics, clients, collections, reminders, settings, templates, inquiries, users] = responses;

      startTransition(() => {
        setState({
          analytics: analytics?.data || null,
          clients: clients?.data || [],
          collections: collections?.data || [],
          reminders: reminders?.data || [],
          settings: settings?.data || null,
          templates: templates?.data || [],
          inquiries: inquiries?.data || [],
          users: users?.data || []
        });
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load Synergy data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    } else {
      setState(initialState);
      setLoading(false);
      setError("");
    }
  }, [isAuthenticated, user?.role]);

  return (
    <AppDataContext.Provider
      value={{
        ...state,
        loading,
        error,
        refreshAll
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
}

