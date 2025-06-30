import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state when app starts
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <div className="App min-h-screen bg-gray-50">
        {isAuthenticated ? (
          <ProtectedRoute fallback={<AuthPage />}>
            <DashboardPage />
          </ProtectedRoute>
        ) : (
          <AuthPage />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;