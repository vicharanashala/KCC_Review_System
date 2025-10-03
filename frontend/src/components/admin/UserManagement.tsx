import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  TablePagination,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button
} from "@mui/material";

export interface IUser {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  workload_count: number;
  incentive_points: number;
  isEditing: boolean;
  backup: {
    name: string;
    email: string;
  };
}
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const fetchUsers = async ({
  page,
  rowsPerPage,
  role,
  search,
}: {
  page: number;
  rowsPerPage: number;
  role: string;
  search: string;
}): Promise<{ users: IUser[]; total: number }> => {
  const token = localStorage.getItem("access_token");
  const skip = page * rowsPerPage;

  const res = await fetch(
    `${API_BASE_URL}/admin/users?skip=${skip}&limit=${rowsPerPage}&role=${role}&search=${search}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch users");

  return res.json();
};

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState<IUser[]>([]);
  
  


  const roleOptions = ["all", "moderator", "agri_specialist"];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", page, rowsPerPage, role, search],
    queryFn: () => fetchUsers({ page, rowsPerPage, role, search }),
    keepPreviousData: true,
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  useEffect(()=>{
    if(data?.users)
    {
      const userwithEditField=data.users.map((userData)=>(
       {...userData,isEditing:false,backup:{...userData}} 
      ))
      setUsersList(userwithEditField)
      console.log("the userList coming===",usersList)
    }
//console.log("the userList coming===",usersList)

  },[data])
  const handleChange = (e) => {
   // setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const toggleEdit = async (index:number) => {
    const user=usersList[index]
   
    if (user.isEditing) 
    {
      
    }
    else{
     // console.log()
      const newUser=[...usersList]
      
      newUser[index].isEditing=true
     // setIsEditing(false)
     setUsersList(newUser)
     //console.log("the user coming===",newUser)
    }
  };

  if (isLoading) return <CircularProgress />;
  if (isError)
    return <Typography color="error">Failed to load users.</Typography>;

  return (
    <Paper>
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

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="role-filter-label">Filter by Role</InputLabel>
          <Select
            labelId="role-filter-label"
            value={role}
            label="Filter by Role"
            onChange={(e) => setRole(e.target.value)}
          >
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r === "all"
                  ? "All Roles"
                  : r.charAt(0).toUpperCase() + r.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Sl.No</strong>
              </TableCell>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Email</strong>
              </TableCell>
              <TableCell>
                <strong>Role</strong>
              </TableCell>
              <TableCell>
                <strong>Incentive</strong>
              </TableCell>
              <TableCell>
                <strong>Work Load</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Created At</strong>
              </TableCell>
              <TableCell>
                Edit/save
                </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersList.map((user, index) => (
              <TableRow key={user._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.incentive_points}</TableCell>
                <TableCell>{user.workload_count}</TableCell>
                <TableCell>
                  {user.is_active ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      Active
                    </span>
                  ) : (
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                <Button
                onClick={()=>toggleEdit(index)}
              disabled={loading}
                 >
        {user.isEditing ?"Save":"Edit"}
      </Button>
      </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
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

export default UserManagement;
