import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import ErrorIcon from "@mui/icons-material/Error";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReviewsIcon from "@mui/icons-material/Reviews";
import EditIcon from "@mui/icons-material/Edit";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { NotificationType } from "../../types";

interface Notification {
    _id: string;
    type: NotificationType | string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    user_id: string;
    notification_id: string;
    related_entity_type?: string;
    related_entity_id?: string;
}

export const Notifications = () => {
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const mappedNotifications = (response.data.notifications || []).map(
                (n: any) => ({
                    ...n,
                    status: n.is_read ? "read" : "unread",
                    createdAt: n.created_at,
                })
            );
            setNotifications(mappedNotifications);
        } catch (err: any) {
            console.error("Error fetching notifications:", err);
            setError(err.response?.data?.detail || "Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const filteredNotifications =
        filter === "all" ? notifications : notifications.filter((n) => !n.is_read);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/notifications/${id}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setNotifications(
                notifications.map((n) =>
                    n._id === id
                        ? {
                              ...n,
                              status: "read" as const,
                              is_read: true,
                          }
                        : n
                )
            );
            showSuccess("Notification marked as read");
            await fetchNotifications();
        } catch (err) {
            console.error("Error marking notification as read:", err);
            showError("Failed to mark notification as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/notifications/mark-all-read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            showSuccess("All notifications marked as read");
            await fetchNotifications();
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
            showError("Failed to mark all notifications as read");
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case NotificationType.QUESTION_ASSIGNED:
                return <AssignmentIcon sx={{ color: "#1447E6" }} />;
            case NotificationType.PEER_REVIEW_REQUEST:
                return <ReviewsIcon sx={{ color: "#364153" }} />;
            case NotificationType.REVISION_NEEDED:
                return <EditIcon sx={{ color: "#C10007" }} />;
            case NotificationType.VALIDATION_REQUEST:
                return <VerifiedIcon sx={{ color: "#364153" }} />;
            case NotificationType.READY_FOR_GOLDEN_FAQ:
                return <StarIcon sx={{ color: "#008236" }} />;
            // Legacy support for old notification types
            case "approved":
                return <CheckCircleIcon sx={{ color: "#008236" }} />;
            case "rejected":
                return <ErrorIcon sx={{ color: "#C10007" }} />;
            case "assignment":
                return <NotificationsIcon sx={{ color: "#1447E6" }} />;
            case "update":
                return <InfoIcon sx={{ color: "#364153" }} />;
            default:
                return <InfoIcon sx={{ color: "#364153" }} />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case NotificationType.QUESTION_ASSIGNED:
                return { bg: "#BEDBFF", text: "#1447E6" }; // Blue theme for assignments
            case NotificationType.PEER_REVIEW_REQUEST:
                return { bg: "#E5E7EB", text: "#364153" }; // Gray theme for peer reviews
            case NotificationType.REVISION_NEEDED:
                return { bg: "#FFC9C9", text: "#C10007" }; // Red theme for revisions
            case NotificationType.VALIDATION_REQUEST:
                return { bg: "#E5E7EB", text: "#364153" }; // Gray theme for validations
            case NotificationType.READY_FOR_GOLDEN_FAQ:
                return { bg: "#B9F8CF", text: "#008236" }; // Green theme for golden FAQ
            // Legacy support for old notification types
            case "assignment":
                return { bg: "#BEDBFF", text: "#1447E6" };
            case "approved":
                return { bg: "#B9F8CF", text: "#008236" };
            case "rejected":
                return { bg: "#FFC9C9", text: "#C10007" };
            case "update":
                return { bg: "#E5E7EB", text: "#364153" };
            default:
                return { bg: "#E5E7EB", text: "#364153" };
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    justifyContent: "space-between",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(user?.role === "moderator" ? "/moderator/dashboard" : "/agri-specialist/dashboard")}
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
                                Notifications
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                                {notifications.filter((n) => !n.is_read).length} unread notifications
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Button
                            onClick={markAllAsRead}
                            disabled={notifications.filter((n) => !n.is_read).length === 0}
                            sx={{
                                backgroundColor: "#000",
                                color: "#fff",
                                textTransform: "none",
                                borderRadius: "8px",
                                px: 2,
                                py: 1,
                                fontWeight: 500,
                                fontSize: "14px",
                                "&:hover": {
                                    backgroundColor: "#333",
                                },
                                "&:disabled": {
                                    backgroundColor: "#ccc",
                                    color: "#888",
                                },
                            }}
                        >
                            Mark All as Read
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                <Chip
                    label={`All (${notifications.length})`}
                    onClick={() => setFilter("all")}
                    sx={{
                        borderRadius: "16px",
                        bgcolor: filter === "all" ? "#000" : "#f5f5f5",
                        color: filter === "all" ? "#fff" : "#333",
                        fontWeight: filter === "all" ? 500 : 400,
                        px: 1.5,
                        cursor: "pointer",
                    }}
                />
                <Chip
                    label={`Unread (${notifications.filter((n) => !n.is_read).length})`}
                    onClick={() => setFilter("unread")}
                    sx={{
                        borderRadius: "16px",
                        bgcolor: filter === "unread" ? "#000" : "#f5f5f5",
                        color: filter === "unread" ? "#fff" : "#333",
                        fontWeight: filter === "unread" ? 500 : 400,
                        px: 1.5,
                        cursor: "pointer",
                    }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error" sx={{ p: 2 }}>
                    {error}
                </Typography>
            ) : filteredNotifications.length === 0 ? (
                <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                    No notifications found
                </Typography>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {filteredNotifications.map((n) => {
                        const colors = getNotificationColor(n.type);
                        return (
                            <Paper
                                key={n._id}
                                sx={{
                                    p: 2,
                                    borderRadius: "12px",
                                    bgcolor: colors.bg,
                                    display: "flex",
                                    alignItems: "flex-start",
                                    boxShadow: "none",
                                    border:
                                        n.type === NotificationType.QUESTION_ASSIGNED || n.type === "assignment"
                                            ? "1px solid #BEDBFF"
                                            : n.type === NotificationType.PEER_REVIEW_REQUEST
                                            ? "1px solid #E5E7EB"
                                            : n.type === NotificationType.REVISION_NEEDED
                                            ? "1px solid #FFC9C9"
                                            : n.type === NotificationType.VALIDATION_REQUEST
                                            ? "1px solid #E5E7EB"
                                            : n.type === NotificationType.READY_FOR_GOLDEN_FAQ
                                            ? "1px solid #B9F8CF"
                                            : "1px solid #E5E7EB",
                                    cursor: "pointer",
                                    "&:hover": {
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    },
                                }}
                                onClick={() => markAsRead(n.notification_id)}
                            >
                                <Box sx={{ mr: 2, mt: 0.5 }}>{getNotificationIcon(n.type)}</Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}
                                    >
                                        {n.title}
                                        {!n.is_read && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    bgcolor: "#1976d2",
                                                    borderRadius: "50%",
                                                    display: "inline-block",
                                                    ml: 0.5,
                                                }}
                                            />
                                        )}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1, color: colors.text }}>
                                        {n.message}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {formatTimeAgo(n.created_at)}
                                    </Typography>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default Notifications;
