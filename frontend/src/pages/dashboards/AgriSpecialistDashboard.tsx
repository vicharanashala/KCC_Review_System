import { Box, Typography, Paper, Grid, Card, CardContent, Button, IconButton, Badge, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, 
  MenuItem,
  FormControl,
  InputLabel,
  Select,Pagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
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
      borderRadius: 2,
      p: 3,
      minHeight: 140,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderColor: '#e5e7eb',
      cursor: onClick ? 'pointer' : 'default',
      backgroundColor: '#ffffff',
      '&:hover': onClick ? {
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transform: 'translateY(-1px)',
        transition: 'all 0.2s ease-in-out'
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="#6b7280" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
          {title}
        </Typography>
        <Box sx={{ color: '#9ca3af', fontSize: '1.25rem' }}>
          {icon}
        </Box>
      </Box>

      <Typography variant="h3" sx={{ 
        fontWeight: 700, 
        color: '#111827', 
        mb: 1,
        fontSize: '1rem',
        lineHeight: 1.2
      }}>
        {value}
      </Typography>

      <Typography variant="caption" sx={{ 
        color: '#6b7280', 
        fontSize: '0.75rem',
        fontWeight: 400
      }}>
        {caption}
      </Typography>
    </CardContent>
  </Card>
);

const AgriSpecialistDashboard = () => {
  const navigate = useNavigate();
  const { showSuccess, showError,specialization,season,sector,states} = useToast();
  const { user } = useAuth();
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [kccAns,setKccAns]=useState('')
  const [specializationvalue,setSpecilizationValue]=useState('')
  const [seasonvalue,setSeasonValue]=useState('')
  const [sectorValue,setSectorValue]=useState('')
  const [statevalue,setStateValue]=useState('')
  const [cropName,setCropName]=useState('')
  const [region,setRegion]=useState('')
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile,setSelectedFile] = useState<File | null>(null)
  const handleOpenQuestionModal = () => {
    setIsQuestionModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setQuestionText('');
    setSelectedFile(null)
    setSpecilizationValue('')
    setKccAns('')
    setStateValue('')
    setSeasonValue('')
    setSectorValue('')
    setCropName('')
    setRegion('')
  };

  const handleQuestionSubmit = async () => {
  
     if (!specializationvalue.trim()) {
     showError('Please enter question type');
    return;
     }
     
      
        if (!seasonvalue.trim()) {
          showError('Please enter season');
         return;
          }
          if (!sectorValue.trim()) {
            showError('Please enter sector type');
           return;
            }
            if (!statevalue.trim()) {
              showError('Please enter state');
             return;
              }
              if (!cropName.trim()) {
                showError('Please enter crop name');
               return;
                }
          if (!region.trim()) {
            showError('Please enter  region');
           return;
            }
            


    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData()
      const userId=localStorage.getItem('user_id')
      if(userId)
      {
        formData.append('user_id',userId.toString())
      }
      
      if (questionText.trim()) {
        formData.append('original_query_text', questionText.trim());
      }
      if (selectedFile) {
        formData.append('csvFile', selectedFile);
      }
      if(kccAns)
      {
        formData.append("KccAns",kccAns)
      }
      formData.append('query_type',specializationvalue)
      formData.append('season',seasonvalue)
      formData.append('state',statevalue)
      formData.append('sector',sectorValue)
      formData.append('crop',cropName)
      formData.append('district',region)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // body: JSON.stringify({
        //   original_query_text: questionText.trim()
        // }),
        body:formData
      });

      if (!response.ok) {
        throw new Error('Failed to create question');
      }
      const data = await response.json()
      // showSuccess('Question created successfully!');
      if (Array.isArray(data)) {
        showSuccess(`${data.length} questions created successfully!`);
      } else {
        showSuccess('Question created successfully!');
      }
      handleCloseQuestionModal();
      await fetchMyPerformance()
      await fetchMyTasks();
     
    } catch (err) {
      console.error('Error creating question:', err);
      showError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setIsSubmitting(false);
      setSpecilizationValue('')
      setKccAns('')
    setStateValue('')
    setSeasonValue('')
    setSectorValue('')
    setCropName('')
    setRegion('')
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
    sources: any[];
  }
  interface Performance {
    totalAssigned: number;
    approvedCount: number;
    revisedCount: number;
    rejectedCount: number;
    approvalRate: number; // %
    activeDays: number;
    QperDay: number;
    peakReviewHour: number; // 0–23
    fastestReviewMinutes: number;
    averageReviewHours: number;
    milestoneTarget: number;
    milestoneProgress: number; // %
    currentRank: number;
    totalUsers: number;
    incentivePoints: number;
    rankingPercentage: number; // %
    rankMessage?: string;
    latestApprovedQuestion?: ReviewQuestion | null;
    latestRevisedQuestion?: ReviewQuestion | null;
    penality:number
  }
  
  interface ReviewQuestion {
    status: 'approved' | 'revised' | 'rejected';
    createdAt: string; // ISO date string
    questionId: string;
    questionText: string;
    answerId: string;
  }
  
  
  

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const[performance,setPerformance]= useState<Performance | null>(null);
  const ITEMS_PER_PAGE = 7;
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedTasks, setPaginatedTasks] = useState<Task[]>([]);
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
      setTasks(data?.tasks || []);
     // setFilteredTasks(data?.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  };
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  useEffect(() => {
   
    // Step 1: Sort all tasks by created_at (newest first)
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  
    // Step 2: Filter (if searchQuery is provided)
    let filtered = sortedTasks;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = sortedTasks.filter(
        (task) =>
          task.
          question_text
          ?.toLowerCase().includes(query) ||
          task.question_id?.toLowerCase().includes(query)
      );
    }
    const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      return;
    }
   
    // Step 3: Pagination logic
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageTasks = filtered.slice(startIndex, endIndex);
 
    // Step 4: Update state
    setFilteredTasks(filtered);
    setPaginatedTasks(pageTasks);
  }, [tasks, searchQuery, currentPage]);
  const fetchMyPerformance = async () => {
    try {
      
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/getUserPerformance`, {
        headers: {
          Accept: 'application/json, text/plain, */*',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
     
      setPerformance(data || []);
     
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setPerformance(null);
     
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
    fetchMyPerformance()
    fetchMyTasks();
    fetchNotifications();
  }, []);
  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTasks(tasks);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = tasks.filter(task => {
      return (
        (task.question_text?.toLowerCase().includes(query)) ||
        (task.question_id?.toString().includes(query))
      );
    });
    setFilteredTasks(filtered);
  }, [searchQuery, tasks]);

  const getBasePath = () => {
    return user?.role === 'moderator' ? '/moderator' : '/agri-specialist';
  };
  const performanceScore = (performance?.incentivePoints ?? 0) - (performance?.penality ?? 0);

  const quickActions = [
    {
      title: 'Current Workload',
      value: tasks.length,
      description: 'Pending assignments',
      icon: <RateReviewIcon />,
      path: `${getBasePath()}/review-queue`,
    },
    {
      title: 'Approval Rate',
      value: performance ? `${performance.approvalRate||0}%` : '--',
  description: performance ? `Of ${performance.totalAssigned || 0} reviews` : 'Loading...',
      icon: <AssessmentIcon />,
      path: `${getBasePath()}/performance?data=${encodeURIComponent(JSON.stringify(performance))}`,
    },
    {
      title: 'Performance Score',
      value: performance?.approvedCount ?? 0,
      description: `+2 / -0`,
      icon: <NotificationsIcon />,
      path: `${getBasePath()}/notifications`,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              
              {user?.role === 'moderator' ? "Moderator Dashboard" : "Reviewer Dashboard"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Welcome back! You have {tasks.length} pending reviews.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {user?.role === 'moderator' && (
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
            )}

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
              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="role-label">Sector Type *</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={sectorValue}
                label="Sector Type *"
                onChange={(e) => setSectorValue( e.target.value)}
                required
              >
                <MenuItem value="">
                  <em>Select Sector Type *</em>
                </MenuItem>
                {sector.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="role-label">Question Type *</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={specializationvalue}
                label="Question Type *"
                onChange={(e) => setSpecilizationValue( e.target.value)}
                required
              >
                <MenuItem value="">
                  <em>Select Question Type *</em>
                </MenuItem>
                {specialization.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="role-label">Season Type *</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={seasonvalue}
                label="Season Type *"
                onChange={(e) => setSeasonValue( e.target.value)}
                required
              >
                <MenuItem value="">
                  <em>Select Season Type *</em>
                </MenuItem>
                {season.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="role-label">State *</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={statevalue}
                label="State *"
                onChange={(e) => setStateValue( e.target.value)}
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
            
            <TextField
                  autoFocus
                  margin="dense"
                  id="question"
                  label="Type Crop Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={1}
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <TextField
                  autoFocus
                  margin="dense"
                  id="question"
                  label="Type Your Region"
                  type="text"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={1}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  sx={{ mt: 1 }}
                />
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
                

            <TextField
                  autoFocus
                  margin="dense"
                  id="question"
                  label="Type your KccAns"
                  type="text"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  placeholder="Write a detailed, accurate answer to this agricultural question. Include relevant information, best practices, and any important considerations..."
                  value={kccAns}
                  onChange={(e) => setKccAns(e.target.value)}
                  sx={{ mt: 1 }}
                />
              </DialogContent>
              
              <DialogContent>
                <label htmlFor="csv-upload">Add Your CSV here</label> <br/>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  title="Upload CSV file"
                  placeholder="Choose a CSV file"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
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
                  disabled={isSubmitting || (!questionText.trim() && !selectedFile)}
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
              onClick={() => navigate(`${getBasePath()}/performance?data=${encodeURIComponent(JSON.stringify(performance))}`)}
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
                onClick={() => navigate(`${getBasePath()}/notifications`)}
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
                value={action.value}
                caption={action.description}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              ) : paginatedTasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? 'No tasks match your search.' : 'No tasks available.'}
                </Typography>
              ) : (
                paginatedTasks.map((task, index) => (
                  
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
                    }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      {task.question_text}
                    </Typography>

                    
                   
                      {task.type==="Reject"?
                       <Typography variant="caption" color="text.secondary" display="block">
                      Rejected: {new Date(task.created_at).toLocaleDateString()}
                      </Typography>
                      :
                      <Typography variant="caption" color="text.secondary" display="block">
                      Approvals: {task.consecutive_approvals} • {new Date(task.created_at).toLocaleDateString()}
                      </Typography>
                      }
                      
                    
                        <Box
     
    >
                      {task.sources && task.sources.length>=1 &&task.sources.map(source => (
                         <Box 
                         sx={{
                          width: 400,         // fixed width in px
                          height: 20,        // fixed height in px
                         
                          display:'flex',
                          justifyContent:'space-between'
                        }}
                           >
                          <Typography variant="caption" color="text.secondary" display="block">
                          SourceName:{source.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                          SourceUrl:<a href={source.link}>Open</a>
                          </Typography>
                         </Box>
                          ))}
                        </Box>
                         
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Question ID: {task.question_id}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`${getBasePath()}/review-queue`, { state: { task } })}
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
                       
                        {task.type=="Reject"?" Revise Answer":
                        task.type==='create_answer'?'Submit Answer':'Review Answer'
                        }
                      
                      </Button>
                    </Box>
                    </Paper>
                ))
              )}

            </Paper>
            <Box sx={{ display: 'flex', justifyContent:'flex-end', mt: 3 }}>
          <Pagination
            count={Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
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
                  {performance?.latestApprovedQuestion?.questionText
  ? performance.latestApprovedQuestion.questionText
  : 'N/A'}
                    <br />
                    {performance?.latestApprovedQuestion?.createdAt
  ? new Date(performance.latestApprovedQuestion.createdAt).toLocaleString()
  : 'N/A'}
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
                  {performance?.latestRevisedQuestion?.questionText
  ? performance.latestRevisedQuestion.questionText
  : 'N/A'}
                    <br />
                    {performance?.latestRevisedQuestion?.createdAt
  ? new Date(performance.latestRevisedQuestion.createdAt).toLocaleString()
  : 'N/A'}
                  </Typography>
                </Box>
              </Box>

              
             
            </Paper>

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
                      width: `${performance?.approvalRate ?? 0}%`,
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
                {performance?.approvalRate}%
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2, borderTop: '1px solid #e0e0e0', pt: 2 }}>
                <Typography variant="body2" color="success.main">
                  {performance?.incentivePoints||0} <br />
                  <Typography variant="caption" color="text.secondary">
                    Incentives
                  </Typography>
                </Typography>
                <Typography variant="body2" color="error.main">
                  {performance?.penality||0} <br />
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
