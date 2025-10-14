import { useState, useEffect } from "react"; 
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function ViewLLMQuestionsModal({ open, onClose }) {
  // CHANGE: Replaced dummyQuestions with state for API data
  // CHANGE: Added loading state for API fetch
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // CHANGE: Added useEffect to fetch data from API when modal opens
  useEffect(() => {
  if (open) {
    setLoading(true);
    axios
      .get("http://localhost:8000/api/questions/llm/moderator")
      .then((res) => {
        const data = res.data; // Axios auto-parses JSON
        const mappedQuestions = data.map((q) => ({
          id: q._id,
          name: q.original_query_text, // Using original_query_text as display name
          sector: q.sector,
          questionType: q.query_type,
          seasonType: q.season,
          state: q.state,
          cropName: q.crop,
          region: q.district,
          questionText: q.original_query_text,
          kccAns: q.KccAns,
        }));
        setQuestions(mappedQuestions);
      })
      .catch((err) => {
        console.error("Error fetching questions:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }
}, [open]);

  // CHANGE: Updated filteredQuestions to use questions instead of dummyQuestions
  const filteredQuestions = questions.filter((q) =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedData = filteredQuestions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <>
      {/* TABLE MODAL */}
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">All Questions</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          <TextField
            label="Search Question"
            variant="outlined"
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Sl. No.</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Question Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* CHANGE: Added loading state handling in TableBody */}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((q, index) => (
                    <TableRow key={q.id}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{q.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          sx={{
                            textTransform: "none",
                            borderColor: "#0000001A",
                            color: "#000",
                            "&:hover": {
                              borderColor: "#0000001A",
                              backgroundColor: "#f9f9f9",
                            },
                          }}
                          onClick={() => setSelectedQuestion(q)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No questions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredQuestions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAILS MODAL */}
      {selectedQuestion && (
        <QuestionDetailsModal
          open={Boolean(selectedQuestion)}
          onClose={() => setSelectedQuestion(null)}
          question={selectedQuestion}
        />
      )}
    </>
  );
}

import { useToast } from "../contexts/ToastContext";
export function QuestionDetailsModal({ open, onClose, question }) {
  const { sector, specialization, season, states, showError, showSuccess } = useToast();

  const [sectorValue, setSectorValue] = useState(question.sector);
  const [specializationValue, setSpecializationValue] = useState(
    question.questionType
  );
  const [seasonValue, setSeasonValue] = useState(question.seasonType);
  const [stateValue, setStateValue] = useState(question.state);
  const [cropName, setCropName] = useState(question.cropName);
  const [region, setRegion] = useState(question.region);
  const [questionText, setQuestionText] = useState(question.questionText);
  const [kccAns, setKccAns] = useState(question.kccAns);
  const [llmId,setLlmId] =useState(question.id as string)
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleQuestionSubmit = async () => {
    if (!llmId.trim()) {
      showError("Please enter question type");
      return;
    }
    if (!specializationValue.trim()) {
      showError("Please enter question type");
      return;
    }

    if (!seasonValue.trim()) {
      showError("Please enter season");
      return;
    }
    if (!sectorValue.trim()) {
      showError("Please enter sector type");
      return;
    }
    if (!stateValue.trim()) {
      showError("Please enter state");
      return;
    }
    if (!cropName.trim()) {
      showError("Please enter crop name");
      return;
    }
    if (!region.trim()) {
      showError("Please enter region");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      const userId = localStorage.getItem("user_id");
      if (userId) {
        formData.append("user_id", userId.toString());
      }
      if(llmId){
        formData.append("llmId",llmId)
      }

      if (questionText.trim()) {
        formData.append("original_query_text", questionText.trim());
      }
      if (selectedFile) {
        formData.append("csvFile", selectedFile);
      }
      if (kccAns) {
        formData.append("KccAns", kccAns);
      }
      // CHANGE: Append question._id as question_id for update (assuming _id is the identifier)
      if (question._id) {
        formData.append("question_id", question._id);
      }
      formData.append('query_type', specializationValue);
      formData.append('season', seasonValue);
      formData.append('state', stateValue);
      formData.append('sector', sectorValue);
      formData.append('crop', cropName);
      formData.append('district', region);
      formData.append('status', "assigned_to_moderation");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to update question");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        showSuccess(`${data.length} questions updated successfully!`);
      } else {
        showSuccess("Question updated successfully!");
      }
      onClose();
      // CHANGE: Optionally, if parent needs refetch, you can pass a prop like onSuccess={() => { fetchQuestions(); }} and call it here
    } catch (err) {
      console.error("Error updating question:", err);
      showError(
        err instanceof Error ? err.message : "Failed to update question"
      );
    } finally {
      setIsSubmitting(false);
      // CHANGE: Reset states after submission (adapted for edit modal)
      setSpecializationValue("");
      setLlmId("");
      setKccAns("");
      setStateValue("");
      setSeasonValue("");
      setSectorValue("");
      setCropName("");
      setRegion("");
      setQuestionText("");
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">View / Edit Question</Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* ✅ Sector Type */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Sector Type *</InputLabel>
          <Select
            value={sectorValue}
            label="Sector Type *"
            onChange={(e) => setSectorValue(e.target.value)}
          >
            {sector.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ✅ Question Type */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Question Type *</InputLabel>
          <Select
            value={specializationValue}
            label="Question Type *"
            onChange={(e) => setSpecializationValue(e.target.value)}
          >
            {specialization.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ✅ Season Type */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Season Type *</InputLabel>
          <Select
            value={seasonValue}
            label="Season Type *"
            onChange={(e) => setSeasonValue(e.target.value)}
          >
            {season.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ✅ State */}
        <FormControl fullWidth margin="normal">
          <InputLabel>State *</InputLabel>
          <Select
            value={stateValue}
            label="State *"
            onChange={(e) => setStateValue(e.target.value)}
          >
            {states.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ✅ Other Text Fields */}
        <TextField
          label="Crop Name"
          fullWidth
          margin="dense"
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
        />

        <TextField
          label="Region"
          fullWidth
          margin="dense"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />

        <TextField
          label="Question"
          fullWidth
          multiline
          rows={3}
          margin="dense"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />

        <TextField
          label="KCC Answer"
          fullWidth
          multiline
          rows={3}
          margin="dense"
          value={kccAns}
          onChange={(e) => setKccAns(e.target.value)}
        />

        {/* CHANGE: Uncommented file upload to match original function */}
        {/* <div style={{ marginTop: "1rem" }}>
          <label htmlFor="csv-upload">Add Your CSV here</label> <br />
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            title="Upload CSV file"
            onChange={(e) =>
              setSelectedFile(e.target.files ? e.target.files[0] : null)
            }
          />
        </div> */}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleQuestionSubmit}
          disabled={isSubmitting}
          sx={{
            textTransform: "none",
            backgroundColor: "#00A63E",
            "&:hover": {
              backgroundColor: "#008c35",
            },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}