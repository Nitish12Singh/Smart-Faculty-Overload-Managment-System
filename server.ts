import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';

import { db } from './src/db/index.ts';
import {
  users,
  faculty,
  departments,
  courses,
  facultyCourses,
  workload,
  requests,
  timetable,
  notifications,
  systemSettings,
} from './src/db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/services/seedData.ts';
import {
  getAllFacultyWorkloadData,
  calculateAndPersistWorkload,
  getSystemSettings,
  getSortedFaculty,
  getPriorityFacultyQueue,
  runWorkloadBalancerSimulation,
  getAcademicRelationshipGraph,
  getHashTableDemonstration,
  getRequestQueueData,
} from './src/services/workloadService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'smart-faculty-overload-secret-key-2026';
const PORT = 3000;

const app = express();
app.use(express.json());

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI();
}

// Authentication Middleware
export interface UserPayload {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'hod';
  departmentId?: number | null;
  facultyId?: number | null;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
};

const requireRole = (roles: Array<'admin' | 'faculty' | 'hod'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this role' });
    }
    next();
  };
};

// ======================= AUTH ROUTES =======================

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);

    if (foundUsers.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const user = foundUsers[0];

    // Check role match
    if (user.role !== role) {
      return res.status(401).json({
        error: `User ${user.email} is registered as '${user.role.toUpperCase()}', not '${role.toUpperCase()}'. Please select the correct role.`,
      });
    }

    // Verify Password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    // If role is faculty, fetch faculty ID
    let facultyId: number | null = null;
    let facultyProfile: any = null;
    if (user.role === 'faculty') {
      const facRow = await db.select().from(faculty).where(eq(faculty.userId, user.id)).limit(1);
      if (facRow.length > 0) {
        facultyId = facRow[0].id;
        facultyProfile = facRow[0];
      }
    }

    // Generate JWT
    const payload: UserPayload = {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role as any,
      departmentId: user.departmentId,
      facultyId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        ...payload,
        facultyProfile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userRow.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = userRow[0];
    let facultyProfile: any = null;
    if (u.role === 'faculty') {
      const facRow = await db.select().from(faculty).where(eq(faculty.userId, u.id)).limit(1);
      if (facRow.length > 0) {
        facultyProfile = facRow[0];
      }
    }

    res.json({
      user: {
        id: u.id,
        uid: u.uid,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.departmentId,
        facultyId: facultyProfile?.id || null,
        facultyProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch current user' });
  }
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  res.json({
    message: `Password reset instructions and verification code have been dispatched to ${email}. (Demo: credentials for test users are available on the login screen)`,
  });
});

// ======================= WORKLOAD SUMMARY & SETTINGS =======================

app.get('/api/workload/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const facultyList = await getAllFacultyWorkloadData();
    const depts = await db.select().from(departments);
    const allCourses = await db.select().from(courses);
    const pendingReqs = await db.select().from(requests).where(eq(requests.status, 'Pending'));

    const normalCount = facultyList.filter((f) => f.status === 'Normal' || f.status === 'Near Limit').length;
    const overloadCount = facultyList.filter((f) => f.status === 'Overloaded').length;
    const underloadCount = facultyList.filter((f) => f.status === 'Underload').length;
    const totalTeachingHours = facultyList.reduce((acc, f) => acc + f.teachingHours, 0);
    const totalWorkloadUnits = facultyList.reduce((acc, f) => acc + f.totalWorkload, 0);

    res.json({
      totalFaculty: facultyList.length,
      totalDepartments: depts.length,
      totalCourses: allCourses.length,
      normalFaculty: normalCount,
      overloadFaculty: overloadCount,
      underloadFaculty: underloadCount,
      totalTeachingHours,
      totalWorkloadUnits,
      pendingRequestsCount: pendingReqs.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch workload summary' });
  }
});

app.get('/api/workload/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getSystemSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch system settings' });
  }
});

