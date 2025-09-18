import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LogoutButton />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default CommonHeader;
