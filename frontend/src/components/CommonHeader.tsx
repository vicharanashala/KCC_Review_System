import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import LogoutButton from './LogoutButton';
import { useAuth } from '../contexts/AuthContext';

const CommonHeader = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't show header if user is not authenticated
  }

  return (
    <AppBar position="static" sx={{ mb: 3, backgroundColor: '#FFF7ED' }}>
      <Toolbar>
        <Typography variant="h6" component="div" color="#000000">
          KCC Review System
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
              <Typography variant="body2" sx={{ color: '#000000', fontWeight: 600 }}>
                {user.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666666' }}>
                {user.email}
              </Typography>
            </Box>
            <LogoutButton />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default CommonHeader;
