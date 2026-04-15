import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";

const PublicHome = lazy(() => import("./pages/PublicHome"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));

function ProtectedLayout() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}

function Placeholder() {
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="screen-center">Loading Synergy...</div>}>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/app" element={<DashboardPage />} />
                <Route path="/app/clients" element={<ClientsPage />} />
                <Route path="/app/collections" element={<CollectionsPage />} />

                <Route element={<ProtectedRoute allowedRoles={["super-admin", "admin"]} />}>
                  <Route element={<Placeholder />}>
                    <Route path="/app/documents" element={<DocumentsPage />} />
                    <Route path="/app/reports" element={<ReportsPage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["super-admin"]} />}>
                  <Route path="/app/team" element={<TeamPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
