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
import { useNavigate } from "react-router-dom";

export const Performance = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                <Chip
                    label="Categories"
                    sx={{
                        borderRadius: "16px",
                        bgcolor: "#f5f5f5",
                        color: "#333",
                        fontWeight: 400,
                        px: 1.5,
                    }}
                />
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    {
                        title: "Total Reviews",
                        value: "147",
                        progress: 75,
                        subtitle: "75% towards next milestone",
                        icon: <BarChartIcon fontSize="small" sx={{ color: "#6b7280" }} />,
                    },
                    {
                        title: "Approval Rate",
                        value: "78.2%",
                        progress: 78,
                        subtitle: "Above team average (72%)",
                        icon: <CheckCircleIcon fontSize="small" sx={{ color: "#6b7280" }} />,
                    },
                    {
                        title: "Avg Review Time",
                        value: "12.5m",
                        progress: 60,
                        subtitle: "40% faster than average",
                        icon: <AccessTimeIcon fontSize="small" sx={{ color: "#6b7280" }} />,
                    },
                    {
                        title: "Current Ranking",
                        value: "#3",
                        progress: 80,
                        subtitle: "Out of 12 reviewers",
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
                                <Typography sx={{ color: "green" }}>+32</Typography> <Typography>Incentives</Typography>
                            </Box>
                            <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography sx={{ color: "red" }}>-8</Typography> <Typography>Penalties</Typography>
                            </Box>
                            <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography>24</Typography> <Typography> Net Score</Typography>
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Positive Actions
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={80}
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
                            value={20}
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
                                    115
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
                                    32
                                </Typography>
                                <Typography variant="body2">Rejected</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: "grid", gap: 1 }}>
                            <Typography variant="body2">
                                <strong>Questions per day:</strong> ~4.2
                            </Typography>
                            <Typography variant="body2">
                                <strong>Peak review hour:</strong> 10:00 AM
                            </Typography>
                            <Typography variant="body2">
                                <strong>Fastest review:</strong> 3.5 min
                            </Typography>
                            <Typography variant="body2">
                                <strong>Most reviewed category:</strong> Crop Management
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Performance;
