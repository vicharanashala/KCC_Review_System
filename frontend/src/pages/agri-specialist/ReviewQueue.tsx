import { Box, Typography, Paper, Button, TextField, CircularProgress, Snackbar, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

interface Source {
    name: string;
    link: string;
}

interface AnswerData {
    question_id: string;
    answer_text: string;
    sources?: Source[];
}

console.log(import.meta.env.VITE_API_BASE_URL, "import.meta.env.VITE_API_BASE_URL");
export const ReviewQueue = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const task = location.state?.task;
    console.log(task, "tasktasktask---------");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [sources, setSources] = useState<Source[]>([]);
    const [sourceName, setSourceName] = useState('');
    const [sourceLink, setSourceLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'approved' | 'revised' | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [comments, setComments] = useState('');
    const [revisedAnswer, setRevisedAnswer] = useState(task?.answer_preview || '');
    useEffect(() => {
        if (!task) {
            setError('No task data available');
            setLoading(false);
            return;
        }
        setLoading(false);
    }, [task]);


    const handleSubmitAnswer = async () => {
        if (!answerText.trim()) {
            setSnackbar({ open: true, message: 'Please provide an answer', severity: 'error' });
            return;
        }

        if (!task?.question_id) {
            setSnackbar({ open: true, message: 'Question ID is missing', severity: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const answerData: AnswerData = {
                question_id: task.question_id,
                answer_text: answerText,
                sources: sources.length > 0 ? sources : undefined
            };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(answerData),
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }

            setSnackbar({ open: true, message: 'Answer submitted successfully!', severity: 'success' });
            setAnswerText('');
            setSources([]);
            setSourceName('');
            setSourceLink('');
            
            // Navigate to dashboard after successful submission
            navigate("/agri-specialist/dashboard");
        } catch (err) {
            console.error('Error submitting answer:', err);
            setSnackbar({
                open: true,
                message: err instanceof Error ? err.message : 'Failed to submit answer',
                severity: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleRemoveSource = (index: number) => {
        setSources(sources.filter((_, i) => i !== index));
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleStatusSelect = (status: 'approved' | 'revised') => {
        setSelectedStatus(status);
    };

    const handlePeerValidation = (status: 'revised') => {
        setSelectedStatus(status);
    };

    const handleSubmit = async () => {
        if (!selectedStatus) {
            setSnackbar({ open: true, message: 'Please select a status', severity: 'error' });
            return;
        }

        if (selectedStatus === 'revised' && !revisedAnswer.trim()) {
            setSnackbar({ open: true, message: 'Please provide a revised answer', severity: 'error' });
            return;
        }

        if (!task?.answer_id) {
            setSnackbar({ open: true, message: 'Answer ID is missing', severity: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const validationData = {
                answer_id: task.answer_id,
                status: selectedStatus,
                comments: comments.trim() || undefined,
                revised_answer_text: selectedStatus === 'revised' ? revisedAnswer.trim() : undefined
            };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/peer-validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(validationData),
            });

            if (!response.ok) {
                throw new Error('Failed to submit validation');
            }

            setSnackbar({ 
                open: true, 
                message: `Answer ${selectedStatus === 'approved' ? 'approved' : 'revision submitted'} successfully!`,
                severity: 'success' 
            });

            // Reset form
            setComments('');
            setRevisedAnswer('');

            // Navigate to dashboard after successful submission
            navigate("/agri-specialist/dashboard");
        } catch (err) {
            console.error('Error submitting validation:', err);
            setSnackbar({
                open: true,
                message: err instanceof Error ? err.message : 'Failed to submit validation',
                severity: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !task) {
        return (
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/agri-specialist/dashboard")}
                    sx={{
                        mb: 2,
                        textTransform: "none",
                        color: "#333",
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        px: 2,
                        "&:hover": {
                            backgroundColor: "#f5f5f5",
                        },
                    }}
                    disabled={isSubmitting}
                >
                    Back to Dashboard
                </Button>
                <Typography color="error">
                    {error || 'Question not found'}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/agri-specialist/dashboard")}
                sx={{
                    mb: 2,
                    textTransform: "none",
                    color: "#333",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    px: 2,
                    "&:hover": {
                        backgroundColor: "#f5f5f5",
                    },
                }}
            >
                Back to Dashboard
            </Button>

            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                    border: "1px solid #ddd",
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight="500"
                    sx={{ display: "flex", alignItems: "center", mb: 1 }}
                >
                    📄 {task.question_text || 'No title available'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                        Type:{' '}
                        <span style={{ color: "#1976d2", fontWeight: 500 }}>
                            {task.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
                        </span>
                    </Typography>

                    <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                        • Consecutive Approvals: <span style={{
                            color: task.consecutive_approvals > 0 ? '#2e7d32' : '#d32f2f',
                            fontWeight: 500
                        }}>
                            {task.consecutive_approvals || 0}
                        </span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                        • ID: <span style={{ fontFamily: 'monospace' }}>{task.question_id || 'N/A'}</span>
                    </Typography>
                </Box>

                {task.answer_preview && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Answer Preview:
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {task.answer_preview}
                        </Typography>
                    </Box>
                )}
            </Paper>

            {task?.type === 'create_answer' ? (
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                        border: "1px solid #ddd",
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        fontWeight="500"
                        sx={{ mb: 2 }}
                    >
                        Write Your Answer
                    </Typography>

                    <TextField
                        placeholder="Write a detailed, accurate answer to this agricultural question. Include relevant information, best practices, and any important considerations..."
                        multiline
                        rows={5}
                        fullWidth
                        variant="outlined"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                bgcolor: "#fff8f0",
                                borderRadius: "8px",
                                "& fieldset": { border: "1px solid #f0e0d0" },
                                "&:hover fieldset": { borderColor: "#e0c0a0" },
                            },
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                        <TextField
                            placeholder="Source name"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    bgcolor: "#fff8f0",
                                    borderRadius: "8px",
                                    "& fieldset": { border: "1px solid #f0e0d0" },
                                    "&:hover fieldset": { borderColor: "#e0c0a0" },
                                },
                            }}
                        />
                        <TextField
                            placeholder="Source URL"
                            value={sourceLink}
                            onChange={(e) => setSourceLink(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    bgcolor: "#fff8f0",
                                    borderRadius: "8px",
                                    "& fieldset": { border: "1px solid #f0e0d0" },
                                    "&:hover fieldset": { borderColor: "#e0c0a0" },
                                },
                            }}
                        />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmitAnswer}
                            disabled={isSubmitting}
                            sx={{
                                mt: 2,
                                px: 4,
                                textTransform: "none",
                                borderRadius: "8px",
                                backgroundColor: "#00A63E",
                                "&:hover": { backgroundColor: "#008c35" },
                                "&.Mui-disabled": {
                                    backgroundColor: "#f5f5f5",
                                    color: "#9e9e9e"
                                }
                            }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Answer'}
                        </Button>
                        <Snackbar
                            open={snackbar.open}
                            autoHideDuration={6000}
                            onClose={handleCloseSnackbar}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        >
                            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                                {snackbar.message}
                            </Alert>
                        </Snackbar>
                    </Box>
                </Paper>
            ) : (
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                        border: "1px solid #ddd",
                    }}
                >
                    <Typography sx={{ my: 2 }}>Answer</Typography>
                    <Box>
                        <TextField
                            placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "No changes needed for approval" : "Edit the answer if needed (only for revisions)"}
                            multiline
                            rows={2}
                            fullWidth
                            variant="outlined"
                            value={revisedAnswer}
                            onChange={(e) => setRevisedAnswer(e.target.value)}
                            disabled={!selectedStatus || selectedStatus === 'approved'}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    bgcolor: selectedStatus === 'approved' ? "#f5f5f5" : "#fff8f0",
                                    borderRadius: "8px",
                                    "& fieldset": { 
                                        border: "1px solid #f0e0d0",
                                    },
                                    "&:hover fieldset": { 
                                        borderColor: selectedStatus === 'approved' ? "#f0e0d0" : "#e0c0a0" 
                                    },
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ my: 2 }}>
                        <Typography sx={{ my: 2 }}>Add comments</Typography>
                        <TextField
                            placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "Comments (optional)" : "Please provide comments for rejection"}
                            multiline
                            rows={2}
                            fullWidth
                            variant="outlined"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            disabled={!selectedStatus || selectedStatus === 'approved'}
                            required={selectedStatus === 'revised'}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    bgcolor: selectedStatus === 'approved' ? "#f5f5f5" : "#fff8f0",
                                    borderRadius: "8px",
                                    "& fieldset": { 
                                        border: "1px solid #f0e0d0",
                                    },
                                    "&:hover fieldset": { 
                                        borderColor: selectedStatus === 'approved' ? "#f0e0d0" : "#e0c0a0" 
                                    },
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={() => handlePeerValidation('revised')}
                            disabled={isSubmitting}
                            sx={{
                                color: '#ffffff',
                                borderColor: '#d32f2f',
                                textTransform: 'none',
                                px: 3,
                                py: 1,
                                borderRadius: '4px',
                                background: '#D4183D',
                                width: '100%',
                                '&:hover': {
                                    backgroundColor: '#b2102f',
                                    borderColor: '#b2102f',
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: '#f5f5f5',
                                    color: '#9e9e9e'
                                }
                            }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
                        </Button>
                        <Button
                            variant={selectedStatus === 'approved' ? 'contained' : 'outlined'}
                            onClick={() => handleStatusSelect('approved')}
                            sx={{
                                color: selectedStatus === 'approved' ? '#ffffff' : '#4caf50',
                                borderColor: '#4caf50',
                                backgroundColor: selectedStatus === 'approved' ? '#4caf50' : 'transparent',
                                '&:hover': {
                                    backgroundColor: selectedStatus === 'approved' ? '#388e3c' : 'rgba(76, 175, 80, 0.1)',
                                    borderColor: '#388e3c',
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: '#f5f5f5',
                                    color: '#9e9e9e',
                                    borderColor: '#e0e0e0'
                                },
                                textTransform: 'none',
                                px: 3,
                                py: 1,
                                borderRadius: '4px',
                                width: '100%',
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedStatus || (selectedStatus === 'revised' && !revisedAnswer.trim())}
                            sx={{
                                mt: 2,
                                px: 4,
                                textTransform: "none",
                                borderRadius: "8px",
                                backgroundColor: "#00A63E",
                                "&:hover": { backgroundColor: "#008c35" },
                                "&.Mui-disabled": {
                                    backgroundColor: "#f5f5f5",
                                    color: "#9e9e9e"
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : selectedStatus === 'approved' ? (
                                'Submit Approval'
                            ) : (
                                'Submit Revision'
                            )}
                        </Button>
                    </Box>
                    </Paper>
            )}
        </Box>
    );
};

export default ReviewQueue;
