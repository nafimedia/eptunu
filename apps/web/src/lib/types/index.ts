export type SectionType = 'LISTENING' | 'STRUCTURE' | 'READING';

export type ExamStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'SUBMITTED' | 'FORCE_SUBMITTED' | 'EXPIRED';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN_EPT'
  | 'QUESTION_AUTHOR'
  | 'VALIDATOR'
  | 'PROCTOR'
  | 'STUDENT'
  | 'EXECUTIVE'
  | 'ADMIN'
  | 'EXAMINER'
  | 'GUEST';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  [key: string]: any;
}

export interface User {
  id: string;
  identityNumber: string;
  fullName: string;
  email: string;
  role: UserRole;
  prodi?: string | null;
  faculty?: string | null;

  // Legacy compatibility fields
  name?: string;
  avatarUrl?: string | null;
  permissions?: string[];
  createdAt?: string | Date;
  isSystem?: boolean;
  isActive?: boolean;
  roleId?: string;
}

export interface Passage {
  id: string;
  title?: string | null;
  content: string;
}

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  section: SectionType;
  questionText: string;
  audioUrl?: string | null;
  options: QuestionOption[];
  skillTag?: string | null;
  passage?: Passage | null;
}

export interface AnswerState {
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isFlagged: boolean;
}

export interface StudentExamSession {
  studentExamId: string;
  status: ExamStatus;
  startedAt: string;
  durationMin: number;
  sessionTitle: string;
  existingAnswers: Array<{
    questionId: string;
    selectedOption: 'A' | 'B' | 'C' | 'D' | null;
    isFlagged: boolean;
  }>;
  questions: Question[];
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string | Date;
  user?: { id: string; name: string; email: string };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string | Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
  description?: string;
}
