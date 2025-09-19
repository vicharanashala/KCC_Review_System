export const NotificationType = {
  QUESTION_ASSIGNED: 'question_assigned',
  PEER_REVIEW_REQUEST: 'peer_review_request',
  REVISION_NEEDED: 'revision_needed',
  VALIDATION_REQUEST: 'validation_request',
  READY_FOR_GOLDEN_FAQ: 'ready_for_golden_faq',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

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
