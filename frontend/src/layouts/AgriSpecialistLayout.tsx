import { Box } from '@mui/material';

interface AgriSpecialistLayoutProps {
  children: React.ReactNode;
}

export const AgriSpecialistLayout = ({ children }: AgriSpecialistLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AgriSpecialistLayout;
