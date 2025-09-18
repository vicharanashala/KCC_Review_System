import { Box, Typography, Paper, Grid, Card, CardContent, Button, IconButton, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const DashboardCard = ({
  title,
  value,
  caption,
  icon,
  onClick,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) => (
  <Card
    variant="outlined"
    sx={{
      borderRadius: 3,
      p: 2,
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: 'none',
      borderColor: '#e0e0e0',
      cursor: onClick ? 'pointer' : 'default',
      paddingBottom: 0,
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="subtitle2" color="text.primary">
          {title}
        </Typography>
        <IconButton size="small" sx={{ p: 0.5 }}>
          {icon}
        </IconButton>
      </Box>

      <Typography variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
        {value}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        {caption}
      </Typography>
    </CardContent>
  </Card>
);

const AgriSpecialistDashboard = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenQuestionModal = () => {
    setIsQuestionModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setQuestionText('');
  };

  const handleQuestionSubmit = async () => {
    if (!questionText.trim()) {
      showError('Please enter a question');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          original_query_text: questionText.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create question');
      }

      showSuccess('Question created successfully!');
      handleCloseQuestionModal();
      await fetchMyTasks();
    } catch (err) {
      console.error('Error creating question:', err);
      showError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  interface Task {
    type: string;
    answer_id: string;
    question_id: string;
    question_text: string;
    answer_preview: string;
    consecutive_approvals: number;
    created_at: string;
  }

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/my-tasks`, {
        headers: {
          Accept: 'application/json, text/plain, */*',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      console.log(data.tasks, "data---------");
      setTasks(data?.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchMyTasks();
    fetchNotifications();
  }, []);

  const quickActions = [
    {
      title: 'Review Queue',
      description: 'View and manage your assigned reviews',
      icon: <RateReviewIcon />,
      buttonText: 'Review Now',
      path: '/agri-specialist/review-queue',
    },
    {
      title: 'Performance',
      description: 'Track your review performance and metrics',
      icon: <AssessmentIcon />,
      buttonText: 'View Performance',
      path: '/agri-specialist/performance',
    },
    {
      title: 'Notifications',
      description: 'View your recent notifications and updates',
      icon: <NotificationsIcon />,
      buttonText: 'View Notifications',
      path: '/agri-specialist/notifications',
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Reviewer Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Welcome back! You have {tasks.length} pending reviews.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon fontSize="small" sx={{ color: '#000' }} />}
              onClick={handleOpenQuestionModal}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                color: '#000',
                width: '100%',
                borderColor: '#0000001A',
                '&:hover': {
                  borderColor: '#0000001A',
                },
              }}
            >
              Question
            </Button>

            {/* Question Creation Modal */}
            <Dialog open={isQuestionModalOpen} onClose={handleCloseQuestionModal} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Create Question</Typography>
                <IconButton
                  aria-label="close"
                  onClick={handleCloseQuestionModal}
                  sx={{
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <TextField
                  autoFocus
                  margin="dense"
                  id="question"
                  label="Type your question"
                  type="text"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  sx={{ mt: 1 }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button 
                  onClick={handleCloseQuestionModal}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleQuestionSubmit}
                  disabled={isSubmitting || !questionText.trim()}
                  sx={{
                    textTransform: 'none',
                    backgroundColor: '#00A63E',
                    '&:hover': {
                      backgroundColor: '#008c35',
                    },
                  }}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Question'}
                </Button>
              </DialogActions>
            </Dialog>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<TrendingUpIcon fontSize="small" sx={{ color: '#000' }} />}
              onClick={() => navigate('/agri-specialist/performance')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                color: '#000',
                borderColor: '#0000001A',
                '&:hover': {
                  borderColor: '#0000001A',
                },
              }}
            >
              Performance
            </Button>

            <Badge
              badgeContent={notifications.filter(n => !n.is_read).length}
              color="error"
              sx={{ '& .MuiBadge-badge': { top: 6, right: 6 } }}
            >
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReportProblemOutlinedIcon fontSize="small" sx={{ color: '#000' }} />}
                onClick={() => navigate('/agri-specialist/notifications')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  color: '#000',
                  borderColor: '#0000001A',
                  '&:hover': {
                    borderColor: '#0000001A',
                  },
                }}
              >
                Notifications
              </Button>
            </Badge>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} md={4} key={index}>
              <DashboardCard
                title={action.title}
                value={action.description}
                caption={action.buttonText}
                icon={action.icon}
                onClick={() => navigate(action.path)}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #f0f0f0',
                boxShadow: 'none',
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Questions Assigned for Review
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Questions assigned to you for review
              </Typography>

              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search questions by title, content, or category..."
                size="small"
                sx={{
                  backgroundColor: '#fff8ef',
                  borderRadius: 2,
                  mb: 3,
                  input: {
                    fontSize: 14,
                    color: '#5f5f5f',
                    paddingY: 1.5,
                    paddingX: 2,
                  },
                  '& fieldset': {
                    borderColor: '#fdebc8',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fcd89d',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fcd89d',
                  },
                }}
              />

              {loading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading tasks...
                </Typography>
              ) : tasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tasks available.
                </Typography>
              ) : (
                tasks.map((task, index) => (
                  console.log(task, "tasktasktask---------"),
                  
                  <Paper
                    key={`${task.answer_id}-${index}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      borderColor: '#eee',
                      '&:hover': {
                        boxShadow: 1,
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => {
                      // Add navigation to review page if needed
                      // navigate(`/review/${task.answer_id}`);
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      {task.question_text}
                    </Typography>

                    
                    <Typography variant="caption" color="text.secondary" display="block">
                      Approvals: {task.consecutive_approvals} • {new Date(task.created_at).toLocaleDateString()}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Question ID: {task.question_id}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/agri-specialist/review-queue', { state: { task } })}
                        sx={{
                          backgroundColor: '#000',
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontSize: 13,
                          '&:hover': { backgroundColor: '#222' },
                        }}
                      >
                       Review Answer
                      </Button>
                    </Box>
                  </Paper>
                ))
              )}

            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #f0f0f0',
                boxShadow: 'none',
                mb: 3,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Recent Activity
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Approved
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sustainable farming practices for wheat
                    <br />
                    9/17/2025 03:16 AM
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CancelOutlinedIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Rejected
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Dairy cattle nutrition guidelines
                    <br />
                    9/16/2025 10:16 PM
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Approved
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Greenhouse climate control systems
                    <br />
                    9/16/2025 06:16 PM
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Quick Stats */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #f0f0f0',
                boxShadow: 'none',
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Quick Stats
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Approval Rate
                </Typography>
                <Box sx={{ height: 6, borderRadius: 5, bgcolor: '#e0e0e0', position: 'relative' }}>
                  <Box
                    sx={{
                      width: '78.2%',
                      height: '100%',
                      bgcolor: '#000',
                      borderRadius: 5,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                </Box>
                <Typography variant="body2" fontWeight={500} sx={{ mt: 1 }}>
                  78.2%
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2, borderTop: '1px solid #e0e0e0', pt: 2 }}>
                <Typography variant="body2" color="success.main">
                  +32 <br />
                  <Typography variant="caption" color="text.secondary">
                    Incentives
                  </Typography>
                </Typography>
                <Typography variant="body2" color="error.main">
                  -8 <br />
                  <Typography variant="caption" color="text.secondary">
                    Penalties
                  </Typography>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AgriSpecialistDashboard;
