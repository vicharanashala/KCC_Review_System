import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Box, 
  TextField, 
  Button, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import type { Question } from '../../types';

interface SubmitQuestionFormProps {
  onSubmit: (data: Omit<Question, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
}

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Whole Year'];
const PRIORITIES = ['low', 'medium', 'high'] as const;

export const SubmitQuestionForm = ({ onSubmit }: SubmitQuestionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<Omit<Question, 'id' | 'status' | 'createdAt' | 'updatedAt'>>({
    defaultValues: {
      crop: '',
      state: '',
      district: '',
      originalQuery: '',
      season: '',
      priority: 'medium',
    },
  });

  const handleFormSubmit = async (data: Omit<Question, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const result = await onSubmit(data);
      if (result.success) {
        setSubmitStatus({ success: true, message: 'Question submitted successfully!' });
        reset();
      } else {
        setSubmitStatus({ success: false, message: result.error || 'Failed to submit question' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({ 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Submit New Question
      </Typography>
      <Typography color="textSecondary" paragraph>
        Fill in the details below to submit a new question for review.
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="crop"
              control={control}
              rules={{ required: 'Crop name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Crop"
                  fullWidth
                  variant="outlined"
                  error={!!errors.crop}
                  helperText={errors.crop?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="state"
              control={control}
              rules={{ required: 'State is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="State"
                  fullWidth
                  variant="outlined"
                  error={!!errors.state}
                  helperText={errors.state?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="district"
              control={control}
              rules={{ required: 'District is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="District"
                  fullWidth
                  variant="outlined"
                  error={!!errors.district}
                  helperText={errors.district?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.season} disabled={isSubmitting}>
              <InputLabel id="season-label">Season</InputLabel>
              <Controller
                name="season"
                control={control}
                rules={{ required: 'Season is required' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="season-label"
                    label="Season"
                    fullWidth
                  >
                    {SEASONS.map((season) => (
                      <MenuItem key={season} value={season}>
                        {season}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="originalQuery"
              control={control}
              rules={{ 
                required: 'Query text is required',
                minLength: { value: 10, message: 'Query must be at least 10 characters' }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Original Query"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  error={!!errors.originalQuery}
                  helperText={errors.originalQuery?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.priority} disabled={isSubmitting}>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="priority-label"
                    label="Priority"
                    fullWidth
                  >
                    {PRIORITIES.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                type="button" 
                variant="outlined" 
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Question'}
              </Button>
            </Box>
          </Grid>
          
          {submitStatus && (
            <Grid item xs={12}>
              <Alert 
                severity={submitStatus.success ? 'success' : 'error'}
                onClose={() => setSubmitStatus(null)}
                sx={{ mt: 2 }}
              >
                <AlertTitle>
                  {submitStatus.success ? 'Success!' : 'Error'}
                </AlertTitle>
                {submitStatus.message}
              </Alert>
            </Grid>
          )}
        </Grid>
      </form>
    </Paper>
  );
};

export default SubmitQuestionForm;
