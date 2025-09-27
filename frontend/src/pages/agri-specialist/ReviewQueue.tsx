import { Box, Typography, Paper, Button, TextField, CircularProgress, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { peerValidationApi } from "../../api/peerValidation";

interface Source {
    name: string;
    link: string;
}

interface AnswerData {
    question_id: string;
    answer_text: string;
    sources?: Source [];
    sourceName?:string;
    sourceLink?: string;
    userId?: string;
    RejectedUser?: string;
    status?:string
}

interface VersionHistory {
    version: string;
    status: 'current' | 'approved' | 'revision_requested' | 'initial_draft';
    timestamp: string;
    statusLabel?: string;
    statusColor?: string;
    timeAgo?: string;
    reviewer?: string;
    feedback?: string;
    changes?: string;
    issues?: string;
    description?: string;
}

interface ReviewerInsights {
    approvals: number;
    revisions: number;
}

interface KeyImprovement {
    text: string;
}

export const ReviewQueue = () => {
    
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const task = location.state?.task;
    console.log("the task coming====",task)
    const answer=task?. answer_text
    let sourceNameToEdit
    let sourceUrlToEdit
    if(task?.sources)
    {
         sourceNameToEdit=task?.sources[0]?.name||''
         sourceUrlToEdit=task?.sources[0]?.link||''
    }
  
  
    
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState(''||answer);
    const [sources, setSources] = useState<Source[]>([]);
    const [sourceName, setSourceName] = useState(''||sourceNameToEdit);
    const [sourceLink, setSourceLink] = useState(''||sourceUrlToEdit);
    const [urlError, setUrlError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'approved' | 'revised' | null>(null);
    const [comments, setComments] = useState('');
    const [revisedAnswer, setRevisedAnswer] = useState(task?.answer_preview || '');
    // const [peerValidationHistory, setPeerValidationHistory] = useState<PeerValidationHistory[]>([]);
    // const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    // const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const { showSuccess, showError } = useToast();

    const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
    const [reviewerInsights, setReviewerInsights] = useState<ReviewerInsights>({ approvals: 0, revisions: 0 });
    // const [keyImprovements, setKeyImprovements] = useState<KeyImprovement[]>([]);
    const [isLoadingVersionHistory, setIsLoadingVersionHistory] = useState(false);
    const keyImprovements: KeyImprovement[] = [
        { text: "Added monsoon-specific timing guidelines" },
        { text: "Included variety-specific NPK ratios" },
        { text: "Enhanced regional adaptation notes" },
        { text: "Improved technical accuracy" }
    ];
    useEffect(() => {
        if (!task) {
            setError('No task data available');
            setLoading(false);
            return;
        }
        setLoading(false);

        if (task?.type !== 'create_answer') {
            fetchVersionHistory();
        }
    }, [task]);

    // const fetchPeerValidationHistory = async () => {
    //     if (!task?.answer_id) {
    //         showError('Answer ID is missing');
    //         return;
    //     }

    //     setIsLoadingHistory(true);
    //     try {
    //         const response = await peerValidationApi.getPeerValidationHistory(task.answer_id);
    //         setPeerValidationHistory(response.peer_validation_history || []);
    //         setIsReviewDialogOpen(true);
    //     } catch (err) {
    //         console.error('Error fetching peer validation history:', err);
    //         showError(err instanceof Error ? err.message : 'Failed to fetch peer validation history');
    //     } finally {
    //         setIsLoadingHistory(false);
    //     }
    // };

    const fetchVersionHistory = async () => {
        if (!task?.answer_id || task?.type === 'create_answer') {
            return;
        }

        setIsLoadingVersionHistory(true);
        try {
            const response = await peerValidationApi.getPeerValidationHistory(task.answer_id);
            const history = response.peer_validation_history || [];

            const transformedHistory: VersionHistory[] = [];

            transformedHistory.push({
                version: "v1 (Current)",
                status: "current",
                timestamp: `Awaiting your review • ${task.consecutive_approvals || 0} consecutive approvals`
            });

            history.forEach((validation, index) => {
                console.log(validation,"validationvalidationvalidation")
                const versionNumber = validation.answer_id.version;
                const createdAt = new Date(validation.created_at);
                const diffMs = Date.now() - createdAt.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const timeAgo = diffDays === 0
                    ? "Today"
                    : diffDays === 1
                        ? "1 day ago"
                        : `${diffDays} days ago`;

                const statusLabel = validation.status === 'approved' ? 'Approved' : 'Revision Requested';
                const statusColor = validation.status === 'approved' ? '#00A63E' : '#D08700';

                transformedHistory.push({
                    version: `v${versionNumber}`,
                    status: validation.status === 'approved' ? 'approved' : 'revision_requested',
                    timestamp: `${statusLabel} ${timeAgo}`,
                    statusLabel: statusLabel,
                    statusColor: statusColor,
                    timeAgo: timeAgo,
                    reviewer: `${validation.reviewer_id.name} (R${index + 1})`,
                    feedback: validation.answer_id.answer_text,
                    changes: validation.status === 'approved' ? 'Peer review completed' : validation.comments
                });
            });

            setVersionHistory(transformedHistory);

            const approvals = history.filter(v => v.status === 'approved').length;
            const revisions = history.filter(v => v.status !== 'approved').length;
            setReviewerInsights({ approvals, revisions });

            // Generate key improvements based on feedback
            // const improvements: KeyImprovement[] = [];
            // history.forEach(validation => {
            //     if (validation.comments) {
            //         improvements.push({ text: validation.comments });
            //     }
            // });
            // setKeyImprovements(improvements);

        } catch (err) {
            console.error('Error fetching version history:', err);
        } finally {
            setIsLoadingVersionHistory(false);
        }
    };


    const isValidURL = (url: string) => {
        try {
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
            if (!urlPattern.test(url.trim())) {
                return false;
            }
            
            const urlToTest = url.startsWith('http://') || url.startsWith('https://') 
                ? url 
                : `https://${url}`;
            new URL(urlToTest);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmitAnswer = async () => {
        if (!answerText.trim()) {
            showError('Please provide an answer');
            return;
        }

        if (!task?.question_id) {
            showError('Question ID is missing');
            return;
        }
        if(!sourceName.trim())
        {
            showError('Please Provide Source Name')
            return;
        }

        if (!sourceLink.trim() && !isValidURL(sourceLink.trim())) {
            setUrlError('Please enter a valid URL');
            showError('Please enter a valid URL for the source');
            return;
        }
        console.log(sourceName,sourceLink)
        
       // setSources( [{ name:'hello',link: 'link'}])
       
        sources: [{ name: sourceName,link: sourceLink }]
       // sources: [{ sourceLink: sourceLink}]
    //  setSources(sources)

       // console.log(sources)
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const userId=localStorage.getItem('user_id')
            const answerData: AnswerData = {
                question_id: task.question_id,
                answer_text: answerText,
                sources: [{ name: sourceName,link: sourceLink }] ,
                userId:userId?.toString(),
                RejectedUser:task?. RejectedUser,
                status:task?.status
                
                

               // sourceName:sourceName,
               // sourceLink:sourceLink
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
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit answer');
            }

            const responseData = await response.json();
            showSuccess(responseData.message || 'Answer submitted successfully!');
            setAnswerText('');
            setSources([]);
            setSourceName('');
            setSourceLink('');

            navigate("/agri-specialist/dashboard");
        } catch (err) {
            console.error('Error submitting answer:', err);
            showError(err instanceof Error ? err.message : 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleStatusSelect = (status: 'approved' | 'revised') => {
        setSelectedStatus(status);
    };

    const handlePeerValidation = (status: 'revised') => {
        setSelectedStatus(status);
    };

    const handleSubmit = async () => {
        if (!selectedStatus) {
            showError('Please select a status');
            return;
        }

        if (selectedStatus === 'revised' && !revisedAnswer.trim()) {
            showError('Please provide a revised answer');
            return;
        }

        if (!task?.answer_id) {
            showError('Answer ID is missing');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');

            let apiUrl, validationData;

            if (user?.role === 'moderator') {
                apiUrl = `${import.meta.env.VITE_API_BASE_URL}/validate`;
                validationData = {
                    answer_id: task.answer_id,
                    validation_status: selectedStatus == 'approved' ? 'valid' : 'invalid',
                    comments: comments.trim() || undefined
                };
            } else {
                apiUrl = `${import.meta.env.VITE_API_BASE_URL}/peer-validate`;
                validationData = {
                    answer_id: task.answer_id,
                    status: selectedStatus,
                    comments: comments.trim() || undefined,
                    revised_answer_text: selectedStatus === 'revised' ? revisedAnswer.trim() : undefined
                };
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(validationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit validation');
            }

            const responseData = await response.json();
            showSuccess(responseData.message || `Answer ${selectedStatus === 'approved' ? 'approved' : 'revision submitted'} successfully!`);

            setComments('');
            setRevisedAnswer('');

            navigate(user?.role === 'moderator' ? "/moderator/dashboard" : "/agri-specialist/dashboard")
        } catch (err) {
            console.error('Error submitting validation:', err);
            showError(err instanceof Error ? err.message : 'Failed to submit validation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'current':
                return '#2B7FFF';
            case 'approved':
                return '#00C950';
            case 'revision_requested':
                return '#F0B100';
            case 'initial_draft':
                return '#99A1AF';
            default:
                return '#99A1AF';
        }
    };


    const getFeedbackBgColor = (status: string) => {
        switch (status) {
            case 'approved':
                return '#e8f5e8';
            case 'revision_requested':
                return '#fff8e1';
            default:
                return '#f5f5f5';
        }
    };

    const VersionHistoryComponent = () => (
        <Paper
            sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                border: "1px solid #ddd",
                height: 'fit-content',
                position: 'sticky',
                top: 20,
                backgroundColor: '#fafafa'
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#333', fontSize: '15px' }}>
                Version History
            </Typography>
            <Typography variant="body2" sx={{ color: '#717182', mb: 3, fontSize: '14px' }}>
                Complete evolution and reviewer feedback trail
            </Typography>

            {isLoadingVersionHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : versionHistory.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                    No version history available
                </Typography>
            ) : (
                <Box sx={{ position: 'relative' }}>
                    {versionHistory.map((version, index) => (
                        <Box key={version.version} sx={{ position: 'relative', mb: 4 }}>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '4px',
                                    height: index === versionHistory.length - 1 ? '80px' : '100%',
                                    backgroundColor: getStatusColor(version.status),
                                }}
                            />

                            <Box sx={{ ml: 3 }}>
                                <Box sx={{}}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Chip
                                            label={version.version}
                                            size="small"
                                            sx={{
                                                backgroundColor: version.status === 'current' ? '#333' : '#e0e0e0',
                                                color: version.status === 'current' ? '#fff' : '#333',
                                                fontWeight: 500,
                                                fontSize: '12px',
                                                height: '26px',
                                                borderRadius: '13px',
                                                px: 1.5
                                            }}
                                        />
                                        {version.status === 'current' && (
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                                Active
                                            </Typography>
                                        )}
                                    </Box>

                                     <Typography variant="body2" sx={{ color: '#333', mb: 1.5, fontSize: '14px' }}>
                                         {version.statusLabel && version.statusColor ? (
                                             <>
                                                 <span style={{ color: version.statusColor }}>
                                                     {version.statusLabel}
                                                 </span>
                                                 {version.timeAgo && ` ${version.timeAgo}`}
                                             </>
                                         ) : (
                                             version.timestamp
                                         )}
                                     </Typography>
                                </Box>

                                {version.reviewer && (
                                    <Typography variant="body2" sx={{ fontWeight: 400, color: '#0A0A0A', mb: 1.5, fontSize: '14px' }}>
                                        Reviewer: {version.reviewer}
                                    </Typography>
                                )}

                                {version.feedback && (
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            backgroundColor: getFeedbackBgColor(version.status),
                                            borderRadius: 1.5,
                                            mb: 1.5,
                                            border: `1px solid ${getStatusColor(version.status)}30`
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.6, fontSize: '14px' }}>
                                            {version.feedback}
                                        </Typography>
                                    </Box>
                                )}

                                {version.changes && (
                                    <Typography variant="body2" sx={{ color: '#666', mb: 1, fontSize: '14px' }}>
                                        Changes: {version.changes}
                                    </Typography>
                                )}

                                {version.issues && (
                                    <Typography variant="body2" sx={{ color: '#666', mb: 1, fontSize: '14px' }}>
                                        Issues: {version.issues}
                                    </Typography>
                                )}

                                {version.description && (
                                    <>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1, fontSize: '14px' }}>
                                            Original Submission
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                                            {version.description}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            {!isLoadingVersionHistory && (
                <Box sx={{ mt: 5, mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333', fontSize: '16px' }}>
                        Reviewer Insights
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: '#e8f5e8',
                                borderRadius: 1.5,
                                textAlign: 'center',
                                minWidth: '80px'
                            }}
                        >
                            <Typography variant="h6" sx={{ color: '#00C950', fontWeight: 700, fontSize: '20px', mb: 0.5 }}>
                                {reviewerInsights.approvals}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#00C950', fontSize: '12px', fontWeight: 500 }}>
                                Approvals
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: '#fff3e0',
                                borderRadius: 1.5,
                                textAlign: 'center',
                                minWidth: '80px'
                            }}
                        >
                            <Typography variant="h6" sx={{ color: '#F0B100', fontWeight: 700, fontSize: '20px', mb: 0.5 }}>
                                {reviewerInsights.revisions}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#F0B100', fontSize: '12px', fontWeight: 500 }}>
                                Revision
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* {!isLoadingVersionHistory && keyImprovements.length > 0 && ( */}
                <Box>
                    
                    <Box
                        sx={{
                            p: 2.5,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1.5,
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333', fontSize: '16px' }}>
                        Key Improvements Made
                    </Typography>
                        {keyImprovements.map((improvement, index) => (
                            <Typography
                                key={index}
                                variant="body2"
                                sx={{
                                    color: '#333',
                                    mb: index < keyImprovements.length - 1 ? 1.5 : 0,
                                    position: 'relative',
                                    pl: 2.5,
                                    fontSize: '14px',
                                    lineHeight: 1.5,
                                    '&::before': {
                                        content: '"•"',
                                        position: 'absolute',
                                        left: 0,
                                        color: '#333',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }
                                }}
                            >
                                {improvement.text}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            {/* )} */}
        </Paper>
    );

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
                    onClick={() => navigate(user?.role === 'moderator' ? "/moderator/dashboard" : "/agri-specialist/dashboard")}
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
        <Box sx={{
            p: 3,
            maxWidth: task?.type === 'create_answer' ? 800 : 1400,
            mx: "auto"
        }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(user?.role === 'moderator' ? "/moderator/dashboard" : "/agri-specialist/dashboard")}
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

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', justifyContent: 'center' }}>
                <Box sx={{
                    flex: 1,
                    maxWidth: 800
                }}>

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
                                <span style={{ color: "#2B7FFF", fontWeight: 500 }}>
                                    {task.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
                                </span>
                            </Typography>

                            <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                                • Consecutive Approvals: <span style={{
                                    color: task.consecutive_approvals > 0 ? '#00C950' : '#d32f2f',
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

                    {task?.type === 'create_answer'||task?.type === 'Reject' ? (
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
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSourceLink(value);
                                        
                                        if (!value.trim()) {
                                            setUrlError('');
                                        } else if (!isValidURL(value.trim())) {
                                            setUrlError('Please enter a valid URL');
                                        } else {
                                            setUrlError('');
                                        }
                                    }}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!urlError}
                                    helperText={urlError}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            bgcolor: "#fff8f0",
                                            borderRadius: "8px",
                                            "& fieldset": { border: urlError ? "1px solid #d32f2f" : "1px solid #f0e0d0" },
                                            "&:hover fieldset": { borderColor: urlError ? "#d32f2f" : "#e0c0a0" },
                                        },
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmitAnswer}
                                    disabled={isSubmitting || !!urlError}
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
                                    placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "No changes needed for approval" : user?.role === 'moderator' ? "Answer text (read-only for moderators)" : "Edit the answer if needed (only for revisions)"}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    variant="outlined"
                                    value={revisedAnswer}
                                    onChange={(e) => setRevisedAnswer(e.target.value)}
                                    disabled={!selectedStatus || selectedStatus === 'approved' || user?.role === 'moderator'}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            bgcolor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f5f5f5" : "#fff8f0",
                                            borderRadius: "8px",
                                            "& fieldset": {
                                                border: "1px solid #f0e0d0",
                                            },
                                            "&:hover fieldset": {
                                                borderColor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f0e0d0" : "#e0c0a0"
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
                                    disabled={isSubmitting || !selectedStatus || (user?.role !== 'moderator' && selectedStatus === 'revised' && !revisedAnswer.trim())}
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

                {task?.type !== 'create_answer' && user?.role === 'moderator' && (
                    <Box sx={{ width: 400, flexShrink: 0 }}>
                        <VersionHistoryComponent />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ReviewQueue;
