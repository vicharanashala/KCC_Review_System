import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { socket } from "../services/socket";
import { useToast } from "./ToastContext";

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
  notification_id: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  unreadCount: number;
  reloadNotifications: () => Promise<void>;
  taskAdded:Notification[]
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { showSuccess, showError } = useToast();
  const [taskAdded,setTaskAdded]=useState<Notification[]>([])
  const userId = localStorage.getItem("user_id");

  const reloadNotifications = async () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications || []);
    } catch (err: any) {
      console.error("Failed to fetch notifications", err);
      showError("Failed to fetch notifications");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      showError("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showSuccess("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read", err);
      showError("Failed to mark all notifications as read");
    }
  };

  useEffect(() => {
    if (!userId) return;
    if (!socket.connected) socket.connect();
  
    socket.emit("register", userId);
    console.log(` Registered user ${userId} to socket`);
  
    const handleInsert = (notification: any) => {
      console.log(" New Notification Received:", notification);
  
      // Handle "task_assigned" notifications globally
      if (notification.type === "task_assigned") {
        showSuccess(notification.message || "New task assigned!");
      }
  
      setNotifications((prev) => [notification, ...prev]);
      setTaskAdded((prev) => [notification, ...prev])
    };
  
    socket.on("notification:insert", handleInsert);
  
    reloadNotifications();
  
    return () => {
      socket.off("notification:insert", handleInsert);
    };
  }, [userId]);
  

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, markAsRead, markAllAsRead, unreadCount, reloadNotifications ,taskAdded}}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
};