app.put('/api/workload/settings', authMiddleware, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { lectureWeight, labWeight, tutorialWeight, maxNormalThreshold, warningThreshold } = req.body;

    const existing = await db.select().from(systemSettings).limit(1);
    if (existing.length > 0) {
      await db
        .update(systemSettings)
        .set({
          lectureWeight: Number(lectureWeight),
          labWeight: Number(labWeight),
          tutorialWeight: Number(tutorialWeight),
          maxNormalThreshold: Number(maxNormalThreshold),
          warningThreshold: Number(warningThreshold),
        })
        .where(eq(systemSettings.id, existing[0].id));
    } else {
      await db.insert(systemSettings).values({
        lectureWeight: Number(lectureWeight),
        labWeight: Number(labWeight),
        tutorialWeight: Number(tutorialWeight),
        maxNormalThreshold: Number(maxNormalThreshold),
        warningThreshold: Number(warningThreshold),
      });
    }

    // Recalculate all faculty workloads
    const allFac = await db.select().from(faculty);
    for (const f of allFac) {
      await calculateAndPersistWorkload(f.id);
    }

    res.json({ message: 'Workload settings updated and all faculty workloads recalculated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update system settings' });
  }
});

// ======================= FACULTY MANAGEMENT =======================

app.get('/api/faculty', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const list = await getAllFacultyWorkloadData();

    // If HOD, can optionally filter by their department
    if (req.user!.role === 'hod' && req.user!.departmentId) {
      // HODs see all, but can identify department faculty
    }

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch faculty list' });
  }
});

app.post('/api/faculty', authMiddleware, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, facultyCode, designation, specialization, maxWorkload, departmentId } = req.body;

    if (!name || !email || !facultyCode || !departmentId) {
      return res.status(400).json({ error: 'Name, email, faculty code, and department are required' });
    }

    const pass = password || 'faculty123';
    const passwordHash = await bcrypt.hash(pass, 10);
    const uid = `uid_fac_${Date.now()}`;

    // Insert user
    const newUser = await db
      .insert(users)
      .values({
        uid,
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'faculty',
        departmentId: Number(departmentId),
      })
      .returning();

    // Insert faculty profile
    const newFaculty = await db
      .insert(faculty)
      .values({
        userId: newUser[0].id,
        facultyCode,
        designation: designation || 'Assistant Professor',
        specialization: specialization || 'Computer Science',
        maxWorkload: Number(maxWorkload) || 18,
      })
      .returning();

    // Initialize workload
    await calculateAndPersistWorkload(newFaculty[0].id);

    res.status(201).json({ message: 'Faculty created successfully', faculty: newFaculty[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create faculty' });
  }
});

app.put('/api/faculty/:id', authMiddleware, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const facultyId = Number(req.params.id);
    const { name, designation, specialization, maxWorkload, departmentId } = req.body;

    const fac = await db.select().from(faculty).where(eq(faculty.id, facultyId)).limit(1);
    if (fac.length === 0) return res.status(404).json({ error: 'Faculty not found' });

    await db
      .update(faculty)
      .set({
        designation: designation || fac[0].designation,
        specialization: specialization || fac[0].specialization,
        maxWorkload: maxWorkload ? Number(maxWorkload) : fac[0].maxWorkload,
      })
      .where(eq(faculty.id, facultyId));

    if (name || departmentId) {
      await db
        .update(users)
        .set({
          ...(name ? { name } : {}),
          ...(departmentId ? { departmentId: Number(departmentId) } : {}),
        })
        .where(eq(users.id, fac[0].userId));
    }

    await calculateAndPersistWorkload(facultyId);

    res.json({ message: 'Faculty updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update faculty' });
  }
});

app.delete('/api/faculty/:id', authMiddleware, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const facultyId = Number(req.params.id);
    // Delete assignments, requests, timetable, workload, faculty, user
    await db.delete(facultyCourses).where(eq(facultyCourses.facultyId, facultyId));
    await db.delete(requests).where(eq(requests.facultyId, facultyId));
    await db.delete(timetable).where(eq(timetable.facultyId, facultyId));
    await db.delete(workload).where(eq(workload.facultyId, facultyId));

    const fac = await db.select().from(faculty).where(eq(faculty.id, facultyId)).limit(1);
    if (fac.length > 0) {
      await db.delete(faculty).where(eq(faculty.id, facultyId));
      await db.delete(users).where(eq(users.id, fac[0].userId));
    }

    res.json({ message: 'Faculty removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete faculty' });
  }
});

// ======================= DEPARTMENTS & COURSES =======================

app.get('/api/departments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(departments);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch departments' });
  }
});

app.post('/api/departments', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { departmentName, departmentCode } = req.body;
    if (!departmentName || !departmentCode) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }
    const newDept = await db.insert(departments).values({ departmentName, departmentCode }).returning();
    res.status(201).json(newDept[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create department' });
  }
});

