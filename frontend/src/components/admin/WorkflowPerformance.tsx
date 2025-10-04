import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  Card,
  CardContent,
  TableContainer,
  LinearProgress,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const getWorkflowPerformance = async () => {
  const token = localStorage.getItem("access_token");

  const res = await fetch(
    `${API_BASE_URL}/admin/reports/workflow-performance`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch workflow performance");
  }

  return res.json();
};

export default function WorkflowPerformance() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const data = await getWorkflowPerformance();
      setStats(data);
    })();
  }, []);

  if (!stats) return <div>Loading...</div>;

  const completionData = [
    { name: "Completed", value: stats.completed_questions, color: "#10b981" },
    {
      name: "Pending",
      value: stats.total_questions - stats.completed_questions,
      color: "#ef4444",
    },
  ];

  const topPerformers = stats.specialist_performance
    .sort((a: any, b: any) => b.questions_handled - a.questions_handled)
    .slice(0, 5);

  return (
    <Box p={3}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Workflow Performance Dashboard
        </Typography>
        <Typography color="text.secondary">
          Last {stats.period_days} days overview
        </Typography>
      </Box>

      <Grid container spacing={2} mb={4}>
        {[
          {
            label: "Total Questions",
            value: stats.total_questions,
            color: "primary",
          },
          {
            label: "Completed",
            value: stats.completed_questions,
            color: "success",
          },
          {
            label: "Completion Rate",
            value: `${stats.completion_rate.toFixed(1)}%`,
            color: "warning",
          },
          {
            label: "Avg Processing Time",
            value: `${stats.avg_processing_time_hours} hrs`,
            color: "secondary",
          },
        ].map((metric) => (
          <Grid item xs={12} md={3} key={metric.label}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={metric.color as any}
                >
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" mb={2}>
                Question Status
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={completionData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent as number) * 100).toFixed(0)}%`
                    }
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" mb={2}>
                Top 5 Performers
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topPerformers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="questions_handled" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Specialist Details Table */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" mb={2}>
            Specialist Details
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Questions Handled</TableCell>
                  <TableCell>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.specialist_performance
                  .sort(
                    (a: any, b: any) =>
                      b.questions_handled - a.questions_handled
                  )
                  .map((specialist: any) => (
                    <TableRow key={specialist._id}>
                      <TableCell>{specialist.name}</TableCell>
                      <TableCell>{specialist.user_id}</TableCell>
                      <TableCell>{specialist.questions_handled}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box width="100%" mr={1}>
                            <LinearProgress
                              variant="determinate"
                              value={
                                (specialist.questions_handled /
                                  Math.max(
                                    ...stats.specialist_performance.map(
                                      (s: any) => s.questions_handled
                                    )
                                  )) *
                                100
                              }
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {(
                              (specialist.questions_handled /
                                stats.total_questions) *
                              100
                            ).toFixed(1)}
                            %
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
