import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { useAppSelector } from './store';
import './App.css';

// Components
import NavigationBar from './components/common/NavigationBar';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import UsersPage from './pages/UsersPage';
import GroupsManagement from './pages/GroupsManagement';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ResendVerificationPage from './pages/ResendVerificationPage';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';

// Utils and Configuration
import { config, validateEnvironment, debugLog } from './utils/environment';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary';

// Protected Route Component with Role-Based Access Control (INDUSTRY STANDARD)
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  // Use Redux selector to get real-time auth state
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check if user has the required role
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    // Validate environment configuration on startup
    const validation = validateEnvironment();

    if (!validation.valid) {
      console.error('Environment validation failed:', validation.errors);
      validation.errors.forEach(error => {
        console.error(`❌ ${error}`);
      });
    }

    // Log application startup information
    debugLog('Application starting...', {
      mode: config.app.mode,
      environment: config.app.environment,
      version: config.app.version,
      debug: config.app.debug,
      buildDate: config.app.buildDate,
    });

    // Set up global error handling
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('React Error Boundary caught an error:', error, errorInfo);
      }}
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <GoogleMapsProvider>
              <AuthProvider>
                <Router>
                  <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
                    <NavigationBar />
                    <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/verify-email" element={<EmailVerificationPage />} />
                    <Route path="/resend-verification" element={<ResendVerificationPage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["Admin", "Manager", "Technician", "User"]}>
                          <main className="pt-16">
                            <Dashboard />
                          </main>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/map"
                      element={
                        <ProtectedRoute allowedRoles={["Admin", "Manager", "Technician", "User"]}>
                          <main className="pt-16">
                            <MapPage />
                          </main>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                          <main className="pt-16">
                            <UsersPage />
                          </main>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/groups"
                      element={
                        <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                          <main className="pt-16">
                            <GroupsManagement />
                          </main>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={["Admin"]}>
                          <main className="pt-16">
                            <AdminPage />
                          </main>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                          <main className="pt-16">
                            <AnalyticsPage />
                          </main>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                      path="*"
                      element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                          <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                              Page Not Found
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              The page you're looking for doesn't exist.
                            </p>
                            <Navigate to="/dashboard" replace />
                          </div>
                        </div>
                      }
                    />
                    </Routes>
                  </div>
                </Router>
              </AuthProvider>
            </GoogleMapsProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;