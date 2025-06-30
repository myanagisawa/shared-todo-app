import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state when app starts
    initialize();
  }, [initialize]);

  return (
    <div className="App">
      {isAuthenticated ? (
        <ProtectedRoute fallback={<AuthPage />}>
          <DashboardPage />
        </ProtectedRoute>
      ) : (
        <AuthPage />
      )}
    </div>
  );
}

export default App;