app.get('/api/courses', authMiddleware, async (req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        id: courses.id,
        courseCode: courses.courseCode,
        courseName: courses.courseName,
        departmentId: courses.departmentId,
        departmentName: departments.departmentName,
        departmentCode: departments.departmentCode,
        credits: courses.credits,
        courseType: courses.courseType,
        lectureHours: courses.lectureHours,
        labHours: courses.labHours,
        tutorialHours: courses.tutorialHours,
        requiredSpecialization: courses.requiredSpecialization,
        semester: courses.semester,
      })
      .from(courses)
      .innerJoin(departments, eq(courses.departmentId, departments.id));

    // Get current assignment for each course
    const assignments = await db
      .select({
        courseId: facultyCourses.courseId,
        facultyId: faculty.id,
        facultyName: users.name,
        facultyCode: faculty.facultyCode,
      })
      .from(facultyCourses)
      .innerJoin(faculty, eq(facultyCourses.facultyId, faculty.id))
      .innerJoin(users, eq(faculty.userId, users.id));

    const courseMap = list.map((c) => {
      const assigned = assignments.filter((a) => a.courseId === c.id);
      return {
        ...c,
        assignedFaculty: assigned,
        workloadUnits: c.lectureHours + c.labHours * 1.5 + c.tutorialHours,
      };
    });

    res.json(courseMap);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch courses' });
  }
});

app.post('/api/courses', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      courseCode,
      courseName,
      departmentId,
      credits,
      courseType,
      lectureHours,
      labHours,
      tutorialHours,
      requiredSpecialization,
      semester,
    } = req.body;

    if (!courseCode || !courseName || !departmentId) {
      return res.status(400).json({ error: 'Course code, name, and department are required' });
    }

    const newCourse = await db
      .insert(courses)
      .values({
        courseCode,
        courseName,
        departmentId: Number(departmentId),
        credits: Number(credits) || 3,
        courseType: courseType || 'Theory',
        lectureHours: Number(lectureHours) || 3,
        labHours: Number(labHours) || 0,
        tutorialHours: Number(tutorialHours) || 0,
        requiredSpecialization,
        semester: semester || 'Fall 2026',
      })
      .returning();

    res.status(201).json(newCourse[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create course' });
  }
});

app.put('/api/courses/:id', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const { courseName, credits, courseType, lectureHours, labHours, tutorialHours, requiredSpecialization } = req.body;

    await db
      .update(courses)
      .set({
        ...(courseName ? { courseName } : {}),
        ...(credits ? { credits: Number(credits) } : {}),
        ...(courseType ? { courseType } : {}),
        ...(lectureHours !== undefined ? { lectureHours: Number(lectureHours) } : {}),
        ...(labHours !== undefined ? { labHours: Number(labHours) } : {}),
        ...(tutorialHours !== undefined ? { tutorialHours: Number(tutorialHours) } : {}),
        ...(requiredSpecialization !== undefined ? { requiredSpecialization } : {}),
      })
      .where(eq(courses.id, courseId));

    // Recalculate faculty workloads for faculty teaching this course
    const affected = await db.select().from(facultyCourses).where(eq(facultyCourses.courseId, courseId));
    for (const a of affected) {
      await calculateAndPersistWorkload(a.facultyId);
    }

    res.json({ message: 'Course updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const affected = await db.select().from(facultyCourses).where(eq(facultyCourses.courseId, courseId));

    await db.delete(facultyCourses).where(eq(facultyCourses.courseId, courseId));
    await db.delete(timetable).where(eq(timetable.courseId, courseId));
    await db.delete(requests).where(eq(requests.courseId, courseId));
    await db.delete(courses).where(eq(courses.id, courseId));

    for (const a of affected) {
      await calculateAndPersistWorkload(a.facultyId);
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete course' });
  }
});

// ======================= COURSE ASSIGNMENTS =======================

app.post('/api/assignments', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const { facultyId, courseId } = req.body;
    if (!facultyId || !courseId) {
      return res.status(400).json({ error: 'Faculty ID and Course ID are required' });
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(facultyCourses)
      .where(and(eq(facultyCourses.facultyId, Number(facultyId)), eq(facultyCourses.courseId, Number(courseId))));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Course is already assigned to this faculty member' });
    }

    await db.insert(facultyCourses).values({
      facultyId: Number(facultyId),
      courseId: Number(courseId),
    });

    await calculateAndPersistWorkload(Number(facultyId));

    // Notify faculty
    const facRow = await db.select().from(faculty).where(eq(faculty.id, Number(facultyId))).limit(1);
    const courseRow = await db.select().from(courses).where(eq(courses.id, Number(courseId))).limit(1);

    if (facRow.length > 0 && courseRow.length > 0) {
      await db.insert(notifications).values({
        userId: facRow[0].userId,
        title: 'New Course Assigned',
        message: `You have been assigned ${courseRow[0].courseCode}: ${courseRow[0].courseName}. Workload updated.`,
        type: 'assignment',
      });
    }

    res.json({ message: 'Course assigned successfully and workload recalculated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to assign course' });
  }
});

