export type ComplaintCategory =
  | 'ROAD_DAMAGE'
  | 'GARBAGE_WASTE'
  | 'STREETLIGHT'
  | 'DRAINAGE'
  | 'WATER_SUPPLY';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WORK_COMPLETED'
  | 'AWAITING_VERIFICATION'
  | 'VERIFIED_RESOLVED'
  | 'REOPENED_DISPUTED';

export type UrgencyLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type LocationConfidence =
  | 'HIGH_EXACT_GPS'
  | 'LANDMARK_RESOLVED'
  | 'LOW_VAGUE_TRIAGE';

export type UserRole = 'CITIZEN' | 'ADMIN' | 'WORKER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface Complaint {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  urgency: UrgencyLevel;
  priorityScore: number;
  priorityBreakdownJson?: string | null;
  priorityOverrideReason?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  addressText: string;
  city?: string;
  ward?: string;
  locationConfidence?: LocationConfidence;
  imageUrl?: string | null;
  resolutionImageUrl?: string | null;
  resolutionNotes?: string | null;
  disputeReason?: string | null;
  audioUrl?: string | null;
  originalLanguageText?: string | null;
  detectedLanguage?: string | null;
  upvoteCount: number;
  slaHours: number;
  slaDeadline: string;
  isOverdue?: boolean;
  overdue?: boolean;
  isDuplicate?: boolean;
  duplicate?: boolean;
  duplicateGroupId?: string | null;
  departmentName?: string;
  assignedWorkerName?: string;
  reporterName?: string;
  citizenRating?: number | null;
  reviewTag?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  addressText: string;
  city?: string;
  ward?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationConfidence?: LocationConfidence;
  imageUrl?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  read: boolean;
  type: 'approval' | 'assignment' | 'completion' | 'urgent';
}

export interface ContractorTask {
  id: string;
  title: string;
  category: ComplaintCategory;
  location: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  status: 'OPEN_TENDER' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  deadline: string;
  budgetEst?: string;
}

export interface AiImageAnalysisResult {
  category: ComplaintCategory;
  severity: number;
  suggestedTitle: string;
  suggestedDescription: string;
  safetyHazards: string[];
  confidenceScore: number;
  reasoning: string;
  aiAssisted: boolean;
  fallback: boolean;
}

export interface AiVoiceTranscriptionResult {
  originalLanguage: string;
  originalText: string;
  englishTranslation: string;
  suggestedCategory: ComplaintCategory;
  suggestedTitle: string;
  locationClues: string;
  urgency: UrgencyLevel;
  confidenceScore: number;
  aiAssisted: boolean;
  fallback: boolean;
}

export interface AiStatusResult {
  provider: string;
  model: string;
  isLiveApiKeyConfigured: boolean;
  mode: string;
  supportedLanguages: string[];
  supportedCategories: string[];
}

export interface DuplicateCandidate {
  id: string;
  complaintId: string;
  title: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  distanceMeters: number;
  similarityScore: number;
  upvoteCount: number;
  addressText: string;
  duplicateGroupId?: string | null;
}

export interface DuplicateCheckRequest {
  category: ComplaintCategory;
  latitude: number;
  longitude: number;
  title: string;
}

export interface PriorityBreakdown {
  severity: number;
  publicSafety: number;
  peopleAffected: number;
  duration: number;
  confirmations: number;
  totalScore: number;
  urgency: UrgencyLevel;
  targetSlaHours: number;
  rationale?: string;
}


export interface StatusLogEntry {
  id: string;
  complaintId: string;
  fromStatus?: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  remarks?: string | null;
  changedByName?: string | null;
  changedByRole?: string | null;
  createdAt: string;
}

export interface CivicMetricsSummary {
  totalComplaints: number;
  activeComplaints: number;
  resolvedComplaints: number;
  overdueComplaints: number;
  averageResolutionHours: number;
  citizenSatisfactionAverage: number;
  ratedCount: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}
