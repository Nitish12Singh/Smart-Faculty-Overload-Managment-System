import { db } from '../db/index.ts';
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
} from '../db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import {
  mergeSortFaculty,
  quickSortFaculty,
  FacultySortable,
  SortKey,
  SortOrder,
  SortAlgorithm,
} from '../dsa/sorting.ts';
import { MaxHeapFaculty, PriorityFacultyItem } from '../dsa/priorityQueue.ts';
import {
  runGreedyWorkloadBalancer,
  FacultyProfileForBalancer,
  FacultyCourseDetail,
} from '../dsa/greedyBalancer.ts';
import { AcademicWorkloadGraph } from '../dsa/graph.ts';
import { CustomHashTable } from '../dsa/hashTable.ts';
import { RequestQueue } from '../dsa/requestQueue.ts';

export interface WorkloadWeights {
  lectureWeight: number;
  labWeight: number;
  tutorialWeight: number;
  maxNormalThreshold: number;
  warningThreshold: number;
}

export async function getSystemSettings(): Promise<WorkloadWeights> {
  try {
    const settings = await db.select().from(systemSettings).limit(1);
    if (settings.length > 0) {
      return {
        lectureWeight: settings[0].lectureWeight,
        labWeight: settings[0].labWeight,
        tutorialWeight: settings[0].tutorialWeight,
        maxNormalThreshold: settings[0].maxNormalThreshold,
        warningThreshold: settings[0].warningThreshold,
      };
    }
  } catch (err) {
    console.error('Failed to fetch system settings, using defaults:', err);
  }
  return {
    lectureWeight: 1.0,
    labWeight: 1.5,
    tutorialWeight: 1.0,
    maxNormalThreshold: 18.0,
    warningThreshold: 16.0,
  };
}

export async function calculateAndPersistWorkload(facultyId: number): Promise<void> {
  const weights = await getSystemSettings();

  // Find all courses assigned to this faculty
  const assignments = await db
    .select({
      course: courses,
    })
    .from(facultyCourses)
    .innerJoin(courses, eq(facultyCourses.courseId, courses.id))
    .where(eq(facultyCourses.facultyId, facultyId));

  let totalTeachingHours = 0;
  let totalLabHours = 0;
  let totalTutorialHours = 0;

  for (const { course } of assignments) {
    totalTeachingHours += course.lectureHours;
    totalLabHours += course.labHours;
    totalTutorialHours += course.tutorialHours;
  }

  // Workload formula
  const calculatedTotal =
    totalTeachingHours * weights.lectureWeight +
    totalLabHours * weights.labWeight +
    totalTutorialHours * weights.tutorialWeight;

  const facultyRow = await db.select().from(faculty).where(eq(faculty.id, facultyId)).limit(1);
  const maxLimit = facultyRow.length > 0 ? facultyRow[0].maxWorkload : weights.maxNormalThreshold;

  const percentage = maxLimit > 0 ? Math.round((calculatedTotal / maxLimit) * 1000) / 10 : 0;

  let status: 'Underload' | 'Normal' | 'Near Limit' | 'Overloaded' = 'Normal';
  if (calculatedTotal > maxLimit) {
    status = 'Overloaded';
  } else if (calculatedTotal >= maxLimit - 2) {
    status = 'Near Limit';
  } else if (calculatedTotal < 12) {
    status = 'Underload';
  }

  // Upsert into workload table
  await db
    .insert(workload)
    .values({
      facultyId,
      teachingHours: totalTeachingHours,
      labHours: totalLabHours,
      tutorialHours: totalTutorialHours,
      totalWorkload: calculatedTotal,
      workloadPercentage: percentage,
      status,
    })
    .onConflictDoUpdate({
      target: workload.facultyId,
      set: {
        teachingHours: totalTeachingHours,
        labHours: totalLabHours,
        tutorialHours: totalTutorialHours,
        totalWorkload: calculatedTotal,
        workloadPercentage: percentage,
        status,
        updatedAt: new Date(),
      },
    });
}

