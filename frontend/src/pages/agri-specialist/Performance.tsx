import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Chip,
    LinearProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useNavigate ,useLocation} from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface LatestQuestion {
    status: string;
    createdAt: string;
    questionId: string;
    questionText: string;
    answerId: string;
  }
interface Performance {
    totalAssigned: number;
    approvedCount: number;
    revisedCount: number;
    rejectedCount: number;
    approvalRate: number;
    latestApprovedQuestion: LatestQuestion | null;
    latestRevisedQuestion: LatestQuestion | null;
  }
  
export const Performance = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();

  // Get query param "data"
  const query = new URLSearchParams(location.search);
  const performanceString = query.get('data');

  // Parse JSON
  const performance = performanceString ? JSON.parse(performanceString) : null;
    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
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

                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Performance Metrics
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                        Detailed analysis of your review performance
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                <Chip
                    label="Overview"
                    sx={{
                        borderRadius: "16px",
                        bgcolor: "#000",
                        color: "#fff",
                        fontWeight: 500,
                        px: 1.5,
                    }}
                />
                {/* <Chip
                    label="Categories"
                    sx={{
                        borderRadius: "16px",
                        bgcolor: "#f5f5f5",
                        color: "#333",
                        fontWeight: 400,
                        px: 1.5,
                    }}
                /> */}
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    {
                        title: "Total Reviews",
                        value: performance.totalAssigned ||0,
                        progress: performance.milestoneProgress||0,
                        subtitle: `${ performance.milestoneProgress||0}% towards next milestone`,
                        icon: <BarChartIcon fontSize="small" sx={{ color: "#6b7280" }} />,
                    },
                    {
                        title: "Approval Rate",
                        value: performance ? `${performance.approvalRate||0}%` : '--',
                        progress: performance.approvalRate||0,
                        // subtitle: "Above team average (72%)",
                        subtitle: '',
                        icon: <CheckCircleIcon fontSize="small" sx={{ color: "#6b7280" }} />,
                    },
                    {
                        title: "Avg Review Time",
                        value: performance ? `${performance.averageReviewHours||0}H` : '--',
                        progress: performance.averageReviewHours||0,
                        // subtitle: "40% faster than average",
                        subtitle: "",
                        icon: <AccessTimeIcon fontSize="small" sx={{ color: "#6b7280" }} />,
                    },
                    {
                        title: "Current Ranking",
                        value: performance ? `#${performance.currentRank||performance.
                            rank
                            }` : '--',
                        progress:performance.currentRank||0,
                        subtitle: `Out of ${performance.totalUsers} ${user?.role}`,
                        icon: <EmojiEventsIcon fontSize="small" sx={{ color: "#6b7280" }} />,
                    },
                ].map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Paper
                            sx={{
                                p: 2.5,
                                borderRadius: "16px",
                                height: "100%",
                                boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
                                border: "1px solid #ddd",
                            }}
                        >
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500 }}>
                                    {stat.title}
                                </Typography>
                                {stat.icon}
                            </Box>
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 600, my: 1, color: "#111827" }}
                            >
                                {stat.value}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={stat.progress}
                                sx={{
                                    height: 8,
                                    borderRadius: 5,
                                    mb: 0.5,
                                    bgcolor: "#e5e7eb",
                                    "& .MuiLinearProgress-bar": { bgcolor: "#111827" },
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{ color: "#6b7280" }}
                            >
                                {stat.subtitle}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: "12px" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Performance Score
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mb: 2 }}
                        >
                            Incentives and penalties breakdown
                        </Typography>

                        <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
                            <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography sx={{ color: "green" }}>{performance.incentivePoints || 0}</Typography> <Typography>Incentives</Typography>
                            </Box>
                            <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography sx={{ color: "red" }}>{performance.penality || 0}</Typography> <Typography>Penalties</Typography>
                            </Box>
                            <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography>{performance.incentivePoints-performance.penality|| 0}</Typography> <Typography> Net Score</Typography>
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Positive Actions
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={performance.incentivePoints|| 0}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                mb: 2,
                                bgcolor: "#eee",
                                "& .MuiLinearProgress-bar": { bgcolor: "green" },
                            }}
                        />

                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Negative Actions
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={performance.penality|| 0}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                bgcolor: "#eee",
                                "& .MuiLinearProgress-bar": { bgcolor: "red" },
                            }}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: "12px" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Review Statistics
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mb: 2 }}
                        >
                            Detailed breakdown of your reviews
                        </Typography>

                        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                            <Box
                                sx={{
                                    flex: 1,
                                    bgcolor: "#ECECF0",
                                    p: 2,
                                    borderRadius: "8px",
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="h6" sx={{ color: "green", fontWeight: 600 }}>
                                    {performance.approvedCount|| 0}
                                </Typography>
                                <Typography variant="body2">Approved</Typography>
                            </Box>
                            <Box
                                sx={{
                                    flex: 1,
                                    bgcolor: "#ECECF0",
                                    p: 2,
                                    borderRadius: "8px",
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="h6" sx={{ color: "red", fontWeight: 600 }}>
                                    {performance.revisedCount|| 0}
                                </Typography>
                                <Typography variant="body2">Rejected</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: "grid", gap: 1 }}>
                            <Typography variant="body2">
                                <strong>Questions per day:</strong> {performance.QperDay||'N/A'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Peak review hour:</strong> {performance.peakReviewHour||'N/A'} Hours
                            </Typography>
                            <Typography variant="body2">
                                <strong>Fastest review:</strong> {performance.fastestReviewMinutes||'N/A'} min
                            </Typography>
                            {/* <Typography variant="body2">
                                <strong>Most reviewed category:</strong> Crop Management
                            </Typography> */}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Performance;
