// ── API wrapper ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

// ── Auth ──────────────────────────────────────────────────
export interface AuthUser {
  userId: string;
  email: string;
  role: "teacher" | "school" | "admin";
  firstName: string | null;
  lastName: string | null;
  schoolName: string | null;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
}

// ── Stats ─────────────────────────────────────────────────
export interface PlatformStats {
  teachers: {
    draft?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
    suspended?: number;
  };
  schools: {
    draft?: number;
    pending?: number;
    verified?: number;
    rejected?: number;
    suspended?: number;
  };
}

// ── Teacher ───────────────────────────────────────────────
export interface TeacherProfile {
  _id: string;
  uuid: string;
  // userId may be a populated User object on the detail endpoint (getTeacher),
  // or a plain ObjectId string on list/activity endpoints. Type as a union.
  userId: string | {
    _id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    createdAt?: string;
  };
  personal: {
    fullNameAr?: string;
    fullNameEn?: string;
    nationalId?: string;
    gender?: "male" | "female";
    nationality?: string;
    photoUrl?: string;
    whatsapp?: string;
  };
  professional: {
    subjects: string[];
    gradeLevels: string[];
    experienceRange?: string;
    employmentStatus?: string;
    noticePeriodDays?: number;
  };
  education: {
    degreeType?: string;
    major?: string;
    university?: string;
    graduationYear?: number;
    country?: string;
    certificateUrl?: string;
  };
  certifications: {
    _id?: string;
    name: string;
    issuer: string;
    fileUrl?: string;
  }[];
  languages: {
    language: string;
    proficiency: string;
  }[];
  locationPreferences: {
    preferredCities: string[];
    willingToRelocate: boolean;
  };
  salaryExpectations: {
    minMonthlySAR?: number;
    maxMonthlySAR?: number;
    contractTypes: string[];
  };
  resume: {
    fileUrl?: string;
    originalName?: string;
  };
  profileStatus: "draft" | "pending" | "approved" | "rejected" | "suspended";
  completionPercentage: number;
  adminNotes?: string;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherListResponse {
  teachers: TeacherProfile[];
  total: number;
}

// ── School ────────────────────────────────────────────────
export interface SchoolProfile {
  _id: string;
  userId: string;
  nameAr: string;
  nameEn: string;
  type: "government" | "private" | "international" | "ahli";
  educationLevel: string;
  gender: "male" | "female" | "mixed";
  city: string;
  district?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  foundedYear?: number;
  studentsCount?: string;
  logoUrl?: string;
  adminContact?: {
    name: string;
    jobTitle: string;
    phone: string;
    email: string;
  };
  documents: {
    commercialRegistration?: { url: string; uploadedAt: string };
    ministryLicense?: { url: string; uploadedAt: string };
  };
  profileStatus: "draft" | "pending" | "verified" | "rejected" | "suspended";
  completionPercentage: number;
  rejectionReason?: string;
  adminNotes?: string;
  submittedAt?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolListResponse {
  schools: SchoolProfile[];
  total: number;
}

// ── Interviews ────────────────────────────────────────────
export type InterviewType   = 'in_person' | 'video' | 'phone' | 'abjad_coordinated';
export type InterviewStatus = 'pending' | 'accepted' | 'declined' | 'rescheduled' | 'completed' | 'cancelled';

export interface AdminInterview {
  _id: string;
  applicationId: string;
  jobId:     { _id: string; title: string; city: string; subjects: string[] } | string;
  teacherId: { _id: string; email: string; firstName?: string; lastName?: string } | string;
  schoolId:  { _id: string; email: string; schoolName?: string } | string;
  type: InterviewType;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  interviewers: { name: string; email?: string }[];
  instructions?: string;
  status: InterviewStatus;
  teacherResponse?: {
    action: 'accepted' | 'declined' | 'reschedule_requested';
    reason?: string;
    proposedTime?: string;
    respondedAt: string;
  };
  feedback?: {
    rating: number;
    strengths?: string;
    weaknesses?: string;
    recommendation: 'hire' | 'maybe' | 'reject';
    notes?: string;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminInterviewListResponse {
  interviews: AdminInterview[];
  total: number;
}

// ── Applications ──────────────────────────────────────────
export type ApplicationStatus =
  | 'submitted' | 'reviewing' | 'shortlisted'
  | 'interview_scheduled' | 'offer_extended'
  | 'hired' | 'rejected' | 'withdrawn';

export interface AdminApplication {
  _id: string;
  referenceNumber: string;
  jobId: { _id: string; title: string; city: string; subjects: string[] } | string;
  teacherId: { _id: string; email: string; firstName?: string; lastName?: string } | string;
  teacherProfileId: {
    _id: string;
    personal?: { fullNameEn?: string; fullNameAr?: string };
    professional?: { subjects?: string[] };
  } | string;
  schoolId: { _id: string; email: string; schoolName?: string } | string;
  status: ApplicationStatus;
  matchScore?: number;
  coverLetter?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminApplicationListResponse {
  applications: AdminApplication[];
  total: number;
}

// ── Support Tickets ────────────────────────────────────────
export interface AdminTicketMessage {
  senderId: string;
  senderRole: "teacher" | "school" | "admin";
  content: string;
  timestamp: string;
}

export interface AdminTicket {
  _id: string;
  ticketNumber: string;
  userId: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    schoolName?: string;
    role: string;
  } | string;
  userRole: "teacher" | "school";
  category: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  messages: AdminTicketMessage[];
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTicketListResponse {
  tickets: AdminTicket[];
  total: number;
}

// ── Jobs (Content Moderation) ─────────────────────────────
export interface AdminJob {
  _id: string;
  uuid: string;
  schoolId: string;
  title: string;
  subjects: string[];
  city: string;
  employmentType: string;
  status: "active" | "closed" | "expired" | "draft";
  applicationsCount: number;
  viewsCount: number;
  isAnonymous: boolean;
  createdAt: string;
  deadline?: string;
}

export interface AdminJobListResponse {
  jobs: AdminJob[];
  total: number;
}

// ── Activity ───────────────────────────────────────────────
export interface ActivityApplication {
  _id: string;
  referenceNumber?: string;
  status: string;
  jobId?: { _id: string; title: string; city?: string } | string | null;
  schoolId?: { _id: string; schoolName?: string } | string | null;
  teacherId?: { _id: string; firstName?: string; lastName?: string; email?: string } | string | null;
  teacherProfileId?: { _id: string; personal?: { fullNameEn?: string; fullNameAr?: string } } | string | null;
  createdAt: string;
}

export interface ActivityInterview {
  _id: string;
  type?: string;
  status: string;
  scheduledAt: string;
  jobId?: { _id: string; title: string } | string | null;
  schoolId?: { _id: string; schoolName?: string } | string | null;
  teacherId?: { _id: string; firstName?: string; lastName?: string; email?: string } | string | null;
  createdAt: string;
}

export interface ActivityOffer {
  _id: string;
  status: string;
  jobId?: { _id: string; title: string } | string | null;
  schoolId?: { _id: string; schoolName?: string } | string | null;
  teacherId?: { _id: string; firstName?: string; lastName?: string; email?: string } | string | null;
  createdAt: string;
}

export interface ActivityJob {
  _id: string;
  title: string;
  status: string;
  city?: string;
  subjects?: string[];
  applicationsCount?: number;
  createdAt: string;
}

export interface TeacherActivity {
  applications: ActivityApplication[];
  interviews: ActivityInterview[];
  offers: ActivityOffer[];
}

export interface SchoolActivity {
  jobs: ActivityJob[];
  applications: ActivityApplication[];
  interviews: ActivityInterview[];
  offers: ActivityOffer[];
}

// ── Report Preview ─────────────────────────────────────────
export interface AdminReportPreview {
  total: number;
  rows: Record<string, string>[];
}

// ── Reports ────────────────────────────────────────────────
export interface AdminReportsData {
  schools:      Record<string, number>;
  teachers:     Record<string, number>;
  applications: Record<string, number>;
  jobs:         Record<string, number>;
  hiringFunnel: {
    total: number;
    reviewing: number;
    shortlisted: number;
    interviewed: number;
    offered: number;
    hired: number;
  };
  teacherTrend:     Array<{ month: string; count: number }>;
  applicationTrend: Array<{ month: string; count: number }>;
}
