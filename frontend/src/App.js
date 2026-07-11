import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout Components
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Main Pages
import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import CreateRecipe from "./pages/CreateRecipe";
import EditRecipe from "./pages/EditRecipe";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Favorites from "./pages/Favorites";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import CreateCollection from "./pages/CreateCollection";
import EditCollection from "./pages/EditCollection";
import ActivityFeed from "./pages/ActivityFeed";
import MyActivities from "./pages/MyActivities";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRecipes from "./pages/admin/AdminRecipes";

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// App Component
const AppRoutes = () => {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Routes>
        {/* Auth Routes - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes with Main Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipe/:id" element={<RecipeDetail />} />
          <Route path="create-recipe" element={<CreateRecipe />} />
          <Route path="edit-recipe/:id" element={<EditRecipe />} />
          <Route path="profile" element={<Profile />} />
          <Route path="user/:id" element={<UserProfile />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collection/:id" element={<CollectionDetail />} />
          <Route path="create-collection" element={<CreateCollection />} />
          <Route path="edit-collection/:id" element={<EditCollection />} />
          <Route path="activity-feed" element={<ActivityFeed />} />
          <Route path="my-activities" element={<MyActivities />} />
        </Route>

        {/* Admin Routes with Admin Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="recipes" element={<AdminRecipes />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