app.delete('/api/assignments/:facultyId/:courseId', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const facultyId = Number(req.params.facultyId);
    const courseId = Number(req.params.courseId);

    await db
      .delete(facultyCourses)
      .where(and(eq(facultyCourses.facultyId, facultyId), eq(facultyCourses.courseId, courseId)));

    await calculateAndPersistWorkload(facultyId);

    res.json({ message: 'Assignment removed and workload recalculated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to unassign course' });
  }
});

app.post('/api/assignments/reassign', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const { sourceFacultyId, targetFacultyId, courseId } = req.body;
    if (!sourceFacultyId || !targetFacultyId || !courseId) {
      return res.status(400).json({ error: 'Source faculty, target faculty, and course ID are required' });
    }

    const srcId = Number(sourceFacultyId);
    const tgtId = Number(targetFacultyId);
    const crsId = Number(courseId);

    // Delete from source
    await db
      .delete(facultyCourses)
      .where(and(eq(facultyCourses.facultyId, srcId), eq(facultyCourses.courseId, crsId)));

    // Insert to target
    await db.insert(facultyCourses).values({
      facultyId: tgtId,
      courseId: crsId,
    });

    // Update timetable
    await db
      .update(timetable)
      .set({ facultyId: tgtId })
      .where(and(eq(timetable.facultyId, srcId), eq(timetable.courseId, crsId)));

    // Recalculate workloads for both
    await calculateAndPersistWorkload(srcId);
    await calculateAndPersistWorkload(tgtId);

    // Notifications
    const srcFac = await db.select().from(faculty).where(eq(faculty.id, srcId)).limit(1);
    const tgtFac = await db.select().from(faculty).where(eq(faculty.id, tgtId)).limit(1);
    const crs = await db.select().from(courses).where(eq(courses.id, crsId)).limit(1);

    if (srcFac.length > 0 && crs.length > 0) {
      await db.insert(notifications).values({
        userId: srcFac[0].userId,
        title: 'Course Reassigned (Relieved)',
        message: `${crs[0].courseCode} has been transferred. Your workload has been reduced.`,
        type: 'optimization',
      });
    }
    if (tgtFac.length > 0 && crs.length > 0) {
      await db.insert(notifications).values({
        userId: tgtFac[0].userId,
        title: 'Course Reassigned (Added)',
        message: `${crs[0].courseCode} has been transferred to your teaching portfolio.`,
        type: 'assignment',
      });
    }

    res.json({ message: 'Course reassigned successfully and both faculty workloads updated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reassign course' });
  }
});

// ======================= DSA APIS =======================

// A. Sorting
app.get('/api/dsa/sort', authMiddleware, async (req: Request, res: Response) => {
  try {
    const key = (req.query.key as any) || 'totalWorkload';
    const order = (req.query.order as any) || 'desc';
    const algorithm = (req.query.algorithm as any) || 'merge_sort';

    const result = await getSortedFaculty(key, order, algorithm);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to execute sorting algorithm' });
  }
});

// B. Priority Queue
app.get('/api/dsa/priority-queue', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await getPriorityFacultyQueue();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to compute priority queue' });
  }
});

// C. Greedy Workload Balancer Simulation
app.get('/api/dsa/greedy-balancer', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await runWorkloadBalancerSimulation();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to run workload balancer simulation' });
  }
});

// Apply Greedy Balancer Recommendation
app.post('/api/dsa/greedy-balancer/apply', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const { sourceFacultyId, targetFacultyId, courseId } = req.body;
    if (!sourceFacultyId || !targetFacultyId || !courseId) {
      return res.status(400).json({ error: 'Missing recommendation transfer parameters' });
    }

    const srcId = Number(sourceFacultyId);
    const tgtId = Number(targetFacultyId);
    const crsId = Number(courseId);

    // Transfer course
    await db
      .delete(facultyCourses)
      .where(and(eq(facultyCourses.facultyId, srcId), eq(facultyCourses.courseId, crsId)));

    await db.insert(facultyCourses).values({
      facultyId: tgtId,
      courseId: crsId,
    });

    await calculateAndPersistWorkload(srcId);
    await calculateAndPersistWorkload(tgtId);

    res.json({ message: 'Optimization transfer applied successfully to production database.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to apply recommendation' });
  }
});

