import { Box, Typography } from '@mui/material';

const ModeratorDashboard = () => {
  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Moderator Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Welcome to the moderator panel. Here you can review and moderate content.
      </Typography>
    </Box>
  );
};

export default ModeratorDashboard;
