export type UserRole = 'student' | 'lecturer' | 'admin';

export type CertificateStatus =
  | 'pending'
  | 'processing'
  | 'ai_completed'
  | 'waiting_review'
  | 'approved'
  | 'rejected';

export interface Profile {
  id: string; // references auth.users.id
  full_name: string;
  email: string;
  role: UserRole;
  student_number: string | null;
  lecturer_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: CertificateStatus;
  title: string | null;
  organizer: string | null;
  category: string | null;
  event_date: string | null;
  duration_hours: number | null;
  certificate_number: string | null;
  final_weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateAIAnalysis {
  id: string;
  certificate_id: string;
  extracted_text: string | null;
  title: string | null;
  organizer: string | null;
  category: string | null;
  event_date: string | null;
  duration_hours: number | null;
  recommended_weight: number | null;
  confidence: number | null;
  reasoning: string | null;
  model_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateReview {
  id: string;
  certificate_id: string;
  lecturer_id: string;
  final_weight: number;
  status: 'approved' | 'rejected';
  note: string | null;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // 'info' | 'success' | 'error'
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface WeightRule {
  id: string;
  category: string;
  min_duration: number | null;
  max_duration: number | null;
  weight: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}
