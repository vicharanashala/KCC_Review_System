import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Call the logout function from AuthContext
      await logout();
      // Redirect to login page after successful logout
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to logout:', error);
      // Even if there's an error, we'll still redirect to login
      navigate('/login', { replace: true });
    }
  };

  return (
    <Button 
      variant="contained" 
      color="error"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? 'Logging out...' : 'Logout'}
    </Button>
  );
};

export default LogoutButton;
