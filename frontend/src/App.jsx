import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Pages
import Feed          from './pages/Feed';
import Profile       from './pages/Profile';
import Campaigns     from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Messages      from './pages/Messages';
import Shop          from './pages/Shop';
import Orders        from './pages/Orders';
import Explore       from './pages/Explore';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminDashboard  from './pages/admin/Dashboard';
import AdminUsers      from './pages/admin/Users';
import AdminPosts      from './pages/admin/Posts';
import AdminCampaigns  from './pages/admin/Campaigns';

// Route Guards
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute   from './routes/AdminRoute';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="gradient-text font-semibold text-lg">Loading CreatorHub…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected App Routes */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/"               element={<Feed />} />
        <Route path="/explore"        element={<Explore />} />
        <Route path="/profile/:id"    element={<Profile />} />
        <Route path="/campaigns"      element={<Campaigns />} />
        <Route path="/campaigns/:id"  element={<CampaignDetail />} />
        <Route path="/messages"       element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="/shop"           element={<Shop />} />
        <Route path="/orders"         element={<Orders />} />
        <Route path="/notifications"  element={<Notifications />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute><MainLayout /></AdminRoute>}>
        <Route path="/admin"            element={<AdminDashboard />} />
        <Route path="/admin/users"      element={<AdminUsers />} />
        <Route path="/admin/posts"      element={<AdminPosts />} />
        <Route path="/admin/campaigns"  element={<AdminCampaigns />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
