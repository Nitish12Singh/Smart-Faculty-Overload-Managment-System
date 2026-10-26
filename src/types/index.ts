export type Role = 'admin' | 'faculty' | 'hod';

export interface User {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: number | null;
  facultyId?: number | null;
  facultyProfile?: FacultyProfile | null;
}

export interface FacultyProfile {
  id: number;
  userId: number;
  facultyCode: string;
  designation: string;
  specialization: string;
  maxWorkload: number;
}

export interface Department {
  id: number;
  departmentName: string;
  departmentCode: string;
}

export interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  departmentId: number;
  departmentName?: string;
  departmentCode?: string;
  credits: number;
  courseType: string;
  lectureHours: number;
  labHours: number;
  tutorialHours: number;
  requiredSpecialization?: string | null;
  semester: string;
  workloadUnits?: number;
  assignedFaculty?: Array<{
    facultyId: number;
    facultyName: string;
    facultyCode: string;
  }>;
}

export interface FacultyWorkloadItem {
  facultyId: number;
  facultyCode: string;
  userId: number;
  name: string;
  email: string;
  designation: string;
  specialization: string;
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  teachingHours: number;
  labHours: number;
  tutorialHours: number;
  totalWorkload: number;
  maxWorkload: number;
  workloadPercentage: number;
  overloadAmount: number;
  status: 'Underload' | 'Normal' | 'Near Limit' | 'Overloaded';
  courseCount: number;
  courses: Array<{
    courseId: number;
    courseCode: string;
    courseName: string;
    departmentId: number;
    courseType: string;
    workloadUnits: number;
    lectureHours: number;
    labHours: number;
    tutorialHours: number;
    requiredSpecialization?: string | null;
  }>;
  pendingRequestsCount: number;
}

export interface WorkloadSummary {
  totalFaculty: number;
  totalDepartments: number;
  totalCourses: number;
  normalFaculty: number;
  overloadFaculty: number;
  underloadFaculty: number;
  totalTeachingHours: number;
  totalWorkloadUnits: number;
  pendingRequestsCount: number;
}

export interface WorkloadRequest {
  id: number;
  facultyId: number;
  facultyName: string;
  facultyCode: string;
  departmentName?: string;
  requestType: 'Reduction' | 'Course Reassignment' | 'Exemption';
  courseId?: number | null;
  courseName?: string | null;
  courseCode?: string | null;
  targetFacultyId?: number | null;
  targetFacultyName?: string | null;
  description: string;
  priority: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  adminRemarks?: string | null;
  createdAt: string;
}

export interface TimetableSlot {
  id: number;
  facultyId: number;
  facultyName: string;
  courseId: number;
  courseName: string;
  courseCode: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface WorkloadSettings {
  lectureWeight: number;
  labWeight: number;
  tutorialWeight: number;
  maxNormalThreshold: number;
  warningThreshold: number;
}
