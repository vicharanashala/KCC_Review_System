import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import type { Question } from '../../types';

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
}

export const QuestionList = ({ questions, loading }: QuestionListProps) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (questions.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          No questions found. Submit a new question to get started.
        </Typography>
      </Paper>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_assignment':
        return 'default';
      case 'in_review':
        return 'primary';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper elevation={2} sx={{ overflowX: 'auto' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Crop</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Query</TableCell>
              <TableCell>Season</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted On</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id} hover>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {question.id.substring(0, 8)}...
                  </Typography>
                </TableCell>
                <TableCell>{question.crop}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {question.district}, {question.state}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{
                      maxWidth: 200,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={question.originalQuery}
                  >
                    {question.originalQuery}
                  </Typography>
                </TableCell>
                <TableCell>{question.season}</TableCell>
                <TableCell>
                  <Chip 
                    label={question.priority}
                    color={
                      question.priority === 'high' ? 'error' : 
                      question.priority === 'medium' ? 'warning' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={question.status.replace('_', ' ')}
                    color={getStatusColor(question.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(question.createdAt)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default QuestionList;