export async function getAllFacultyWorkloadData() {
  const weights = await getSystemSettings();

  const allFaculty = await db
    .select({
      facultyId: faculty.id,
      facultyCode: faculty.facultyCode,
      designation: faculty.designation,
      specialization: faculty.specialization,
      maxWorkload: faculty.maxWorkload,
      userId: users.id,
      name: users.name,
      email: users.email,
      departmentId: departments.id,
      departmentName: departments.departmentName,
      departmentCode: departments.departmentCode,
      teachingHours: workload.teachingHours,
      labHours: workload.labHours,
      tutorialHours: workload.tutorialHours,
      totalWorkload: workload.totalWorkload,
      workloadPercentage: workload.workloadPercentage,
      status: workload.status,
    })
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .leftJoin(workload, eq(faculty.id, workload.facultyId));

  // Get courses assigned per faculty
  const assignments = await db
    .select({
      facultyId: facultyCourses.facultyId,
      courseId: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      departmentId: courses.departmentId,
      credits: courses.credits,
      courseType: courses.courseType,
      lectureHours: courses.lectureHours,
      labHours: courses.labHours,
      tutorialHours: courses.tutorialHours,
      requiredSpecialization: courses.requiredSpecialization,
      semester: courses.semester,
    })
    .from(facultyCourses)
    .innerJoin(courses, eq(facultyCourses.courseId, courses.id));

  // Group courses by facultyId
  const courseMap = new Map<number, FacultyCourseDetail[]>();
  for (const row of assignments) {
    if (!courseMap.has(row.facultyId)) {
      courseMap.set(row.facultyId, []);
    }
    const courseWorkload =
      row.lectureHours * weights.lectureWeight +
      row.labHours * weights.labWeight +
      row.tutorialHours * weights.tutorialWeight;

    courseMap.get(row.facultyId)!.push({
      courseId: row.courseId,
      courseCode: row.courseCode,
      courseName: row.courseName,
      departmentId: row.departmentId,
      departmentName: '',
      courseType: row.courseType,
      workloadUnits: courseWorkload,
      lectureHours: row.lectureHours,
      labHours: row.labHours,
      tutorialHours: row.tutorialHours,
      requiredSpecialization: row.requiredSpecialization,
    });
  }

  // Get pending request counts
  const pendingReqs = await db
    .select({
      facultyId: requests.facultyId,
      count: sql<number>`count(*)::int`,
    })
    .from(requests)
    .where(eq(requests.status, 'Pending'))
    .groupBy(requests.facultyId);

  const pendingMap = new Map<number, number>();
  for (const r of pendingReqs) {
    pendingMap.set(r.facultyId, r.count);
  }

  return allFaculty.map((f) => {
    const assignedCourses = courseMap.get(f.facultyId) || [];
    const courseCount = assignedCourses.length;
    const currentWorkload = f.totalWorkload ?? 0;
    const max = f.maxWorkload || 18;
    const overloadAmount = Math.max(0, currentWorkload - max);
    const pendingCount = pendingMap.get(f.facultyId) || 0;

    return {
      facultyId: f.facultyId,
      facultyCode: f.facultyCode,
      userId: f.userId,
      name: f.name,
      email: f.email,
      designation: f.designation,
      specialization: f.specialization,
      departmentId: f.departmentId ?? 1,
      departmentName: f.departmentName ?? 'General Academics',
      departmentCode: f.departmentCode ?? 'GEN',
      teachingHours: f.teachingHours ?? 0,
      labHours: f.labHours ?? 0,
      tutorialHours: f.tutorialHours ?? 0,
      totalWorkload: currentWorkload,
      maxWorkload: max,
      workloadPercentage: f.workloadPercentage ?? (max > 0 ? (currentWorkload / max) * 100 : 0),
      overloadAmount,
      status: f.status ?? (currentWorkload > max ? 'Overloaded' : currentWorkload >= max - 2 ? 'Near Limit' : 'Normal'),
      courseCount,
      courses: assignedCourses,
      pendingRequestsCount: pendingCount,
    };
  });
}

// DSA: Sorting Service
export async function getSortedFaculty(
  key: SortKey = 'totalWorkload',
  order: SortOrder = 'desc',
  algorithm: SortAlgorithm = 'merge_sort'
) {
  const data = await getAllFacultyWorkloadData();
  const sortables: FacultySortable[] = data.map((d) => ({
    facultyId: d.facultyId,
    facultyCode: d.facultyCode,
    name: d.name,
    departmentName: d.departmentName,
    specialization: d.specialization,
    teachingHours: d.teachingHours,
    courseCount: d.courseCount,
    totalWorkload: d.totalWorkload,
    maxWorkload: d.maxWorkload,
    workloadPercentage: d.workloadPercentage,
    overloadAmount: d.overloadAmount,
    status: d.status,
  }));

  if (algorithm === 'quick_sort') {
    return quickSortFaculty(sortables, key, order);
  } else {
    return mergeSortFaculty(sortables, key, order);
  }
}

// DSA: Priority Queue Service
export async function getPriorityFacultyQueue() {
  const data = await getAllFacultyWorkloadData();

  const items: PriorityFacultyItem[] = data.map((d) => {
    const { score, urgency, reason } = MaxHeapFaculty.calculatePriority(
      d.totalWorkload,
      d.maxWorkload,
      d.courseCount,
      d.pendingRequestsCount
    );

    return {
      facultyId: d.facultyId,
      facultyCode: d.facultyCode,
      name: d.name,
      departmentName: d.departmentName,
      specialization: d.specialization,
      currentWorkload: d.totalWorkload,
      maxWorkload: d.maxWorkload,
      overloadHours: d.overloadAmount,
      workloadPercentage: d.workloadPercentage,
      assignedCoursesCount: d.courseCount,
      pendingRequestsCount: d.pendingRequestsCount,
      priorityScore: score,
      urgencyLevel: urgency,
      reason,
    };
  });

  const heap = new MaxHeapFaculty(items);
  const highestPriority = heap.peek();
  const sortedByPriority = heap.toSortedArray();
  const rawHeapStructure = heap.getRawHeap();

  return {
    highestPriority,
    sortedByPriority,
    heapArray: rawHeapStructure,
    totalCount: items.length,
  };
}

