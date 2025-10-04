import { Box } from '@mui/material';
import { ReactNode } from 'react';
import CommonHeader from './CommonHeader';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <CommonHeader />
      <Box 
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          py: 3,
          px: 3, // Add some horizontal padding for better content readability
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
