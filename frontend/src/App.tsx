import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Box, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import{NotificationProvider} from './contexts/NotificationContext'
import { setToastFunctions } from './api/auth';
import { setToastFunctions as setApiToastFunctions } from './utils/apiWithToast';
import { setToastFunctions as setPeerValidationToastFunctions } from './api/peerValidation';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AgriSpecialistLayout } from './layouts/AgriSpecialistLayout';
import AgriSpecialistDashboard from './pages/dashboards/AgriSpecialistDashboard';
import { ReviewQueue } from './pages/agri-specialist/ReviewQueue';
import { Performance } from './pages/agri-specialist/Performance';
import { Notifications } from './pages/agri-specialist/Notifications';
import AdminDashboard from './pages/dashboards/AdminDashboard';

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

const ToastInitializer = ({ children }: { children: React.ReactNode }) => {
  const { showSuccess, showError } = useToast();

  React.useMemo(() => {
    setToastFunctions(showSuccess, showError);
    setApiToastFunctions(showSuccess, showError);
    setPeerValidationToastFunctions(showSuccess, showError);
  }, [showSuccess, showError]);

  return <>{children}</>;
};

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
      
      <Route element={
        <ProtectedRoute>
          {() => (
            <Layout>
              <Outlet />
            </Layout>
          )}
        </ProtectedRoute>
      }>
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
          <Route path="/moderator/dashboard" element={<AgriSpecialistDashboard />} />
          <Route path="/moderator/review-queue/:questionId?" element={<AgriSpecialistLayout><ReviewQueue /></AgriSpecialistLayout>} />
          <Route path="/moderator/performance" element={<AgriSpecialistLayout><Performance /></AgriSpecialistLayout>} />
          <Route path="/moderator/notifications" element={<AgriSpecialistLayout><Notifications /></AgriSpecialistLayout>} />
        </Route>
        
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        
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
            <NotificationProvider>
              <AppRoutes />
              </NotificationProvider>
            </AuthProvider>
          </ToastInitializer>
        </ToastProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
