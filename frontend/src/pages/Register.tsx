import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { authApi } from '../api/auth';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
    specialization:'',
   
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showError,specialization } = useToast();
  const [positions,setPositions]=useState <[number,number ]|null> (null)
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [district,setDistrict]=useState('')
  const [state,setState]=useState('')
  


  const roles = [
    { value: 'agri_specialist', label: 'Agriculture Specialist' },
    { value: 'moderator', label: 'Moderator' }
    // { value: 'admin', label: 'Admin' }
  ];
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
   // setSpecialization([...specialization,{ value: 'testing', label: 'testing && mangement' }])
  };
  useEffect(()=>{
    if(locationAllowed==false){
    navigator.geolocation.getCurrentPosition(
      async (position) => {
      const { latitude, longitude } = position.coords;
     // console.log("latitude===",latitude,longitude)
    // let latitude=11.41413592238097//to give default
    // let longitude=78.49325520865813
      setPositions([latitude,longitude])
      setLocationAllowed(true)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
      const res = await fetch(url);
      const data = await res.json();
      if (data.address ) {
        setDistrict(data.address.state_district)
        setState(data.address.state)
     }
    }
    ,
    (error)=>{
      console.log("error while fetching location,",error)
      setLocationAllowed(false);
        alert(
          "Location access is required to use this feature. Please allow location in your browser."
        );
    }
    )
  }
  setLocationAllowed(false)
  setPositions(null)
  },[])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    const validEmail = /^[a-zA-Z0-9._%+-]+@annam\.ai$/;
  if (!validEmail.test(formData.email)) {
    showError("Only @annam.ai email addresses are allowed");
    return;
  }

    setLoading(true);
    
    
    try {
      await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        specialization:formData.specialization,
        district:district,
        state:state,
      //  coordinates:positions,
        location: {
          type: "Point",
          coordinates: positions, // [longitude, latitude]
        }
       
        
        
      });
      
      setTimeout(() => {
        navigate('/login', { state: { registered: true } });
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create an Account
          </Typography>
          
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
             <TextField
              margin="normal"
              fullWidth
              id="location"
              label="Location"
              name="location"
              type="tel"
              autoComplete="tel"
              value={district?`${district}(Dist), ${state}(state)`:"Detecting Location"}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="role-label">Role *</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Role *"
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
              >
                <MenuItem value="">
                  <em>Select a role</em>
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="role-label">Specilization *</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.specialization}
                label="Specilization *"
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                required
              >
                <MenuItem value="">
                  <em>Select Specilization</em>
                </MenuItem>
                {specialization.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