// D. Graph
app.get('/api/dsa/graph', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await getAcademicRelationshipGraph();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch graph data' });
  }
});

// E. Hash Table
app.get('/api/dsa/hash-table', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await getHashTableDemonstration();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to compute hash table demonstration' });
  }
});

// F. FIFO Request Queue
app.get('/api/dsa/request-queue', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await getRequestQueueData();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch request queue' });
  }
});

// ======================= WORKLOAD REQUESTS =======================

app.get('/api/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let query = db
      .select({
        id: requests.id,
        facultyId: requests.facultyId,
        facultyName: users.name,
        facultyCode: faculty.facultyCode,
        departmentName: departments.departmentName,
        requestType: requests.requestType,
        courseId: requests.courseId,
        courseName: courses.courseName,
        courseCode: courses.courseCode,
        targetFacultyId: requests.targetFacultyId,
        description: requests.description,
        priority: requests.priority,
        status: requests.status,
        adminRemarks: requests.adminRemarks,
        createdAt: requests.createdAt,
      })
      .from(requests)
      .innerJoin(faculty, eq(requests.facultyId, faculty.id))
      .innerJoin(users, eq(faculty.userId, users.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(courses, eq(requests.courseId, courses.id))
      .orderBy(requests.createdAt);

    const all = await query;

    // Filter by role
    if (user.role === 'faculty') {
      const own = all.filter((r) => r.facultyId === user.facultyId);
      return res.json(own);
    }

    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch requests' });
  }
});

app.post('/api/requests', authMiddleware, requireRole(['faculty']), async (req: AuthRequest, res: Response) => {
  try {
    const facultyId = req.user!.facultyId;
    if (!facultyId) return res.status(400).json({ error: 'Faculty profile not found for user' });

    const { requestType, courseId, targetFacultyId, description, priority } = req.body;
    if (!requestType || !description) {
      return res.status(400).json({ error: 'Request type and description are required' });
    }

    const newReq = await db
      .insert(requests)
      .values({
        facultyId,
        requestType,
        courseId: courseId ? Number(courseId) : null,
        targetFacultyId: targetFacultyId ? Number(targetFacultyId) : null,
        description,
        priority: Number(priority) || 3,
        status: 'Pending',
      })
      .returning();

    // Create notification for Admin & HOD
    const adminHodUsers = await db
      .select()
      .from(users)
      .where(sql`${users.role} IN ('admin', 'hod')`);

    for (const u of adminHodUsers) {
      await db.insert(notifications).values({
        userId: u.id,
        title: 'New Workload Request',
        message: `${req.user!.name} submitted a ${requestType} request. Priority: ${priority || 3}`,
        type: 'assignment',
      });
    }

    res.status(201).json(newReq[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit request' });
  }
});

app.put('/api/requests/:id/status', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const requestId = Number(req.params.id);
    const { status, adminRemarks, autoApplyReassignment } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (Approved or Rejected)' });
    }

    const reqRow = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
    if (reqRow.length === 0) return res.status(404).json({ error: 'Request not found' });

    await db
      .update(requests)
      .set({
        status,
        adminRemarks: adminRemarks || (status === 'Approved' ? 'Request approved by academic coordinator.' : 'Request declined.'),
      })
      .where(eq(requests.id, requestId));

    // If autoApplyReassignment is requested and it was a reassignment request with target faculty
    if (status === 'Approved' && reqRow[0].requestType === 'Course Reassignment' && reqRow[0].courseId && reqRow[0].targetFacultyId) {
      await db
        .delete(facultyCourses)
        .where(and(eq(facultyCourses.facultyId, reqRow[0].facultyId), eq(facultyCourses.courseId, reqRow[0].courseId)));
      await db.insert(facultyCourses).values({
        facultyId: reqRow[0].targetFacultyId,
        courseId: reqRow[0].courseId,
      });
      await calculateAndPersistWorkload(reqRow[0].facultyId);
      await calculateAndPersistWorkload(reqRow[0].targetFacultyId);
    }

    // Notify requesting faculty
    const facRow = await db.select().from(faculty).where(eq(faculty.id, reqRow[0].facultyId)).limit(1);
    if (facRow.length > 0) {
      await db.insert(notifications).values({
        userId: facRow[0].userId,
        title: `Workload Request ${status}`,
        message: `Your ${reqRow[0].requestType} request has been ${status.toLowerCase()}.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
        type: status === 'Approved' ? 'approval' : 'rejection',
      });
    }

    res.json({ message: `Request successfully marked as ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update request' });
  }
});

// ======================= TIMETABLE =======================

app.get('/api/timetable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const facultyIdParam = req.query.facultyId ? Number(req.query.facultyId) : undefined;
    let targetFacultyId = facultyIdParam;

    if (req.user!.role === 'faculty') {
      targetFacultyId = req.user!.facultyId || undefined;
    }

    let query = db
      .select({
        id: timetable.id,
        facultyId: timetable.facultyId,
        facultyName: users.name,
        courseId: timetable.courseId,
        courseName: courses.courseName,
        courseCode: courses.courseCode,
        day: timetable.day,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room,
      })
      .from(timetable)
      .innerJoin(faculty, eq(timetable.facultyId, faculty.id))
      .innerJoin(users, eq(faculty.userId, users.id))
      .innerJoin(courses, eq(timetable.courseId, courses.id));

    const rows = await query;
    const filtered = targetFacultyId ? rows.filter((r) => r.facultyId === targetFacultyId) : rows;

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch timetable' });
  }
});

