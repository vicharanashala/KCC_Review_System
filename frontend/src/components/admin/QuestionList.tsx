import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress ,TablePagination,TextField} from '@mui/material';
import type { Question } from '../../types';
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
interface QuestionListProps {
  questions: Question[];
  loading: boolean;
}
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface IQuestion {
  _id: string;
  question_id: string;
  original_query_text: string;
  crop: string;
  district: string;
  state: string;
  season: string;
  query_type: string;
  status: string;
  user: User;
  user_id: string;
  created_at: string;
}
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  const fetchquestions = async ({
    page,
    rowsPerPage,
    questionsSearch,
    search,
  }: {
    page: number;
    rowsPerPage: number;
    questionsSearch: string;
    search: string;
  }): Promise<{ questions: Question[]; total: number }> => {
    try {
      console.log("fetch====")
      const token = localStorage.getItem("access_token");
      const skip = page * rowsPerPage;
  
      const res = await fetch(
        `${API_BASE_URL}/admin/questions?skip=${skip}&limit=${rowsPerPage}&questionsSearch=${questionsSearch}&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );
  
      if (!res.ok) {
        const errText = await res.text();
        console.error("API fetch failed:", res.status, errText);
        return { questions: [], total: 0 }; // fallback
      }
  
      const data = await res.json();
      // Ensure data structure
      console.log("the questions===",data)
      return {
        questions: data.questions || [],
        total: data.total || 0,
      };
    } catch (error) {
      console.error("Fetch questions error:", error);
      return { questions: [], total: 0 }; // fallback
    }
  };
  
export const QuestionList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
 // const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const [questionsSearch, setQuestionSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["questions", page, rowsPerPage, questionsSearch, search],
    queryFn: () => fetchquestions ({ page, rowsPerPage, questionsSearch, search }),
    keepPreviousData: true,
  });
  /*useEffect(()=>{
    console.log("the data coming===",data)
  //  setQuestionsList(data.questions)
  },[data])*/
  if (isLoading) return <CircularProgress />;
  if (isError){
    console.log("the eror comining*****",isError)
    return <Typography color="error">Failed to load users.</Typography>;

  }
   

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const questionList = data?.questions || [];
/*if (!questionList.length) {
  return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="textSecondary">
        No questions found. Submit a new question to get started.
      </Typography>
    </Paper>
  );
}*/

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
        <Box
        p={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <TextField
          size="small"
          label="Search Users "
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 250 }}
        />
         <TextField
          size="small"
          label="Search questions"
          variant="outlined"
          value={questionsSearch}
          onChange={(e) => setQuestionSearch(e.target.value)}
          sx={{ width: 250 }}
        />

        
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
            <TableCell>User Name</TableCell>
              <TableCell>QuestionID</TableCell>
              <TableCell>Crop</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Query</TableCell>
              <TableCell>Season</TableCell>
              
              <TableCell>Submitted On</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questionList.map((question) => (
              <TableRow key={question.id} hover>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {question?.user?.name ||'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {question.question_id.substring(0, 8)||'N/A'}...
                  </Typography>
                </TableCell>
                <TableCell>{question.crop || 'N/A'}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {question.district || "N/A"}, {question.state || 'N/A'}
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
                    title={question.original_query_text
                    }
                  >
                    {question.original_query_text||'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>{question.season||'N/A'}</TableCell>
              {/*} <TableCell>
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
                  </TableCell>*/}
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(question.created_at)||'N/A'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={data?.total ?? 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
};

export default QuestionList;
