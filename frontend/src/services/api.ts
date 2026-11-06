import axios from 'axios';
import type { Complaint, CreateComplaintInput, UserRole, DuplicateCandidate, DuplicateCheckRequest, ComplaintStatus } from '../types';

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    departmentName?: string;
  };
}

// Axios instance uses relative /api path so Vite reverse proxy forwards to Spring Boot port 8081
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT Bearer token to all requests if present in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicfix_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  if (res.data.token) {
    localStorage.setItem('civicfix_token', res.data.token);
  }
  return res.data;
};

export const getCurrentUser = async (): Promise<AuthResponse['user']> => {
  const res = await apiClient.get<AuthResponse['user']>('/auth/me');
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem('civicfix_token');
};

// Complaint Services
export const getComplaints = async (): Promise<Complaint[]> => {
  const res = await apiClient.get<Complaint[]>('/complaints');
  return res.data;
};

export const getComplaintById = async (id: string): Promise<Complaint> => {
  const res = await apiClient.get<Complaint>(`/complaints/${id}`);
  return res.data;
};

export const getPublicComplaint = async (complaintId: string): Promise<Complaint> => {
  const res = await apiClient.get<Complaint>(`/public/complaints/${complaintId}`);
  return res.data;
};

export const createComplaint = async (input: CreateComplaintInput): Promise<Complaint> => {
  const res = await apiClient.post<Complaint>('/complaints', input);
  return res.data;
};

export const upvoteComplaint = async (id: string, isAdd: boolean = true): Promise<Complaint> => {
  const res = await apiClient.post<Complaint>(`/complaints/${id}/upvote?isAdd=${isAdd}`);
  return res.data;
};

// Phase 11 Resolution Verification Gate & Status Transition
export const transitionComplaintStatus = async (
  id: string,
  targetStatus: ComplaintStatus,
  notes?: string,
  resolutionPhotoUrl?: string,
  disputeReason?: string
): Promise<Complaint> => {
  const res = await apiClient.post<Complaint>(`/complaints/${id}/transition-status`, {
    targetStatus,
    notes,
    resolutionPhotoUrl,
    disputeReason,
  });
  return res.data;
};

export const uploadComplaintImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<{ imageUrl: string }>('/complaints/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.imageUrl;
};

import type { AiImageAnalysisResult, AiVoiceTranscriptionResult, AiStatusResult } from '../types';

export const analyzeImageWithAi = async (file?: File, hint?: string): Promise<AiImageAnalysisResult> => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (hint) formData.append('hint', hint);
  const res = await apiClient.post<AiImageAnalysisResult>('/ai/analyze-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const transcribeVoiceWithAi = async (audioBlob?: Blob, language: string = 'odia'): Promise<AiVoiceTranscriptionResult> => {
  const formData = new FormData();
  if (audioBlob) formData.append('audio', audioBlob, 'voice.webm');
  formData.append('language', language);
  const res = await apiClient.post<AiVoiceTranscriptionResult>('/ai/transcribe-voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getAiStatus = async (): Promise<AiStatusResult> => {
  const res = await apiClient.get<AiStatusResult>('/ai/status');
  return res.data;
};

// Spatial Duplicate Radar (Phase 9)
export const checkDuplicateRadar = async (req: DuplicateCheckRequest): Promise<DuplicateCandidate[]> => {
  const res = await apiClient.post<DuplicateCandidate[]>('/complaints/duplicates/radar', req);
  return res.data;
};

export const linkDuplicateComplaint = async (childId: string, parentId: string, clusterId?: string): Promise<Complaint> => {
  const params = new URLSearchParams({ childId, parentId });
  if (clusterId) params.append('clusterId', clusterId);
  const res = await apiClient.post<Complaint>(`/complaints/duplicates/link?${params.toString()}`);
  return res.data;
};

