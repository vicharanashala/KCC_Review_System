export enum UserRole {
  AGRI_SPECIALIST = 'agri_specialist',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum QuestionStatus {
  PENDING_ASSIGNMENT = 'pending_assignment',
  ASSIGNED_TO_SPECIALIST = 'assigned_to_specialist',
  PENDING_PEER_REVIEW = 'pending_peer_review',
  PENDING_MODERATION = 'pending_moderation',
  NEEDS_REVISION = 'needs_revision',
  READY_FOR_GOLDEN_FAQ = 'ready_for_golden_faq',
  GOLDEN_FAQ_CREATED = 'golden_faq_created',
  ASSIGNED_TO_MODERATION = 'assigned_to_moderation',
  PENDING_PEER_MODERATION_REVIEW = 'pending_peer_moderation_review',
  approved = 'approved',
  revised = 'revised',
  QUESTION_REJECTED='question_rejected',
  QUESTION_SENDBACK_TO_OWNER='question_sendback_to_owner',
  QUESTION_CORRECTED="question_corrected"
}

export enum ValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
}

export enum PeerStatus {
  APPROVED = 'approved',
  REVISED = 'revised',
  CREATE='assigned_to_moderation',
  ASSIGNED_TO_MODERATION = 'assigned_to_moderation',
  PENDING_PEER_MODERATION_REVIEW = 'pending_peer_moderation_review',
  QUESTION_REJECTED='question_rejected',
  QUESTION_SENDBACK_TO_OWNER='question_sendback_to_owner'
}

export enum NotificationType {
  QUESTION_ASSIGNED = 'question_assigned', 
  PEER_REVIEW_REQUEST = 'peer_review_request',
  REVISION_NEEDED = 'revision_needed',
  VALIDATION_REQUEST = 'validation_request',
  READY_FOR_GOLDEN_FAQ = 'ready_for_golden_faq',
  QUESTION_VALIDATION='question_validation',
  QUESTION_REJECTED='question_rejected',
  QUESTION_VALIDATION_SUCCESS='question_validation_success',
  QUESTION_REVISION_SUCCESS='question_revision_success'

}
export enum Location{
POINT="Point"
}