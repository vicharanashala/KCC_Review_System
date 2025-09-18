import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Box, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { setToastFunctions } from './api/auth';
import { setToastFunctions as setApiToastFunctions } from './utils/apiWithToast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AgriSpecialistLayout } from './layouts/AgriSpecialistLayout';
import AgriSpecialistDashboard from './pages/dashboards/AgriSpecialistDashboard';
import { ReviewQueue } from './pages/agri-specialist/ReviewQueue';
import { Performance } from './pages/agri-specialist/Performance';
import { Notifications } from './pages/agri-specialist/Notifications';
import ModeratorDashboard from './pages/dashboards/ModeratorDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Role-based protected route component
const RoleBasedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

// Toast initializer component
const ToastInitializer = ({ children }: { children: React.ReactNode }) => {
  const { showSuccess, showError } = useToast();

  // Initialize immediately, not in useEffect
  React.useMemo(() => {
    console.log('Initializing toast functions');
    // Initialize toast functions for auth API
    setToastFunctions(showSuccess, showError);
    // Initialize toast functions for utility API
    setApiToastFunctions(showSuccess, showError);
    console.log('Toast functions initialized');
  }, [showSuccess, showError]);

  return <>{children}</>;
};

// Main App component with routing
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
      />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          {() => (
            <Layout>
              <Outlet />
            </Layout>
          )}
        </ProtectedRoute>
      }>
        {/* Role-based dashboard routes */}
        <Route element={<RoleBasedRoute allowedRoles={['agri_specialist']} />}>
          <Route path="/agri-specialist/dashboard" element={<AgriSpecialistDashboard />} />
        </Route>
        
        <Route element={<RoleBasedRoute allowedRoles={['agri_specialist']} />}>
          <Route path="/agri-specialist" element={<AgriSpecialistLayout><AgriSpecialistDashboard /></AgriSpecialistLayout>} />
          <Route path="/agri-specialist/review-queue/:questionId?" element={<AgriSpecialistLayout><ReviewQueue /></AgriSpecialistLayout>} />
          <Route path="/agri-specialist/performance" element={<AgriSpecialistLayout><Performance /></AgriSpecialistLayout>} />
          <Route path="/agri-specialist/notifications" element={<AgriSpecialistLayout><Notifications /></AgriSpecialistLayout>} />
        </Route>
        
        <Route element={<RoleBasedRoute allowedRoles={['moderator']} />}>
          <Route path="/moderator" element={<ModeratorDashboard />} />
        </Route>
        
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        
        {/* Default route based on role */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {({ user }) => (
                <Navigate 
                  to={
                    user.role === 'admin' ? '/admin' : 
                    user.role === 'moderator' ? '/moderator/dashboard' : 
                    user.role === 'agri_specialist' ? '/agri-specialist/dashboard' : 
                    '/login'
                  } 
                  replace 
                />
              )}
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Unauthorized route */}
      <Route 
        path="/unauthorized" 
        element={
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Unauthorized Access
            </Typography>
            <Typography>
              You don't have permission to access this page.
            </Typography>
          </Box>
        } 
      />
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// App component with providers
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ToastProvider>
          <ToastInitializer>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ToastInitializer>
        </ToastProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
