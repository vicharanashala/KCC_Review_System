import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';

interface Specilization{
  
  value: string;
  label:string;
}
interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  specialization: Specilization[];          // match your state variable
  setSpecialization: React.Dispatch<React.SetStateAction<Specilization[]>>;
  roles:Specilization[];
  setRoles:React.Dispatch<React.SetStateAction<Specilization[]>>;
  season: Specilization[];          // match your state variable
  setSeason: React.Dispatch<React.SetStateAction<Specilization[]>>;
  states:Specilization[]
  setStates:React.Dispatch<React.SetStateAction<Specilization[]>>;
  sector:Specilization[]
  setSector:React.Dispatch<React.SetStateAction<Specilization[]>>;

}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [specialization,setSpecialization]=useState<Specilization[] >(
    [
      { value: 'Crop Production & Management', label: 'Crop Production & Management' },
      { value: 'Plant Protection', label: 'Plant Protection' },
      { value: 'Water & Irrigation Management', label: 'Water & Irrigation Management' },
      // { value: 'admin', label: 'Admin' }
    ]
  )
  const [roles,setRoles]=useState<Specilization[]>([
    { value: 'agri_specialist', label: 'Agriculture Specialist' },
    { value: 'moderator', label: 'Moderator' }
    // { value: 'admin', label: 'Admin' }
  ])
  const [season,setSeason]=useState<Specilization[] >(
    [
      { value: 'Kharif', label: 'Kharif' },
      { value: 'Rabi', label: 'Rabi' },
      { value: 'Zaid', label: 'Zaid' },
      // { value: 'admin', label: 'Admin' }
    ])
   



const [states, setStates] = useState<Specilization[]>([
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Meghalaya', label: 'Meghalaya' },
  { value: 'Mizoram', label: 'Mizoram' },
  { value: 'Nagaland', label: 'Nagaland' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Sikkim', label: 'Sikkim' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Tripura', label: 'Tripura' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
  { value: 'Chandigarh', label: 'Chandigarh' },
  { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
  { value: 'Ladakh', label: 'Ladakh' },
  { value: 'Lakshadweep', label: 'Lakshadweep' },
  { value: 'Puducherry', label: 'Puducherry' }
]);
    const[sector,setSector]=useState<Specilization[]>(
      [
        { value: 'AGRICULTURE', label: 'AGRICULTURE' },
        { value: 'AGRO FORESTRY', label: 'AGRO FORESTRY' },
        { value: 'ANIMAL HUSBANDARY', label: 'ANIMAL HUSBANDARY' },
        { value: 'APICULTURE', label: 'APICULTURE' },
        { value: 'FISHERY', label: 'FISHERY' },
        { value: 'HORTICULTURE', label: 'HORTICULTURE' },
        { value: 'MUSHROOM', label: 'MUSHROOM' },
        // { value: 'admin', label: 'Admin' }
      ]
    )

 
 

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    setToast({
      open: true,
      message,
      severity
    });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  const handleClose = () => {
    setToast(prev => ({ ...prev, open: false }));
  };
  

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      specialization,        // matches interface
      setSpecialization,
      roles,
      setRoles,
      season,
      setSeason,
      sector,
      setSector,
      states,
      setStates
    }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};