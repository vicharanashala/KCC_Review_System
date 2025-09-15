import { UserRole, QuestionStatus, ValidationStatus, PeerStatus, NotificationType } from './enums';

export interface UserCreateDto {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
  specialization?: string[];
}

export interface UserResponseDto {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  workload_count: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface QuestionCreateDto {
  crop?: string;
  state?: string;
  district?: string;
  block_name?: string;
  query_type?: string;
  season?: string;
  sector?: string;
  original_query_text: string;
  refined_query_text?: string;
  latitude?: string;
  longitude?: string;
  priority?: string;
}

export interface QuestionResponseDto {
  question_id: string;
  original_query_text: string;
  status: QuestionStatus;
  assigned_specialist?: string;
  valid_count: number;
  consecutive_peer_approvals: number;
  created_at: Date;
}

export interface AnswerCreateDto {
  question_id: string;
  answer_text: string;
  sources: { name: string; link: string }[];
}

export interface ValidationCreateDto {
  answer_id: string;
  validation_status: ValidationStatus;
  comments?: string;
}

export interface PeerValidateCreateDto {
  answer_id: string;
  status: PeerStatus;
  comments?: string;
  revised_answer_text?: string;
}

export interface GoldenFAQCreateDto {
  question_id: string;
  final_answer_text: string;
  category?: string;
  tags?: string[];
}