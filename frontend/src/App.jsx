import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import AppLayout from './layouts/AppLayout.jsx';
import RepositoryLayout from './layouts/RepositoryLayout.jsx';
import RequireAuth from './layouts/RequireAuth.jsx';
import { useBootstrapSession } from './features/auth/useBootstrapSession.js';
import PageFallback from './components/PageFallback.jsx';
import Logo from './components/Logo.jsx';
import TraceLine from './components/TraceLine.jsx';


const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const RepositoriesPage = lazy(() => import('./pages/RepositoriesPage.jsx'));
const RepositoryDetailPage = lazy(() => import('./pages/RepositoryDetailPage.jsx'));
const CodeSearchPage = lazy(() => import('./pages/CodeSearchPage.jsx'));
const CodebaseChatPage = lazy(() => import('./pages/CodebaseChatPage.jsx'));
const PullRequestsPage = lazy(() => import('./pages/PullRequestsPage.jsx'));
const RepositoryAnalyticsPage = lazy(() => import('./pages/RepositoryAnalyticsPage.jsx'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage.jsx'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));

export default function App() {
  const sessionChecked = useBootstrapSession();

  if (!sessionChecked) {
    return (
        <div className="center-screen" role="status" aria-label="Checking your session">
          <Logo size={36} />
          <div className="trace-slot">
            <TraceLine active tone="ember" label="Checking your session" />
          </div>
        </div>
    );
  }

  return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

          {/* Authenticated */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/repositories" element={<RepositoriesPage />} />
              <Route path="/repositories/:id" element={<RepositoryLayout />}>
                <Route index element={<RepositoryDetailPage />} />
                <Route path="search" element={<CodeSearchPage />} />
                <Route path="chat" element={<CodebaseChatPage />} />
                <Route path="pull-requests" element={<PullRequestsPage />} />
                <Route path="analytics" element={<RepositoryAnalyticsPage />} />
                <Route path="documentation" element={<DocumentationPage />} />
              </Route>
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
  );
}