app.post('/api/timetable', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const { facultyId, courseId, day, startTime, endTime, room } = req.body;
    if (!facultyId || !courseId || !day || !startTime || !endTime || !room) {
      return res.status(400).json({ error: 'All timetable slot fields are required' });
    }

    const newSlot = await db
      .insert(timetable)
      .values({
        facultyId: Number(facultyId),
        courseId: Number(courseId),
        day,
        startTime,
        endTime,
        room,
      })
      .returning();

    res.status(201).json(newSlot[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create timetable slot' });
  }
});

app.delete('/api/timetable/:id', authMiddleware, requireRole(['admin', 'hod']), async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(timetable).where(eq(timetable.id, id));
    res.json({ message: 'Timetable slot removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete timetable slot' });
  }
});

// ======================= NOTIFICATIONS =======================

app.get('/api/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(sql`${notifications.createdAt} DESC`);

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, req.user!.id)));
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

app.post('/api/notifications/mark-all-read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, req.user!.id));
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark notifications read' });
  }
});

// ======================= CHATBOT (FacultyAssist) =======================

app.post('/api/chatbot', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const user = req.user!;
    const facultyData = await getAllFacultyWorkloadData();
    const settings = await getSystemSettings();

    // Find requesting faculty profile
    const currentFaculty = facultyData.find((f) => f.userId === user.id);

    // Build context with role security
    let roleContext = '';
    if (user.role === 'faculty') {
      if (currentFaculty) {
        roleContext = `Logged in User: ${user.name} (Faculty).
Current Teaching Hours: ${currentFaculty.teachingHours}h, Total Workload: ${currentFaculty.totalWorkload}h, Max Allowed Workload: ${currentFaculty.maxWorkload}h.
Workload Percentage: ${currentFaculty.workloadPercentage}%. Status: ${currentFaculty.status}.
Overload Hours: ${currentFaculty.overloadAmount}h. Available Headroom: ${Math.max(0, currentFaculty.maxWorkload - currentFaculty.totalWorkload)}h.
Assigned Courses: ${currentFaculty.courses.map((c) => `${c.courseCode} (${c.courseName} - ${c.workloadUnits}h)`).join(', ') || 'None'}.
Pending Requests: ${currentFaculty.pendingRequestsCount}.
Security Rule: Faculty can only see their own workload, schedule, and advice on balancing/requests. Do not disclose other faculty personal details.`;
      } else {
        roleContext = `Logged in User: ${user.name} (Faculty Profile pending).`;
      }
    } else {
      // Admin or HOD
      const overloaded = facultyData.filter((f) => f.status === 'Overloaded');
      const underloaded = facultyData.filter((f) => f.status === 'Underload');
      const lowestWorkload = [...facultyData].sort((a, b) => a.totalWorkload - b.totalWorkload)[0];
      const highestWorkload = [...facultyData].sort((a, b) => b.totalWorkload - a.totalWorkload)[0];

      roleContext = `Logged in User: ${user.name} (${user.role.toUpperCase()}).
Full Department & University Access:
Total Faculty: ${facultyData.length}.
Overloaded Faculty: ${overloaded.map((f) => `${f.name} (${f.totalWorkload}/${f.maxWorkload}h)`).join(', ') || 'None'}.
Underloaded Faculty: ${underloaded.map((f) => `${f.name} (${f.totalWorkload}/${f.maxWorkload}h)`).join(', ') || 'None'}.
Lowest Workload Faculty: ${lowestWorkload ? `${lowestWorkload.name} (${lowestWorkload.totalWorkload}h)` : 'N/A'}.
Highest Workload Faculty: ${highestWorkload ? `${highestWorkload.name} (${highestWorkload.totalWorkload}h)` : 'N/A'}.
All Faculty: ${facultyData.map((f) => `${f.name} [${f.departmentCode}]: ${f.totalWorkload}h / ${f.maxWorkload}h (${f.status})`).join('; ')}`;
    }

    const systemPrompt = `You are "FacultyAssist", the AI Assistant for the Smart Faculty Overload Management System.
You answer faculty and academic administrators politely, accurately, and concisely.
Workload calculation rules:
- Lecture = ${settings.lectureWeight} workload unit/hr
- Lab = ${settings.labWeight} workload units/hr
- Tutorial = ${settings.tutorialWeight} workload unit/hr
- Standard Max Workload Ceiling: ${settings.maxNormalThreshold}h

CONTEXT:
${roleContext}

USER QUERY: "${query}"

Guidelines:
1. Provide direct, informative, academic responses.
2. If faculty asks "What is my current workload?", "Am I overloaded?", "How many hours can I still take?", or "Show my assigned courses", give exact numbers from their context.
3. If asked "How can I request workload reduction?", explain that they can go to the "Requests" tab, select "Reduction" or "Course Reassignment", pick the course, and submit.
4. If asked "How does workload balancing work?", explain that the system uses a Greedy Algorithm coupled with a Priority Queue (Max Heap) to match overloaded faculty with available faculty based on department, specialization, and load headroom.
5. If faculty asks for another faculty's private load details, politely inform them that role permissions restrict viewing other faculty loads to HOD and Admin.`;

    // Try Gemini if available
    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: systemPrompt,
        });
        const reply = response.text || '';
        if (reply.trim()) {
          return res.json({ reply: reply.trim() });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to deterministic engine:', geminiErr);
      }
    }

    // Deterministic fallback engine for instant offline responsiveness
    const qLower = query.toLowerCase();
    let reply = '';

    if (qLower.includes('current workload') || qLower.includes('my workload') || qLower.includes('what is my workload')) {
      if (currentFaculty) {
        reply = `Your current total workload is **${currentFaculty.totalWorkload} hours** out of a maximum of **${currentFaculty.maxWorkload} hours** (${currentFaculty.workloadPercentage}%). Status: **${currentFaculty.status}**.`;
      } else {
        reply = `You are logged in as an administrator. There are ${facultyData.length} faculty members managed in the system.`;
      }
    } else if (qLower.includes('am i overloaded') || qLower.includes('overload')) {
      if (currentFaculty) {
        if (currentFaculty.overloadAmount > 0) {
          reply = `⚠️ Yes, you are currently **overloaded by ${currentFaculty.overloadAmount} hours** (${currentFaculty.totalWorkload}/${currentFaculty.maxWorkload}h). You can submit a workload reduction request via the Requests tab!`;
        } else {
          reply = `✅ No, your workload is **${currentFaculty.totalWorkload}/${currentFaculty.maxWorkload} hours** (${currentFaculty.workloadPercentage}%), which is within normal limits.`;
        }
      } else {
        const overloaded = facultyData.filter((f) => f.status === 'Overloaded');
        reply = `Currently, there ${overloaded.length === 1 ? 'is 1 faculty member' : `are ${overloaded.length} faculty members`} overloaded: ${overloaded.map((f) => `${f.name} (+${f.overloadAmount}h)`).join(', ') || 'None'}.`;
      }
    } else if (qLower.includes('how many hours can i') || qLower.includes('headroom') || qLower.includes('capacity')) {
      if (currentFaculty) {
        const headroom = Math.max(0, currentFaculty.maxWorkload - currentFaculty.totalWorkload);
        if (headroom > 0) {
          reply = `You have **${headroom} available hours** remaining before reaching your maximum limit of ${currentFaculty.maxWorkload} hours.`;
        } else {
          reply = `You have **0 available hours**. You are currently exceeding your limit by +${currentFaculty.overloadAmount} hours.`;
        }
      } else {
        reply = `Total university teaching capacity is balanced. Head to the 'Smart Workload Balancer' tab to optimize allocations.`;
      }
    } else if (qLower.includes('lowest workload') || qLower.includes('lowest')) {
      if (user.role === 'faculty') {
        reply = `Detailed colleague workload comparisons are reserved for HOD and Academic Administrators under privacy policies. You can consult your HOD for capacity reassignment.`;
      } else {
        const lowest = [...facultyData].sort((a, b) => a.totalWorkload - b.totalWorkload)[0];
        reply = lowest
          ? `The faculty member with the lowest workload is **${lowest.name}** with **${lowest.totalWorkload}/${lowest.maxWorkload} hours** (${lowest.status}).`
          : `No faculty records found.`;
      }
    } else if (qLower.includes('assigned courses') || qLower.includes('my courses') || qLower.includes('show my')) {
      if (currentFaculty) {
        const courseList = currentFaculty.courses
          .map((c) => `• **${c.courseCode}**: ${c.courseName} (${c.workloadUnits} workload hours)`)
          .join('\n');
        reply = `Here are your assigned courses for Fall 2026:\n\n${courseList || 'No courses currently assigned.'}`;
      } else {
        reply = `There are ${facultyData.reduce((acc, f) => acc + f.courses.length, 0)} course allocations across all departments.`;
      }
    } else if (qLower.includes('how can i request') || qLower.includes('request workload reduction') || qLower.includes('reduction')) {
      reply = `To request a workload reduction:\n1. Navigate to the **Requests** tab in your sidebar.\n2. Click **Submit New Request**.\n3. Choose **Reduction** or **Course Reassignment**.\n4. Select the specific course you wish to relieve.\n5. Enter your justification and submit! It will enter the HOD/Admin FIFO approval queue.`;
    } else if (qLower.includes('how does workload balancing work') || qLower.includes('greedy') || qLower.includes('algorithm')) {
      reply = `The **Smart Workload Balancer** uses a **Greedy Algorithm** backed by a **Max-Heap Priority Queue** and **Bipartite Relationship Graph**:\n1. It identifies the most overloaded faculty members (highest priority in the Max Heap).\n2. It locates faculty members with available capacity in the same department or matching specialization.\n3. It greedily selects candidate courses that minimize workload variance without exceeding the recipient's ceiling.\n4. Recommendations are presented to the Admin/HOD for approval before updating the database.`;
    } else if (qLower.includes('percentage') || qLower.includes('explain my workload percentage')) {
      if (currentFaculty) {
        reply = `Your workload percentage is **${currentFaculty.workloadPercentage}%**, calculated as: \`(${currentFaculty.totalWorkload} current hours / ${currentFaculty.maxWorkload} max hours) * 100\`. Above 100% is categorized as Overloaded.`;
      } else {
        reply = `Workload percentage is computed as \`(Total Workload / Max Workload) * 100\`. Values > 100% indicate an overload state.`;
      }
    } else {
      reply = `Hello ${user.name}! I am **FacultyAssist**. I can help you with your workload calculation, overload status, assigned courses, reduction requests, and explaining the DSA balancing algorithms. How can I assist you today?`;
    }

    res.json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Chatbot encountered an error' });
  }
});

// ======================= REPORTS EXPORT =======================

app.get('/api/reports/workload-csv', authMiddleware, requireRole(['admin', 'hod']), async (req: Request, res: Response) => {
  try {
    const list = await getAllFacultyWorkloadData();
    let csv = 'Faculty Code,Name,Department,Designation,Specialization,Teaching Hours,Lab Hours,Tutorial Hours,Total Workload,Max Allowed,Workload %,Status,Assigned Courses\n';

    for (const f of list) {
      const courseCodes = f.courses.map((c) => c.courseCode).join(';');
      csv += `"${f.facultyCode}","${f.name}","${f.departmentName}","${f.designation}","${f.specialization}",${f.teachingHours},${f.labHours},${f.tutorialHours},${f.totalWorkload},${f.maxWorkload},${f.workloadPercentage}%,"${f.status}","${courseCodes}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="faculty_workload_report.csv"');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export CSV report' });
  }
});

// ======================= VITE / STATIC SERVING =======================

async function startServer() {
  // Seed database if empty
  await seedDatabaseIfEmpty();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
});
