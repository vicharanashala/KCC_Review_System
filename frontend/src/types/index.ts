export interface Question {
  id: string;
  crop: string;
  state: string;
  district: string;
  originalQuery: string;
  season: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending_assignment' | 'in_review' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  submittedBy?: string;
  assignedTo?: string[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  questionId: string;
  reviewerId: string;
  status: 'approved' | 'rejected' | 'pending';
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'agri_specialist';
  createdAt: string;
  updatedAt: string;
}
