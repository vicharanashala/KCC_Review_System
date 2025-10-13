


import { useState } from "react";
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
  const dummyQuestions = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Sample Question ${i + 1}`,
    sector: "AGRICULTURE",
    questionType: "Crop Production & Management",
    seasonType: "Kharif",
    state: "Kerala",
    cropName: "Rice",
    region: "Thrissur",
    questionText: `How to improve yield for Rice during ${i + 1}?`,
    kccAns: "Use quality seeds and follow irrigation practices.",
  }));

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const filteredQuestions = dummyQuestions.filter((q) =>
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
                {paginatedData.length > 0 ? (
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

// 🟦 DETAILS MODAL — Editable Form (populated with selected question)
// function QuestionDetailsModal({ open, onClose, question }) {
//   const [sectorValue, setSectorValue] = useState(question.sector);
//   const [specializationvalue, setSpecilizationValue] = useState(
//     question.questionType
//   );
//   const [seasonvalue, setSeasonValue] = useState(question.seasonType);
//   const [statevalue, setStateValue] = useState(question.state);
//   const [cropName, setCropName] = useState(question.cropName);
//   const [region, setRegion] = useState(question.region);
//   const [questionText, setQuestionText] = useState(question.questionText);
//   const [kccAns, setKccAns] = useState(question.kccAns);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = () => {
//     setIsSubmitting(true);
//     setTimeout(() => {
//       setIsSubmitting(false);
//       alert("Changes saved successfully!");
//       onClose();
//     }, 1000);
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
//       <DialogTitle
//         sx={{
//           m: 0,
//           p: 2,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <Typography variant="h6">View / Edit Question</Typography>
//         <IconButton aria-label="close" onClick={onClose}>
//           <CloseIcon />
//         </IconButton>
//       </DialogTitle>

//       <DialogContent dividers>
//         <FormControl fullWidth margin="normal">
//           <InputLabel>Sector Type *</InputLabel>
//           <Select
//             value={sectorValue}
//             label="Sector Type *"
//             onChange={(e) => setSectorValue(e.target.value)}
//           >
//             {sector.map((s) => (
//               <MenuItem key={s.value} value={s.value}>
//                 {s.label}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth margin="normal">
//           <InputLabel>Question Type *</InputLabel>
//           <Select
//             value={specializationvalue}
//             label="Question Type *"
//             onChange={(e) => setSpecilizationValue(e.target.value)}
//           >
//             {specialization.map((s) => (
//               <MenuItem key={s.value} value={s.value}>
//                 {s.label}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth margin="normal">
//           <InputLabel>Season Type *</InputLabel>
//           <Select
//             value={seasonvalue}
//             label="Season Type *"
//             onChange={(e) => setSeasonValue(e.target.value)}
//           >
//             {season.map((s) => (
//               <MenuItem key={s.value} value={s.value}>
//                 {s.label}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth margin="normal">
//           <InputLabel>State *</InputLabel>
//           <Select
//             value={statevalue}
//             label="State *"
//             onChange={(e) => setStateValue(e.target.value)}
//           >
//             {states.map((s) => (
//               <MenuItem key={s.value} value={s.value}>
//                 {s.label}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <TextField
//           label="Crop Name"
//           fullWidth
//           margin="dense"
//           value={cropName}
//           onChange={(e) => setCropName(e.target.value)}
//         />

//         <TextField
//           label="Region"
//           fullWidth
//           margin="dense"
//           value={region}
//           onChange={(e) => setRegion(e.target.value)}
//         />

//         <TextField
//           label="Question"
//           fullWidth
//           multiline
//           rows={3}
//           margin="dense"
//           value={questionText}
//           onChange={(e) => setQuestionText(e.target.value)}
//         />

//         <TextField
//           label="Kcc Answer"
//           fullWidth
//           multiline
//           rows={3}
//           margin="dense"
//           value={kccAns}
//           onChange={(e) => setKccAns(e.target.value)}
//         />

//         <label htmlFor="csv-upload">Add Your CSV here</label> <br />
//         <input
//           id="csv-upload"
//           type="file"
//           accept=".csv"
//           onChange={(e) =>
//             setSelectedFile(e.target.files ? e.target.files[0] : null)
//           }
//         />
//       </DialogContent>

//       <DialogActions sx={{ p: 2 }}>
//         <Button onClick={onClose} sx={{ textTransform: "none" }}>
//           Cancel
//         </Button>
//         <Button
//           variant="contained"
//           onClick={handleSubmit}
//           disabled={isSubmitting}
//           sx={{
//             textTransform: "none",
//             backgroundColor: "#00A63E",
//             "&:hover": { backgroundColor: "#008c35" },
//           }}
//         >
//           {isSubmitting ? (
//             <CircularProgress size={24} color="inherit" />
//           ) : (
//             "Save Changes"
//           )}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }




import { useToast } from "../contexts/ToastContext";

export function QuestionDetailsModal({ open, onClose, question }) {
  console.log(question)
  // ✅ Access global dropdown options from context
  const { sector, specialization, season, states } = useToast();

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Changes saved successfully!");
      onClose();
    }, 1000);
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

        {/* ✅ File upload */}
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
          onClick={handleSubmit}
          disabled={
            isSubmitting || (!questionText.trim() && !selectedFile)
          }
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
