import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/context/AuthContext';
import { LoginForm } from '../features/auth/components/LoginForm';
import CVEditor from './CVEditor';
import Layout from './Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginForm />} />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <CVEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={<Navigate to="/jobs" replace />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