// DSA: Smart Balancer (Greedy Algorithm)
export async function runWorkloadBalancerSimulation() {
  const data = await getAllFacultyWorkloadData();

  const profiles: FacultyProfileForBalancer[] = data.map((d) => ({
    facultyId: d.facultyId,
    facultyCode: d.facultyCode,
    name: d.name,
    departmentId: d.departmentId,
    departmentName: d.departmentName,
    specialization: d.specialization,
    maxWorkload: d.maxWorkload,
    currentWorkload: d.totalWorkload,
    courses: d.courses,
  }));

  return runGreedyWorkloadBalancer(profiles);
}

// DSA: Graph Service
export async function getAcademicRelationshipGraph() {
  const data = await getAllFacultyWorkloadData();
  const depts = await db.select().from(departments);
  const allCourses = await db.select().from(courses);

  const graph = new AcademicWorkloadGraph();

  // Add Department Nodes
  for (const d of depts) {
    graph.addNode({
      id: `dept_${d.id}`,
      type: 'DEPARTMENT',
      label: `${d.departmentCode} - ${d.departmentName}`,
      metadata: { departmentId: d.id, code: d.departmentCode },
    });
  }

  // Add Faculty Nodes
  for (const f of data) {
    graph.addNode({
      id: `fac_${f.facultyId}`,
      type: 'FACULTY',
      label: f.name,
      metadata: {
        facultyId: f.facultyId,
        code: f.facultyCode,
        specialization: f.specialization,
        currentWorkload: f.totalWorkload,
        maxWorkload: f.maxWorkload,
        status: f.status,
      },
    });

    // Edge to Department
    graph.addEdge(`fac_${f.facultyId}`, `dept_${f.departmentId}`, 'AFFILIATED_WITH', 1);

    // Edges to Courses (Teaches)
    for (const c of f.courses) {
      graph.addEdge(`fac_${f.facultyId}`, `course_${c.courseId}`, 'TEACHES', c.workloadUnits);
    }
  }

  // Add Course Nodes
  for (const c of allCourses) {
    graph.addNode({
      id: `course_${c.id}`,
      type: 'COURSE',
      label: `${c.courseCode}: ${c.courseName}`,
      metadata: {
        courseId: c.id,
        code: c.courseCode,
        departmentId: c.departmentId,
        lectureHours: c.lectureHours,
        labHours: c.labHours,
        workloadUnits: c.lectureHours + c.labHours * 1.5 + c.tutorialHours,
        requiredSpecialization: c.requiredSpecialization,
      },
    });

    // Edge from course to Department (Offered By)
    graph.addEdge(`course_${c.id}`, `dept_${c.departmentId}`, 'OFFERED_BY', 1);
  }

  return graph.getGraphData();
}

// DSA: Hash Table Lookup Service
export async function getHashTableDemonstration() {
  const data = await getAllFacultyWorkloadData();
  const allCourses = await db.select().from(courses);
  const depts = await db.select().from(departments);

  const facultyHash = new CustomHashTable<string, any>(17);
  const courseHash = new CustomHashTable<string, any>(17);

  for (const f of data) {
    facultyHash.put(f.facultyCode, f);
    facultyHash.put(`ID_${f.facultyId}`, f);
  }

  for (const c of allCourses) {
    courseHash.put(c.courseCode, c);
  }

  return {
    facultyStats: facultyHash.getStats(),
    courseStats: courseHash.getStats(),
    facultyDistribution: facultyHash.getBucketDistribution(),
    courseDistribution: courseHash.getBucketDistribution(),
  };
}

// DSA: FIFO Request Queue Service
export async function getRequestQueueData() {
  const allReqs = await db
    .select({
      id: requests.id,
      facultyId: requests.facultyId,
      facultyName: users.name,
      facultyCode: faculty.facultyCode,
      requestType: requests.requestType,
      courseId: requests.courseId,
      courseName: courses.courseName,
      courseCode: courses.courseCode,
      targetFacultyId: requests.targetFacultyId,
      description: requests.description,
      priority: requests.priority,
      status: requests.status,
      createdAt: requests.createdAt,
    })
    .from(requests)
    .innerJoin(faculty, eq(requests.facultyId, faculty.id))
    .innerJoin(users, eq(faculty.userId, users.id))
    .leftJoin(courses, eq(requests.courseId, courses.id))
    .orderBy(requests.createdAt);

  const queue = new RequestQueue<any>();
  const pendingItems = allReqs.filter((r) => r.status === 'Pending');

  for (const req of pendingItems) {
    queue.enqueue(req);
  }

  return {
    queueArray: queue.toArray(),
    frontOfQueue: queue.peek(),
    totalPending: queue.size(),
    allRequests: allReqs,
  };
}
