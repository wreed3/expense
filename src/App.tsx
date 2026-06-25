import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import CategoryManager from './components/CategoryManager';
import BudgetManager from './components/BudgetManager';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import DataManagement from './components/DataManagement';
import Navigation from './components/Navigation';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        {isAuthenticated && <Navigation />}
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/expenses"
            element={
              <PrivateRoute>
                <ExpenseList />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <CategoryManager />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/budgets"
            element={
              <PrivateRoute>
                <BudgetManager />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/data-management"
            element={
              <PrivateRoute>
                <DataManagement />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;