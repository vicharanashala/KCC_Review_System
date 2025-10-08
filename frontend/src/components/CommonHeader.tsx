import { AppBar, Toolbar, Typography, Box,FormControl,MenuItem,InputLabel,Select } from '@mui/material';
import LogoutButton from './LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useState } from 'react';

const CommonHeader = () => {
  const { isAuthenticated, user, } = useAuth();
  const { states} = useToast();
  const [statevalue,setStateValue]=useState(user?.state||'N/A')

  if (!isAuthenticated) {
    return null; // Don't show header if user is not authenticated
  }
 // 1️⃣ Geocode state function (Nominatim)
 async function geocodeState(state: string) {
  const query = `${state}, India`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=1`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data || data.length === 0) {
    throw new Error('State not found');
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
// 2️⃣ Handle state change
const handleStateChange = async (newState: string) => {
  if (!newState || newState === statevalue) return;

  // Ask for confirmation
  const confirmChange = window.confirm(
    `Are you sure you want to change your state to "${newState}"?`
  );
  if (!confirmChange) return;

  try {
    // 3️⃣ Get geocode for new state
    const { latitude, longitude } = await geocodeState(newState);
    const userId=localStorage.getItem('user_id')
    // 4️⃣ Call backend to update user
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE_URL}/dashboard/users/${userId}/update-state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        state: newState,
        location: { type: 'Point', coordinates: [longitude, latitude] },
      }),
    });

    if (!res.ok) throw new Error('Failed to update state');

    const updatedUser = await res.json();

    // 5️⃣ Update context and local state
   // setUser(updatedUser);
    setStateValue(updatedUser.state);
    alert('State updated successfully!');
  } catch (err: any) {
    console.error('Error updating state:', err.message);
    alert('Failed to update state');
  }
};
  

  return (
    <AppBar position="static" sx={{ mb: 3, backgroundColor: '#FFF7ED' }}>
      <Toolbar>
        <Typography variant="h6" component="div" color="#000000">
          KCC Review System
        </Typography>
        <FormControl sx={{ minWidth: 180, maxWidth: 220 ,display: 'flex',  gap: 0, ml: 'auto' }} // 🔹 smaller width for button
      size="small" >
              <InputLabel id="role-label">State *</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={statevalue}
                label="State *"
                onChange={(e) => handleStateChange(e.target.value)}
              
                required
              >
                <MenuItem value="">
                  <em>Select State *</em>
                </MenuItem>
                {states.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
