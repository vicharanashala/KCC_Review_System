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
}

export enum ValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
}

export enum PeerStatus {
  APPROVED = 'approved',
  REVISED = 'revised',
}

export enum NotificationType {
  QUESTION_ASSIGNED = 'question_assigned', 
  PEER_REVIEW_REQUEST = 'peer_review_request',
  REVISION_NEEDED = 'revision_needed',
  VALIDATION_REQUEST = 'validation_request',
  READY_FOR_GOLDEN_FAQ = 'ready_for_golden_faq',
}
export enum Location{
POINT="Point"
}