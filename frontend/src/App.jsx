import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import AppLayout from './layouts/AppLayout.jsx';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OAuthCallbackPage from './pages/OAuthCallbackPage.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import RepositoriesPage from './pages/RepositoriesPage.jsx';
import RepositoryDetailPage from './pages/RepositoryDetailPage.jsx';
import CodeSearchPage from './pages/CodeSearchPage.jsx';
import CodebaseChatPage from './pages/CodebaseChatPage.jsx';
import PullRequestsPage from './pages/PullRequestsPage.jsx';
import RepositoryAnalyticsPage from './pages/RepositoryAnalyticsPage.jsx';
import DocumentationPage from './pages/DocumentationPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Authenticated */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/repositories/:id" element={<RepositoryDetailPage />} />
          <Route path="/repositories/:id/search" element={<CodeSearchPage />} />
          <Route path="/repositories/:id/chat" element={<CodebaseChatPage />} />
          <Route path="/repositories/:id/pull-requests" element={<PullRequestsPage />} />
          <Route path="/repositories/:id/analytics" element={<RepositoryAnalyticsPage />} />
          <Route path="/repositories/:id/documentation" element={<DocumentationPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
