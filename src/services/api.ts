import {
  User,
  FacultyWorkloadItem,
  WorkloadSummary,
  WorkloadRequest,
  Department,
  Course,
  TimetableSlot,
  NotificationItem,
  WorkloadSettings,
} from '../types/index.ts';

const TOKEN_KEY = 'faculty_overload_jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string; role: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () => request<{ user: User }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Workload summary & settings
  getWorkloadSummary: () => request<WorkloadSummary>('/api/workload/summary'),

  getWorkloadSettings: () => request<WorkloadSettings>('/api/workload/settings'),

  updateWorkloadSettings: (settings: WorkloadSettings) =>
    request<{ message: string }>('/api/workload/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Faculty
  getFacultyList: () => request<FacultyWorkloadItem[]>('/api/faculty'),

  createFaculty: (facultyData: any) =>
    request<{ message: string; faculty: any }>('/api/faculty', {
      method: 'POST',
      body: JSON.stringify(facultyData),
    }),

  updateFaculty: (id: number, data: any) =>
    request<{ message: string }>(`/api/faculty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFaculty: (id: number) =>
    request<{ message: string }>(`/api/faculty/${id}`, {
      method: 'DELETE',
    }),

  // Departments
  getDepartments: () => request<Department[]>('/api/departments'),

  createDepartment: (deptData: { departmentName: string; departmentCode: string }) =>
    request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(deptData),
    }),

  // Courses
  getCourses: () => request<Course[]>('/api/courses'),

  createCourse: (courseData: any) =>
    request<Course>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    }),

  updateCourse: (id: number, courseData: any) =>
    request<{ message: string }>(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    }),

  deleteCourse: (id: number) =>
    request<{ message: string }>(`/api/courses/${id}`, {
      method: 'DELETE',
    }),

  // Course Assignments
  assignCourse: (facultyId: number, courseId: number) =>
    request<{ message: string }>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify({ facultyId, courseId }),
    }),

  unassignCourse: (facultyId: number, courseId: number) =>
    request<{ message: string }>(`/api/assignments/${facultyId}/${courseId}`, {
      method: 'DELETE',
    }),

  reassignCourse: (sourceFacultyId: number, targetFacultyId: number, courseId: number) =>
    request<{ message: string }>('/api/assignments/reassign', {
      method: 'POST',
      body: JSON.stringify({ sourceFacultyId, targetFacultyId, courseId }),
    }),

  // DSA APIs
  getSortedFaculty: (key: string, order: string, algorithm: string) =>
    request<any>(`/api/dsa/sort?key=${key}&order=${order}&algorithm=${algorithm}`),

  getPriorityQueue: () => request<any>('/api/dsa/priority-queue'),

  getGreedyBalancerSimulation: () => request<any>('/api/dsa/greedy-balancer'),

  applyBalancerRecommendation: (recommendation: {
    sourceFacultyId: number;
    targetFacultyId: number;
    courseId: number;
  }) =>
    request<{ message: string }>('/api/dsa/greedy-balancer/apply', {
      method: 'POST',
      body: JSON.stringify(recommendation),
    }),

  getAcademicGraph: () => request<any>('/api/dsa/graph'),

  getHashTableData: () => request<any>('/api/dsa/hash-table'),

  getRequestQueueData: () => request<any>('/api/dsa/request-queue'),

  // Requests
  getRequests: () => request<WorkloadRequest[]>('/api/requests'),

  createRequest: (reqData: {
    requestType: string;
    courseId?: number | null;
    targetFacultyId?: number | null;
    description: string;
    priority?: number;
  }) =>
    request<WorkloadRequest>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(reqData),
    }),

  updateRequestStatus: (
    id: number,
    status: 'Approved' | 'Rejected',
    adminRemarks?: string,
    autoApplyReassignment?: boolean
  ) =>
    request<{ message: string }>(`/api/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminRemarks, autoApplyReassignment }),
    }),

  // Timetable
  getTimetable: (facultyId?: number) =>
    request<TimetableSlot[]>(facultyId ? `/api/timetable?facultyId=${facultyId}` : '/api/timetable'),

  createTimetableSlot: (slot: {
    facultyId: number;
    courseId: number;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  }) =>
    request<TimetableSlot>('/api/timetable', {
      method: 'POST',
      body: JSON.stringify(slot),
    }),

  deleteTimetableSlot: (id: number) =>
    request<{ message: string }>(`/api/timetable/${id}`, {
      method: 'DELETE',
    }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/api/notifications'),

  markNotificationRead: (id: number) =>
    request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/api/notifications/mark-all-read', {
      method: 'POST',
    }),

  // Chatbot
  sendChatMessage: (query: string) =>
    request<{ reply: string }>('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};
