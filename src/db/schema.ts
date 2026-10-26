import { pgTable, serial, text, integer, timestamp, boolean, real, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Departments table
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  departmentName: text('department_name').notNull(),
  departmentCode: text('department_code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Users table (Admin, Faculty, HOD)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'faculty' | 'hod'
  departmentId: integer('department_id').references(() => departments.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_role').on(table.role),
  index('idx_users_dept').on(table.departmentId),
]);

// 3. Faculty details table
export const faculty = pgTable('faculty', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  facultyCode: text('faculty_code').notNull().unique(),
  designation: text('designation').notNull(),
  specialization: text('specialization').notNull(),
  maxWorkload: integer('max_workload').notNull().default(18),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_faculty_user').on(table.userId),
  index('idx_faculty_code').on(table.facultyCode),
]);

// 4. Courses table
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  courseCode: text('course_code').notNull().unique(),
  courseName: text('course_name').notNull(),
  departmentId: integer('department_id').references(() => departments.id).notNull(),
  credits: integer('credits').notNull().default(3),
  courseType: text('course_type').notNull().default('Theory'), // Theory, Lab, Tutorial
  lectureHours: integer('lecture_hours').notNull().default(3),
  labHours: integer('lab_hours').notNull().default(0),
  tutorialHours: integer('tutorial_hours').notNull().default(0),
  requiredSpecialization: text('required_specialization'),
  semester: text('semester').notNull().default('Fall 2026'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_courses_dept').on(table.departmentId),
  index('idx_courses_code').on(table.courseCode),
]);

// 5. Faculty Course Assignments table
export const facultyCourses = pgTable('faculty_courses', {
  id: serial('id').primaryKey(),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  semester: text('semester').notNull().default('Fall 2026'),
  academicYear: text('academic_year').notNull().default('2026-2027'),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (table) => [
  index('idx_fc_faculty').on(table.facultyId),
  index('idx_fc_course').on(table.courseId),
]);

// 6. Workload stats table
export const workload = pgTable('workload', {
  id: serial('id').primaryKey(),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull().unique(),
  teachingHours: real('teaching_hours').notNull().default(0),
  labHours: real('lab_hours').notNull().default(0),
  tutorialHours: real('tutorial_hours').notNull().default(0),
  otherHours: real('other_hours').notNull().default(0),
  totalWorkload: real('total_workload').notNull().default(0),
  workloadPercentage: real('workload_percentage').notNull().default(0),
  status: text('status').notNull().default('Normal'), // 'Underload' | 'Normal' | 'Near Limit' | 'Overloaded'
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_workload_faculty').on(table.facultyId),
]);

// 7. Workload Requests table
export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull(),
  requestType: text('request_type').notNull(), // 'Reduction' | 'Course Reassignment' | 'Exemption'
  courseId: integer('course_id').references(() => courses.id),
  targetFacultyId: integer('target_faculty_id').references(() => faculty.id),
  description: text('description').notNull(),
  priority: integer('priority').notNull().default(1), // 1 to 5 for Max Heap / Priority Queue
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Approved' | 'Rejected'
  adminRemarks: text('admin_remarks'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_requests_faculty').on(table.facultyId),
  index('idx_requests_status').on(table.status),
]);

// 8. Timetable table
export const timetable = pgTable('timetable', {
  id: serial('id').primaryKey(),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  day: text('day').notNull(), // Monday, Tuesday, Wednesday, Thursday, Friday
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  room: text('room').notNull(),
}, (table) => [
  index('idx_timetable_faculty').on(table.facultyId),
  index('idx_timetable_course').on(table.courseId),
]);

// 9. Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // 'assignment' | 'overload' | 'approval' | 'rejection' | 'optimization' | 'message'
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_notifications_user').on(table.userId),
]);

// 10. System workload configuration
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  lectureWeight: real('lecture_weight').notNull().default(1.0),
  labWeight: real('lab_weight').notNull().default(1.5),
  tutorialWeight: real('tutorial_weight').notNull().default(1.0),
  maxNormalThreshold: real('max_normal_threshold').notNull().default(18.0),
  warningThreshold: real('warning_threshold').notNull().default(16.0),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  facultyProfile: one(faculty, {
    fields: [users.id],
    references: [faculty.userId],
  }),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  courses: many(courses),
}));

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  user: one(users, {
    fields: [faculty.userId],
    references: [users.id],
  }),
  facultyCourses: many(facultyCourses),
  workload: one(workload, {
    fields: [faculty.id],
    references: [workload.facultyId],
  }),
  requests: many(requests),
  timetable: many(timetable),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  department: one(departments, {
    fields: [courses.departmentId],
    references: [departments.id],
  }),
  facultyCourses: many(facultyCourses),
  timetable: many(timetable),
}));

export const facultyCoursesRelations = relations(facultyCourses, ({ one }) => ({
  faculty: one(faculty, {
    fields: [facultyCourses.facultyId],
    references: [faculty.id],
  }),
  course: one(courses, {
    fields: [facultyCourses.courseId],
    references: [courses.id],
  }),
}));
