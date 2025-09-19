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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../contexts/ToastContext";

interface Notification {
  _id: string;
  type: "assignment" | "approved" | "update" | "rejected" | string;
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approved":
        return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
      case "rejected":
        return <ErrorIcon sx={{ color: "#f44336" }} />;
      case "assignment":
        return <NotificationsIcon sx={{ color: "#3f51b5" }} />;
      default:
        return <InfoIcon sx={{ color: "#757575" }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "assignment":
        return { bg: "#f0f4ff", text: "#3f51b5" };
      case "approved":
        return { bg: "#f6fef8", text: "#388e3c" };
      case "rejected":
        return { bg: "#fef6f6", text: "#d32f2f" };
      default:
        return { bg: "#f9f9f9", text: "#424242" };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          justifyContent: "space-between",
        }}
      >
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
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              {notifications.filter((n) => !n.is_read).length} unread
              notifications
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
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

      {/* Notification Cards */}
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
                  border:
                    n.type === "assignment"
                      ? "1px solid #e0e0ff"
                      : "1px solid transparent",
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  },
                }}
                onClick={() => markAsRead(n.notification_id)}
              >
                {/* Icon */}
                <Box sx={{ mr: 2, mt: 0.5 }}>{getNotificationIcon(n.type)}</Box>

                {/* Texts */}
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
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: colors.text }}
                  >
                    {n.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
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
