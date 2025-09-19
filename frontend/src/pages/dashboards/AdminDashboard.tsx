import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Container } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SubmitQuestionForm } from '../../components/admin/SubmitQuestionForm';
import { QuestionList } from '../../components/admin/QuestionList';
import type { Question } from '../../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/questions/`);
      return data;
    },
  });

  const submitQuestion = useMutation({
    mutationFn: async (questionData: Omit<Question, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await axios.post(`${API_BASE_URL}/questions/`, questionData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmitQuestion = async (data: any) => {
    try {
      await submitQuestion.mutateAsync(data);
      return { success: true };
    } catch (error) {
      console.error('Error submitting question:', error);
      return { success: false, error: 'Failed to submit question' };
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Submit Question" />
          <Tab label="Manage Questions" />
          <Tab label="User Management" />
          <Tab label="System Settings" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <SubmitQuestionForm onSubmit={handleSubmitQuestion} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <QuestionList questions={questions} loading={isLoading} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography>User management content goes here</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography>System settings content goes here</Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
