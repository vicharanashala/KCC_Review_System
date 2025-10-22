import { Box, Typography, Paper, Button, TextField, CircularProgress, Chip, } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { peerValidationApi } from "../../api/peerValidation";


interface Source {
    name: string;
    link: string;
    id:number;
    errorsList: {
        name?: string;
        link?: string;
      };
    
}

interface AnswerData {
    question_id: string;
    answer_text: string;
    sources?: Source [];
    sourceName?:string;
    sourceLink?: string;
    userId?: string;
    RejectedUser?: string;
    status?:string;
    questionObjId?:string;
    notification_id:string;
    peer_validation_id:string;
}

interface VersionHistory {
    
    status: 'current' | 'approved' | 'revision_requested' | 'initial_draft'|'Answer_Created'|'assigned_to_agrispecilist';
    timestamp: string;
    statusLabel?: string;
    statusColor?: string;
    timeAgo?: string;
    reviewer?: string;
    
    changes?: string;
    issues?: string;
    description?: string;
}
interface PeerReviewer {
    reviewer: string;
    status: string;
    statusLabel: string;
    statusColor: string;
    timeAgo: string;
    comments: string;
    created_at:string;
  }
  
  interface VersionItem {
    version: number;
    feedback: string;
    reviewers: PeerReviewer[];
  }

interface ReviewerInsights {
    approvals: number;
    revisions: number;
}

interface KeyImprovement {
    text: string;
}

export const ReviewQueue = () => {
    
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const task = location.state?.task;
   // console.log("the task coming====",task)
    const answer=task?. answer_text
    let avilableSourceList=[]
    
    if(task?.type=='Reject')
    {
        avilableSourceList=task.sources || [ { id: Date.now(), name: "", link: "" ,errorsList:{}}]
        //task.type="Revise Answer.."
    }
  
  
   
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState(answer|| '');
    const [sources, setSources] = useState<Source[]>(task?.type=='Reject'?avilableSourceList:[ { id: Date.now(), name: "", link: "" ,errorsList:{}}]);
    //const [sourceName, setSourceName] = useState(sourceNameToEdit||'');
    //const [sourceLink, setSourceLink] = useState(sourceUrlToEdit||'');
    const [urlError, setUrlError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'approved' | 'revised' | null>(null);
    const [comments, setComments] = useState('');
    const [revisedAnswer, setRevisedAnswer] = useState(task?.answer_preview || '');
    const [questiontext,setQuestionText]=useState(task.question_text||'')
    const [questionStatus,setQuestionStatus]=useState('')
    // const [peerValidationHistory, setPeerValidationHistory] = useState<PeerValidationHistory[]>([]);
    // const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    // const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const { showSuccess, showError } = useToast();
    //console.log("sources===",sources)
    const [versionHistory, setVersionHistory] = useState<VersionItem[]>([]);
    const [reviewerInsights, setReviewerInsights] = useState<ReviewerInsights>({ approvals: 0, revisions: 0 });
    // const [keyImprovements, setKeyImprovements] = useState<KeyImprovement[]>([]);
    const [isLoadingVersionHistory, setIsLoadingVersionHistory] = useState(false);
    const keyImprovements: KeyImprovement[] = [
        { text: "Added monsoon-specific timing guidelines" },
        { text: "Included variety-specific NPK ratios" },
        { text: "Enhanced regional adaptation notes" },
        { text: "Improved technical accuracy" }
    ];
     // Add new input
     const addGroup = (id:number): void => {
      //  console.log("the index coming===",id)
        setSources((prev) => [
          ...prev,
          { id: Date.now(), name: "", link: "" , errorsList: {}},
        ]);
      };
    
      const removeGroup = (id: number): void => {
        if (sources.length > 1) {
          setSources((prev) => prev.filter((group) => group.id !== id));
        }
      };
      const validateInput = (value: string,field:string): string | undefined => {
      //  console.log("the value coming====",value,field)
        
        if(field==="link")
        {
            if (value.trim() === "") return "SourceUrl is required";
            try {
                new URL(value); // will throw if invalid
                return undefined;
              } catch {
                return "Invalid URL";
              }
        }
        else{
            if (value.trim() === "") return "SourceName is required";
        }
       
      };
      const handleChange = (
        id: number,
        field: "name" | "link",
        value: string
      ): void => {
        setSources((prev) =>
          prev.map((group) => {
            if (group.id === id) {
              const error = validateInput(value,field); // validate in real-time
              return {
                ...group,
                [field]: value,
                errorsList: { ...group.errorsList, [field]: error},
              };
            }
            return group;
          })
        );
      };
    
    useEffect(() => {
        if (!task) {
            setError('No task data available');
            setLoading(false);
            return;
        }
        setLoading(false);

        if (task?.type !== 'create_answer') {
            fetchVersionHistory();
        }
    }, [task]);

    // const fetchPeerValidationHistory = async () => {
    //     if (!task?.answer_id) {
    //         showError('Answer ID is missing');
    //         return;
    //     }

    //     setIsLoadingHistory(true);
    //     try {
    //         const response = await peerValidationApi.getPeerValidationHistory(task.answer_id);
    //         setPeerValidationHistory(response.peer_validation_history || []);
    //         setIsReviewDialogOpen(true);
    //     } catch (err) {
    //         console.error('Error fetching peer validation history:', err);
    //         showError(err instanceof Error ? err.message : 'Failed to fetch peer validation history');
    //     } finally {
    //         setIsLoadingHistory(false);
    //     }
    // };

    const fetchVersionHistory = async () => {
        setIsLoadingVersionHistory(true);
        try {
          const response = await peerValidationApi.getPeerValidationHistory(task.question_id);
          const history = response.peer_validation_history || [];
          console.log("the response coming=====", response);
         
          const groupedVersions: VersionItem[] = [];
          let approvals = 0;
          let revisions = 0;
      
          history.forEach((versionData, index) => {
            const versionNumber = versionData.version;
            const answerText = versionData.answer_text || "No answer text available";
            const peerValidationsList = versionData.peer_validations || [];
            const validationsList=versionData.validations||[]
            const peerValidations=[...peerValidationsList,...validationsList]

      
            const versionItem: VersionItem = {
                version: versionNumber,
                feedback: answerText,
                reviewers: [],
              };
      
            peerValidations.forEach((validation, idx) => {
               
              // Count approvals/revisions
              if (validation.status === "approved"||validation.status === "valid") approvals += 1;
              if (validation.status === "revised"||validation.status === "invalid") revisions += 1;
      
              // Time formatting
              const createdAt = new Date(validation.created_at);
              const diffMs = Date.now() - createdAt.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const timeAgo =
                diffDays === 0 ? "Today" : diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
      
              // Status label and color
              let statusLabel = "";
              let statusColor = "";
              switch (validation.status) {
                case "approved":
                  statusLabel = "Approved";
                  statusColor = "#00A63E";
                  break;
                case "answer_created":
                    if (validation.comments && validation.comments.length >= 1) {
                        statusLabel = "Answer Modified";
                        statusColor = "blue";
                    }
                    else{
                        statusLabel = "Answer Created";
                        statusColor = "blue";
                    }
                 
                  break;
                case "assigned_to_agrispecilist":
                  statusLabel = "Awaiting review from";
                  statusColor = "red";
                  break;
                case "revised":
                    if (validation.comments && validation.comments.length >= 1) {
                      // ✅ Handle revised with comments separately
                      statusLabel = "Awaiting review from";
                      statusColor = "red"; // orange shade to distinguish
                    } else {
                      statusLabel = "Revision Requested";
                      statusColor = "#D08700"; // amber
                    }
                    break;
                case "invalid":
                        statusLabel = "Revision Requested By Moderator";
                        statusColor = "#D08700";
                        break;
                case "valid":
                            statusLabel = "Approved By Moderator";
                            statusColor = "#00A63E";
                        break;
                case "validation_request":
                    statusLabel = "Awaiting review from";
                    statusColor = "red";
                    break;
                default:
                  statusLabel = "Revision Requested";
                  statusColor = "#D08700";
                  break;
              }
      
              versionItem.reviewers.push({
                reviewer: `${validation.reviewer_email||validation.reviewer_name  || "Unknown"} `,
                status: validation.status,
                statusLabel,
                statusColor,
                timeAgo,
                comments: validation.comments || "",
                created_at:validation.created_at
              });
            });
      
            groupedVersions.push(versionItem);
          });
      
          // Update state once (important)
          setVersionHistory(groupedVersions);
          setReviewerInsights({ approvals, revisions });
        } catch (err) {
          console.error("Error fetching version history:", err);
        } finally {
          setIsLoadingVersionHistory(false);
        }
      };
      
    const renderField = (label: string, value: string) => (
        <Box
      key={label}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 2,
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight="500"
        sx={{ width: "30%", color: "#333" }}
      >
        {label}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={1}
        size="small"
        variant="outlined"
        value={value}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            "& fieldset": { border: "1px solid #f0e0d0" },
            "&:hover fieldset": { borderColor: "#e0c0a0" },
          },
        }}
      />
    </Box>
      );
    const MetaDataComponent = () => (
        <Paper
            sx={{
                p: 3,
                 mb: 3,
                borderRadius: 2,
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                 border: "1px solid #ddd",
            }}
        >
            <Typography>
                Meta Data
            </Typography>
          {renderField("sector", task?.sector)}
      {renderField("season", task?.season)}
      {renderField("specialization", task?.question_type)}
      {renderField("state", task?.state)}
      {renderField("crop", task?.crop)}
      {renderField("region", task?.district)}
           
         </Paper>
    )
   
    const SourceComponent=()=>(
        <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
        border: "1px solid #ddd",
      }}
    >
      <Typography  >
        Sources {task.sources?.length ? `(${task.sources.length})` : ""}
      </Typography>

      {task.sources && task.sources.length > 0 ? (
        task.sources.map((ele: any, index: number) =>
          renderField(ele.name, ele.link)
        )
      ) : (
        <Typography variant="body2" color="text.secondary">
          No sources available
        </Typography>
      )}
    </Paper>
    )
   /* const isValidURL = (url: string,id:number) => {

                try {
                    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
                    if (!urlPattern.test(url.trim())) {
                        return false;
                    }
                    
                    const urlToTest = url.startsWith('http://') || url.startsWith('https://') 
                        ? url 
                        : `https://${url}`;
                    new URL(urlToTest);
                    return true;
                } catch {
                    return false;
                }
           
            
       
   
    };*/

    const handleSubmitAnswer = async () => {
      //  console.log("the source List===",sources)
        const isValid = sources.every(
            (group) => group.name.trim() !== "" && group.link.trim() !== ""
          );
      
         
        if (!answerText.trim()) {
            showError('Please provide an answer');
            return;
        }

        if (!task?.question_id) {
            showError('Question ID is missing');
            return;
        }
        if (!isValid) {
            showError("Please Enter All The Required Fields");
            return;
          }
      /*  if(sources.length>1)
        {
            showError('Please Provide Source Name')
            return;
        }

        if (!sourceLink.trim() && !isValidURL(sourceLink.trim())) {
            setUrlError('Please enter a valid URL');
            showError('Please enter a valid URL for the source');
            return;
        }*/
       // console.log(sourceName,sourceLink)
        
       // setSources( [{ name:'hello',link: 'link'}])
       
       // sources: [{ name: sourceName,link: sourceLink }]
       // sources: [{ sourceLink: sourceLink}]
    //  setSources(sources)

       // console.log(sources)
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const userId=localStorage.getItem('user_id')
            const answerData: AnswerData = {
                question_id: task.question_id,
                answer_text: answerText,
                sources: sources,
                userId:userId?.toString(),
                RejectedUser:task?. RejectedUser,
                status:task?.status,
                questionObjId:task?.questionObjId,
                notification_id:task.notification_id?task.notification_id:'',
                peer_validation_id:task.peer_validation_id?task.peer_validation_id:''
                
                

               // sourceName:sourceName,
               // sourceLink:sourceLink
            };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(answerData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit answer');
            }

            const responseData = await response.json();
            showSuccess(responseData.message || 'Answer submitted successfully!');
            setAnswerText('');
            setSources([]);
          //  setSourceName('');
           // setSourceLink('');
           setUrlError('')

            navigate("/agri-specialist/dashboard");
        } catch (err) {
            console.error('Error submitting answer:', err);
            showError(err instanceof Error ? err.message : 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };

const handleSubmitQuestion=async()=>{
    console.log("the status====",selectedStatus)
    const formData = new FormData()
    let status=''
    if(selectedStatus=='approved')
    {
        status="approved"
    }
    else{
        status="revised"
        if(comments.length<=1)
        {showError('Please Enter Your Comments')
          return
        }
        
    }
    if(comments.length>=1)
    {
        formData.append("comments",comments)

    }
    if(task.peer_validation_id)
    {
        formData.append('peer_validation_id',task.peer_validation_id)
    }
    if(task.notification_id)
    {
        formData.append('notification_id',task.notification_id)
    }

   // selectedStatus=='approved'?setQuestionStatus('approved'):setQuestionStatus('revised')
    const token = localStorage.getItem('access_token');
    
    formData.append('question_id',task.question_id)
    formData.append('status',status)
    formData.append('query_type',task.specializationvalue)
      formData.append('season',task.seasonvalue)
      formData.append('state',task.statevalue)
      formData.append('sector',task.sectorValue)
      formData.append('crop',task.cropName)
      formData.append('district',task.region)
      formData.append('original_query_text', task.original_query_text)
     
    const userId=localStorage.getItem('user_id')
    if(userId)
      {
        formData.append('user_id',userId.toString())
      }
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // body: JSON.stringify({
        //   original_query_text: questionText.trim()
        // }),
        body:formData
      });

      if (!response.ok) {
        throw new Error('Failed to create question');
      }
      const data = await response.json()
      // showSuccess('Question created successfully!');
      if (Array.isArray(data)) {
        showSuccess(`${data.length} questions created successfully!`);
      } else {
        if(selectedStatus=='approved')
    {
        showSuccess('Question created successfully!');
    }
    else{
    showSuccess('Question Revised successfully!');
       }
       // showSuccess('Question created successfully!');
      }
      navigate(user?.role === 'moderator' ? "/moderator/dashboard" : "/agri-specialist/dashboard")
}

    const handleStatusSelect = (status: 'approved' | 'revised') => {
        setSelectedStatus(status);
    };

    const handlePeerValidation = (status: 'revised') => {
        setSelectedStatus(status);
    };

    const handleSubmit = async () => {
        console.log("Submitted values:", sources);
    //setSources(values);
   
        if (!selectedStatus) {
            showError('Please select a status');
            return;
        }

        if (selectedStatus === 'revised' && !revisedAnswer.trim()) {
            showError('Please provide a revised answer');
            return;
        }

        if (!task?.answer_id) {
            showError('Answer ID is missing');
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const userId=localStorage.getItem('user_id')
            let apiUrl, validationData;

            if (user?.role === 'moderator') {
                console.log("the modertor===",user.role)
                apiUrl = `${import.meta.env.VITE_API_BASE_URL}/validate`;
                validationData = {
                    answer_id: task.answer_id,
                    validation_status: selectedStatus == 'approved' ? 'valid' : 'invalid',
                    comments: comments.trim() || undefined,
                    notification_id:task.notification_id?task.notification_id:'',
                    peer_validation_id:task.peer_validation_id?task.peer_validation_id:'',
                    userId:userId
                };
            } else {
                apiUrl = `${import.meta.env.VITE_API_BASE_URL}/peer-validate`;
                validationData = {
                    answer_id: task.answer_id,
                    status: selectedStatus,
                    comments: comments.trim() || undefined,
                    revised_answer_text: selectedStatus === 'revised' ? revisedAnswer.trim() : undefined,
                    notification_id:task.notification_id?task.notification_id:'',
                    peer_validation_id:task.peer_validation_id?task.peer_validation_id:'',
                    userId:userId
                };
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(validationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit validation');
            }

            const responseData = await response.json();
            showSuccess(responseData.message || `Answer ${selectedStatus === 'approved' ? 'approved' : 'revision submitted'} successfully!`);

            setComments('');
            setRevisedAnswer('');

            navigate(user?.role === 'moderator' ? "/moderator/dashboard" : "/agri-specialist/dashboard")
        } catch (err) {
            console.error('Error submitting validation:', err);
            showError(err instanceof Error ? err.message : 'Failed to submit validation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'current':
                return '#2B7FFF';
            case 'approved':
                return '#00C950';
            case 'revision_requested':
                return '#F0B100';
            case 'initial_draft':
                return '#99A1AF';
            case 'Answer_Created':
                return '#2B7FFF';
            case 'assigned_to_agrispecilist':
                return 'red';
            default:
                return '#99A1AF';
        }
    };


    const getFeedbackBgColor = (status: string) => {
        switch (status) {
            case 'approved':
                return '#e8f5e8';
            case 'revision_requested':
                return '#fff8e1';
            default:
                return '#f5f5f5';
        }
    };

    const VersionHistoryComponent = () => (
        <Paper
            sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                border: "1px solid #ddd",
                height: 'fit-content',
                position: 'sticky',
                top: 20,
                backgroundColor: '#fafafa'
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#333', fontSize: '15px' }}>
                Version History
            </Typography>
            <Typography variant="body2" sx={{ color: '#717182', mb: 3, fontSize: '14px' }}>
                Complete evolution and reviewer feedback trail
            </Typography>
            {isLoadingVersionHistory ? (
  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
    <CircularProgress size={24} />
  </Box>
) : versionHistory.length === 0 ? (
  <Typography
    variant="body2"
    sx={{ color: "#666", textAlign: "center", py: 2 }}
  >
    No version history available
  </Typography>
) : (
  <Box sx={{ position: "relative" }}>
    {versionHistory.map((version, vIndex) => (
      <Box key={vIndex} sx={{ mb: 5 }}>
        {/* 🔹 Version Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Chip
            label={`Version-${version.version}`}
            size="small"
            sx={{
              backgroundColor: "#007BFF20",
              color: "#007BFF",
              fontWeight: 600,
              fontSize: "13px",
              height: "28px",
              borderRadius: "14px",
              px: 1.5,
            }}
          />
        </Box>

        {/* 🧩 Answer Preview */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "#F9FAFB",
            borderRadius: 1.5,
            border: "1px solid #E0E0E0",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 600, color: "#333" }}
          >
            Answer Preview:
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.6,
              maxHeight: 150,
              overflowY: "auto",
              display: "block",
              scrollbarWidth: "thin",
              color: "#444",
            }}
          >
            {version.feedback}
          </Typography>
        </Box>

        {/* 🧠 Reviewer Feedbacks */}
        {version.reviewers.map((rev, rIndex) => {
          const color = rev.statusColor || "#9E9E9E";
          return (
            <Box
              key={rIndex}
              sx={{
                mt: 2.5,
                pl: 2.5,
                borderLeft: `4px solid ${color}`,
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#0A0A0A", mb: 0.5 }}
              >
                Reviewer:{" "}
                <span style={{ color: "" }}>{rev.reviewer}</span>
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: color,
                  fontWeight: 500,
                  mb: 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {rev.statusLabel} •{" "}
                <span style={{ color: "#555" }}>{new Date(rev.created_at).toLocaleString()}</span>
              </Typography>

              {rev.comments && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#555",
                    backgroundColor: `${color}10`,
                    borderRadius: 1,
                    border: `1px solid ${color}30`,
                    p: 1,
                    lineHeight: 1.5,
                  }}
                >
                  Comments: {rev.comments}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    ))}
  </Box>
)}



            {!isLoadingVersionHistory && (
                <Box sx={{ mt: 5, mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333', fontSize: '16px' }}>
                        Reviewer Insights
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: '#e8f5e8',
                                borderRadius: 1.5,
                                textAlign: 'center',
                                minWidth: '80px'
                            }}
                        >
                            <Typography variant="h6" sx={{ color: '#00C950', fontWeight: 700, fontSize: '20px', mb: 0.5 }}>
                                {reviewerInsights.approvals}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#00C950', fontSize: '12px', fontWeight: 500 }}>
                                Approvals
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: '#fff3e0',
                                borderRadius: 1.5,
                                textAlign: 'center',
                                minWidth: '80px'
                            }}
                        >
                            <Typography variant="h6" sx={{ color: '#F0B100', fontWeight: 700, fontSize: '20px', mb: 0.5 }}>
                                {reviewerInsights.revisions}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#F0B100', fontSize: '12px', fontWeight: 500 }}>
                                Revision
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* {!isLoadingVersionHistory && keyImprovements.length > 0 && ( */}
                <Box>
                    
                    <Box
                        sx={{
                            p: 2.5,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1.5,
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333', fontSize: '16px' }}>
                        Key Improvements Made
                    </Typography>
                        {keyImprovements.map((improvement, index) => (
                            <Typography
                                key={index}
                                variant="body2"
                                sx={{
                                    color: '#333',
                                    mb: index < keyImprovements.length - 1 ? 1.5 : 0,
                                    position: 'relative',
                                    pl: 2.5,
                                    fontSize: '14px',
                                    lineHeight: 1.5,
                                    '&::before': {
                                        content: '"•"',
                                        position: 'absolute',
                                        left: 0,
                                        color: '#333',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }
                                }}
                            >
                                {improvement.text}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            {/* )} */}
        </Paper>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !task) {
        return (
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
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
                    disabled={isSubmitting}
                >
                    Back to Dashboard
                </Button>
                <Typography color="error">
                    {error || 'Question not found'}
                </Typography>
            </Box>
        );
    }

    return (
        
        <Box sx={{
            p: 3,
            maxWidth: task?.type === 'create_answer' ? 800 : 1400,
            mx: "auto"
        }}>
            {task?.type === 'question_validation'

            ?
            <Box>
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
            <Box sx={{  gap:3, alignItems: 'flex-start', justifyContent: 'center' }}>
                <Box sx={{
                    flex: 1,
                    maxWidth: 800
                }}>

                    <Paper
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                            border: "1px solid #ddd",
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight="500"
                            sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                            📄 {task.question_text || 'No title available'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                                Type:{' '}
                                <span style={{ color: "#2B7FFF", fontWeight: 500 }}>
                                    {task.type==="Reject"?
                                    "Revise Answer"
                                    :
                                    task.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'
                                    }
                                    
                                </span>
                            </Typography>

                            <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                                • Consecutive Approvals: <span style={{
                                    color: task.consecutive_approvals > 0 ? '#00C950' : '#d32f2f',
                                    fontWeight: 500
                                }}>
                                    {task.consecutive_approvals || 0}
                                </span>
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                                • ID: <span style={{ fontFamily: 'monospace' }}>{task.question_id || 'N/A'}</span>
                            </Typography>
                        </Box>
                        </Paper>
                        </Box>
                        </Box>
                        <MetaDataComponent/>
                        <SourceComponent/>
                    <Paper  sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                        border: "1px solid #ddd",
                    }}>
                         <Typography sx={{ my: 2 }}>Question</Typography>
                            <Box>
                                <TextField
                                    placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "No changes needed for approval" : user?.role === 'moderator' ? "Answer text (read-only for moderators)" : "Edit the answer if needed (only for revisions)"}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    variant="outlined"
                                    value={questiontext}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    disabled={!selectedStatus || selectedStatus === 'approved' || user?.role === 'moderator'}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            bgcolor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f5f5f5" : "#fff8f0",
                                            borderRadius: "8px",
                                            "& fieldset": {
                                                border: "1px solid #f0e0d0",
                                            },
                                            "&:hover fieldset": {
                                                borderColor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f0e0d0" : "#e0c0a0"
                                            },
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ my: 2 }}>
                                <Typography sx={{ my: 2 }}>Add comments</Typography>
                                <TextField
                                    placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "Comments (optional)" : "Please provide comments for rejection"}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    variant="outlined"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    disabled={!selectedStatus || selectedStatus === 'approved'}
                                    required={selectedStatus === 'revised'}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            bgcolor: selectedStatus === 'approved' ? "#f5f5f5" : "#fff8f0",
                                            borderRadius: "8px",
                                            "& fieldset": {
                                                border: "1px solid #f0e0d0",
                                            },
                                            "&:hover fieldset": {
                                                borderColor: selectedStatus === 'approved' ? "#f0e0d0" : "#e0c0a0"
                                            },
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => handlePeerValidation('revised')}
                                    disabled={isSubmitting}
                                    sx={{
                                        color: '#ffffff',
                                        borderColor: '#d32f2f',
                                        textTransform: 'none',
                                        px: 3,
                                        py: 1,
                                        borderRadius: '4px',
                                        background: '#D4183D',
                                        width: '100%',
                                        '&:hover': {
                                            backgroundColor: '#b2102f',
                                            borderColor: '#b2102f',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: '#f5f5f5',
                                            color: '#9e9e9e'
                                        }
                                    }}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
                                </Button>
                                <Button
                                    variant={selectedStatus === 'approved' ? 'contained' : 'outlined'}
                                    onClick={() => handleStatusSelect('approved')}
                                    sx={{
                                        color: selectedStatus === 'approved' ? '#ffffff' : '#4caf50',
                                        borderColor: '#4caf50',
                                        backgroundColor: selectedStatus === 'approved' ? '#4caf50' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: selectedStatus === 'approved' ? '#388e3c' : 'rgba(76, 175, 80, 0.1)',
                                            borderColor: '#388e3c',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: '#f5f5f5',
                                            color: '#9e9e9e',
                                            borderColor: '#e0e0e0'
                                        },
                                        textTransform: 'none',
                                        px: 3,
                                        py: 1,
                                        borderRadius: '4px',
                                        width: '100%',
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmitQuestion}
                                    disabled={isSubmitting || !selectedStatus || (user?.role !== 'moderator' && selectedStatus === 'revised' && !revisedAnswer.trim())}
                                    sx={{
                                        mt: 2,
                                        px: 4,
                                        textTransform: "none",
                                        borderRadius: "8px",
                                        backgroundColor: "#00A63E",
                                        "&:hover": { backgroundColor: "#008c35" },
                                        "&.Mui-disabled": {
                                            backgroundColor: "#f5f5f5",
                                            color: "#9e9e9e"
                                        }
                                    }}
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : selectedStatus === 'approved' ? (
                                        'Submit Approval'
                                    ) : (
                                        'Submit Revision'
                                    )}
                                </Button>
                            </Box>
                    </Paper>
                    
                    </Box>
                    


            :
            <Box>
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

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', justifyContent: 'center' }}>
                <Box sx={{
                    flex: 1,
                    maxWidth: 800
                }}>

                    <Paper
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                            border: "1px solid #ddd",
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight="500"
                            sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                            📄 {task.question_text || 'No title available'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                                Type:{' '}
                                <span style={{ color: "#2B7FFF", fontWeight: 500 }}>
                                    {task.type==="Reject"?
                                    "Revise Answer"
                                    :
                                    task.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'
                                    }
                                    
                                </span>
                            </Typography>

                            <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                                • Consecutive Approvals: <span style={{
                                    color: task.consecutive_approvals > 0 ? '#00C950' : '#d32f2f',
                                    fontWeight: 500
                                }}>
                                    {task.consecutive_approvals || 0}
                                </span>
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#6d6d6d" }}>
                                • ID: <span style={{ fontFamily: 'monospace' }}>{task.question_id || 'N/A'}</span>
                            </Typography>
                        </Box>

                        {task.answer_preview && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Answer Preview:
                                </Typography>
                                <Typography variant="body1" sx={{ lineHeight: 1.6,maxHeight: 150,            // set height limit
                                overflowY: "auto",         // enable vertical scroll
                                 display: "block",
                                scrollbarWidth: "thin",}}>
                                    {task.answer_preview}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                    <MetaDataComponent/>
                    <SourceComponent/>

                    {task?.type === 'create_answer'||task?.type === 'Reject' ? (
                        <Paper
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 2,
                                top:20,
                                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                                border: "1px solid #ddd",
                            }}
                        >
                            {task.type==="Reject" && task.comments?
                            <Typography
                            variant="subtitle1"
                            fontWeight="500"
                            sx={{ mb: 2 }}
                        >
                           Comments
                            <TextField
                               
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                                value={task.comments}
                                 sx={{
                                    "& .MuiOutlinedInput-root": {
                                       
                                        borderRadius: "8px",
                                        "& fieldset": { border: "1px solid #f0e0d0" },
                                        "&:hover fieldset": { borderColor: "#e0c0a0" },
                                    },
                                }}
                            />
                        </Typography>
                        
                        
                        :
                        ''}
                        {task.KccAns?
                            <Typography
                            variant="subtitle1"
                            fontWeight="500"
                            sx={{ mb: 2 }}
                        >
                            KccAnswer
                            <TextField
                               
                                multiline
                                rows={5}
                                fullWidth
                                variant="outlined"
                                value={task.KccAns}
                                 sx={{
                                    "& .MuiOutlinedInput-root": {
                                       
                                        borderRadius: "8px",
                                        "& fieldset": { border: "1px solid #f0e0d0" },
                                        "&:hover fieldset": { borderColor: "#e0c0a0" },
                                    },
                                }}
                            />
                        </Typography>
                         :
                        ''}
                        

                            <Typography
                                variant="subtitle1"
                                fontWeight="500"
                                sx={{ mb: 2 }}
                            >
                                Write Your Answer
                            </Typography>

                            <TextField
                                placeholder="Write a detailed, accurate answer to this agricultural question. Include relevant information, best practices, and any important considerations..."
                                multiline
                                rows={5}
                                fullWidth
                                variant="outlined"
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        bgcolor: "#fff8f0",
                                        borderRadius: "8px",
                                        "& fieldset": { border: "1px solid #f0e0d0" },
                                        "&:hover fieldset": { borderColor: "#e0c0a0" },
                                    },
                                }}
                            />
                    {sources.map((sourceEle,ind)=>{
                        return(
                            <div key={ind}>
                            <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                          
                            <TextField
                                placeholder="Source name"
                                value={sourceEle.name}
                                onChange={(e) => handleChange(sourceEle.id, "name", e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                error={Boolean(sourceEle?.errorsList?.name)||false}
                                helperText={sourceEle?.errorsList?.name||null}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        bgcolor: "#fff8f0",
                                        borderRadius: "8px",
                                        "& fieldset": { border: "1px solid #f0e0d0" },
                                        "&:hover fieldset": { borderColor: "#e0c0a0" },
                                    },
                                }}
                            />
                            <TextField
                                placeholder="Source URL"
                                value={sourceEle.link}
                                onChange={(e) => {
                                    //const value = e.target.value;
                                    handleChange(sourceEle.id, "link", e.target.value);
                                    
                                  /*  if (!value.trim()) {
                                        setUrlError('');
                                    } else if (!isValidURL(value.trim(),sourceEle.id)) {
                                        setUrlError('Please enter a valid URL');
                                    } else {
                                        setUrlError('');
                                    }*/
                                }}
                                fullWidth
                                variant="outlined"
                                size="small"
                               error={Boolean(sourceEle?.errorsList?.link) || false}
                                helperText={sourceEle?.errorsList?.link|| ''}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        bgcolor: "#fff8f0",
                                        borderRadius: "8px",
                                        "& fieldset": { border: urlError ? "1px solid #d32f2f" : "1px solid #f0e0d0" },
                                        "&:hover fieldset": { borderColor: urlError ? "#d32f2f" : "#e0c0a0" },
                                    },
                                }}
                            />
                           
                             <button onClick={()=>addGroup(ind)}>+</button>
                             {sources.length > 1 && (
                            <button onClick={() => removeGroup(sourceEle.id)}>X </button> )}
                           
                        </Box>
                        
                        </div>
                        )
                    })}
                    
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmitAnswer}
                                    disabled={isSubmitting || !!urlError}
                                    sx={{
                                        mt: 2,
                                        px: 4,
                                        textTransform: "none",
                                        borderRadius: "8px",
                                        backgroundColor: "#00A63E",
                                        "&:hover": { backgroundColor: "#008c35" },
                                        "&.Mui-disabled": {
                                            backgroundColor: "#f5f5f5",
                                            color: "#9e9e9e"
                                        }
                                    }}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Answer'}
                                </Button>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                                border: "1px solid #ddd",
                            }}
                        >
                            {task.KccAns?
                            <Box>
                            <Typography sx={{ my: 2 }}>KccAns</Typography>
                            <Box>
                                <TextField
                                    placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "No changes needed for approval" : user?.role === 'moderator' ? "Answer text (read-only for moderators)" : "Edit the answer if needed (only for revisions)"}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    variant="outlined"
                                    value={task.KccAns}
                                   
                                    disabled={!selectedStatus || selectedStatus === 'approved' || user?.role === 'moderator'}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            bgcolor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f5f5f5" : "#fff8f0",
                                            borderRadius: "8px",
                                            "& fieldset": {
                                                border: "1px solid #f0e0d0",
                                            },
                                            "&:hover fieldset": {
                                                borderColor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f0e0d0" : "#e0c0a0"
                                            },
                                        },
                                    }}
                                />
                            </Box>
                            </Box>
                            :''}
                            <Typography sx={{ my: 2 }}>Answer</Typography>
                            <Box>
                                <TextField
                                    placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "No changes needed for approval" : user?.role === 'moderator' ? "Answer text (read-only for moderators)" : "Edit the answer if needed (only for revisions)"}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    variant="outlined"
                                    value={revisedAnswer}
                                    onChange={(e) => setRevisedAnswer(e.target.value)}
                                    disabled={!selectedStatus || selectedStatus === 'approved' || user?.role === 'moderator'}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            bgcolor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f5f5f5" : "#fff8f0",
                                            borderRadius: "8px",
                                            "& fieldset": {
                                                border: "1px solid #f0e0d0",
                                            },
                                            "&:hover fieldset": {
                                                borderColor: selectedStatus === 'approved' || user?.role === 'moderator' ? "#f0e0d0" : "#e0c0a0"
                                            },
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ my: 2 }}>
                                <Typography sx={{ my: 2 }}>Add comments</Typography>
                                <TextField
                                    placeholder={!selectedStatus ? "Select a status first" : selectedStatus === 'approved' ? "Comments (optional)" : "Please provide comments for rejection"}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    variant="outlined"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    disabled={!selectedStatus || selectedStatus === 'approved'}
                                    required={selectedStatus === 'revised'}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            bgcolor: selectedStatus === 'approved' ? "#f5f5f5" : "#fff8f0",
                                            borderRadius: "8px",
                                            "& fieldset": {
                                                border: "1px solid #f0e0d0",
                                            },
                                            "&:hover fieldset": {
                                                borderColor: selectedStatus === 'approved' ? "#f0e0d0" : "#e0c0a0"
                                            },
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => handlePeerValidation('revised')}
                                    disabled={isSubmitting}
                                    sx={{
                                        color: '#ffffff',
                                        borderColor: '#d32f2f',
                                        textTransform: 'none',
                                        px: 3,
                                        py: 1,
                                        borderRadius: '4px',
                                        background: '#D4183D',
                                        width: '100%',
                                        '&:hover': {
                                            backgroundColor: '#b2102f',
                                            borderColor: '#b2102f',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: '#f5f5f5',
                                            color: '#9e9e9e'
                                        }
                                    }}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
                                </Button>
                                <Button
                                    variant={selectedStatus === 'approved' ? 'contained' : 'outlined'}
                                    onClick={() => handleStatusSelect('approved')}
                                    sx={{
                                        color: selectedStatus === 'approved' ? '#ffffff' : '#4caf50',
                                        borderColor: '#4caf50',
                                        backgroundColor: selectedStatus === 'approved' ? '#4caf50' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: selectedStatus === 'approved' ? '#388e3c' : 'rgba(76, 175, 80, 0.1)',
                                            borderColor: '#388e3c',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: '#f5f5f5',
                                            color: '#9e9e9e',
                                            borderColor: '#e0e0e0'
                                        },
                                        textTransform: 'none',
                                        px: 3,
                                        py: 1,
                                        borderRadius: '4px',
                                        width: '100%',
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !selectedStatus || (user?.role !== 'moderator' && selectedStatus === 'revised' && !revisedAnswer.trim())}
                                    sx={{
                                        mt: 2,
                                        px: 4,
                                        textTransform: "none",
                                        borderRadius: "8px",
                                        backgroundColor: "#00A63E",
                                        "&:hover": { backgroundColor: "#008c35" },
                                        "&.Mui-disabled": {
                                            backgroundColor: "#f5f5f5",
                                            color: "#9e9e9e"
                                        }
                                    }}
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : selectedStatus === 'approved' ? (
                                        'Submit Approval'
                                    ) : (
                                        'Submit Revision'
                                    )}
                                </Button>
                            </Box>
                        </Paper>
                    )}
                </Box>
               
               
                {task?.type === 'create_answer' &&  task?.comments.length<=1 ?'':  (
                    <Box sx={{ width: 400, flexShrink: 0 }}>
                        <VersionHistoryComponent />
                    </Box>
                )}
                </Box>
            </Box>
}
        </Box>
    );
};

export default ReviewQueue;
