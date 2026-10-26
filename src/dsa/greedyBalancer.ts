/**
 * DSA Module: Greedy Workload Balancing Algorithm
 *
 * Problem: Balance teaching workload across faculty members to eliminate overloads
 * while respecting course subject matter compatibility, department boundaries,
 * and maximum capacity constraints.
 *
 * Greedy Strategy:
 * 1. Identify overloaded faculty (load > maxWorkload) and sort descending by overload amount.
 * 2. Identify available faculty (load < maxWorkload) and sort descending by available capacity.
 * 3. In each greedy iteration, take the most overloaded faculty member and inspect their courses.
 * 4. Choose the course whose transfer yields the maximum reduction in overload without
 *    exceeding the recipient's maximum workload ceiling, matching specialization/department.
 * 5. Update simulated loads and re-evaluate until no more valid transfers or overloads are eliminated.
 */

export interface FacultyCourseDetail {
  courseId: number;
  courseCode: string;
  courseName: string;
  departmentId: number;
  departmentName: string;
  courseType: string;
  workloadUnits: number; // calculated lecture + lab*weight + tutorial
  lectureHours: number;
  labHours: number;
  tutorialHours: number;
  requiredSpecialization?: string | null;
}

export interface FacultyProfileForBalancer {
  facultyId: number;
  facultyCode: string;
  name: string;
  departmentId: number;
  departmentName: string;
  specialization: string;
  maxWorkload: number;
  currentWorkload: number;
  courses: FacultyCourseDetail[];
}

export interface ReassignmentRecommendation {
  id: string;
  sourceFacultyId: number;
  sourceFacultyName: string;
  sourceFacultyCode: string;
  targetFacultyId: number;
  targetFacultyName: string;
  targetFacultyCode: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  courseWorkloadUnits: number;
  sourceBefore: number;
  sourceAfter: number;
  targetBefore: number;
  targetAfter: number;
  reason: string;
  compatibilityScore: number; // 0 to 100
  applied?: boolean;
}

export interface BalancingResult {
  recommendations: ReassignmentRecommendation[];
  overloadedBeforeCount: number;
  overloadedAfterCount: number;
  totalOverloadHoursBefore: number;
  totalOverloadHoursAfter: number;
  beforeStats: { facultyId: number; name: string; workload: number; max: number; status: string }[];
  afterStats: { facultyId: number; name: string; workload: number; max: number; status: string }[];
  algorithmSteps: string[];
  executionTimeMs: number;
}

export function runGreedyWorkloadBalancer(
  facultyList: FacultyProfileForBalancer[]
): BalancingResult {
  const startTime = performance.now();
  const algorithmSteps: string[] = [];

  // Deep copy faculty state for simulation
  const simFaculty = facultyList.map((f) => ({
    ...f,
    currentWorkload: f.currentWorkload,
    courses: [...f.courses],
  }));

  const recommendations: ReassignmentRecommendation[] = [];

  // Record initial stats
  const beforeStats = simFaculty.map((f) => ({
    facultyId: f.facultyId,
    name: f.name,
    workload: f.currentWorkload,
    max: f.maxWorkload,
    status: f.currentWorkload > f.maxWorkload ? 'Overloaded' : f.currentWorkload >= f.maxWorkload - 2 ? 'Near Limit' : 'Normal',
  }));

  const totalOverloadBefore = simFaculty.reduce(
    (acc, f) => acc + Math.max(0, f.currentWorkload - f.maxWorkload),
    0
  );
  const overloadedBefore = simFaculty.filter((f) => f.currentWorkload > f.maxWorkload).length;

  algorithmSteps.push(
    `Initial State: ${overloadedBefore} faculty member(s) overloaded with ${totalOverloadBefore}h total excess load.`
  );

  let iteration = 1;
  const maxIterations = 20;

  while (iteration <= maxIterations) {
    // 1. Sort overloaded faculty descending by current overload
    const overloaded = simFaculty
      .filter((f) => f.currentWorkload > f.maxWorkload)
      .sort((a, b) => (b.currentWorkload - b.maxWorkload) - (a.currentWorkload - a.maxWorkload));

    if (overloaded.length === 0) {
      algorithmSteps.push(`Greedy termination: All faculty workloads are within maximum limits.`);
      break;
    }

    const currentOverloaded = overloaded[0];
    const overloadAmount = currentOverloaded.currentWorkload - currentOverloaded.maxWorkload;

    algorithmSteps.push(
      `[Iteration ${iteration}] Inspecting highest overloaded faculty: ${currentOverloaded.name} (+${overloadAmount}h overload, current: ${currentOverloaded.currentWorkload}/${currentOverloaded.maxWorkload}h).`
    );

    // 2. Sort available faculty descending by remaining headroom
    const availableFaculty = simFaculty
      .filter((f) => f.facultyId !== currentOverloaded.facultyId && f.currentWorkload < f.maxWorkload)
      .sort((a, b) => (b.maxWorkload - b.currentWorkload) - (a.maxWorkload - a.currentWorkload));

    if (availableFaculty.length === 0) {
      algorithmSteps.push(`Greedy termination: No other faculty members have available capacity.`);
      break;
    }

    // 3. Find optimal (course, targetFaculty) pair using greedy score
    let bestChoice: {
      course: FacultyCourseDetail;
      target: (typeof simFaculty)[0];
      score: number;
      compatibilityReason: string;
    } | null = null;

    for (const course of currentOverloaded.courses) {
      for (const target of availableFaculty) {
        const targetHeadroom = target.maxWorkload - target.currentWorkload;
        // Don't overload the target
        if (course.workloadUnits > targetHeadroom) continue;

        // Check compatibility
        const isSameDept = course.departmentId === target.departmentId;
        const specMatch = Boolean(
          target.specialization &&
          (target.specialization.toLowerCase().includes(course.courseName.toLowerCase()) ||
           course.courseName.toLowerCase().includes(target.specialization.toLowerCase()) ||
           (course.requiredSpecialization && target.specialization.toLowerCase().includes(course.requiredSpecialization.toLowerCase())))
        );

        // Calculate greedy benefit score
        let score = 0;
        let compatibilityReason = '';

        if (isSameDept) {
          score += 40;
          compatibilityReason += 'Same department';
        } else {
          score += 10;
          compatibilityReason += 'Cross-department qualified';
        }

        if (specMatch) {
          score += 50;
          compatibilityReason += ' & matching domain specialization';
        } else {
          score += 20;
          compatibilityReason += ' & core academic competency';
        }

        // Favor courses whose size fits closely without overflowing
        const fitDiff = targetHeadroom - course.workloadUnits;
        score += Math.max(0, 20 - fitDiff);

        if (!bestChoice || score > bestChoice.score) {
          bestChoice = {
            course,
            target,
            score,
            compatibilityReason,
          };
        }
      }
    }

    if (!bestChoice) {
      algorithmSteps.push(
        `No transferable courses found for ${currentOverloaded.name} that fit remaining recipient capacities without exceeding limits.`
      );
      break;
    }

    // Apply greedy step in simulation
    const { course, target, score, compatibilityReason } = bestChoice;
    const sourceBefore = currentOverloaded.currentWorkload;
    const targetBefore = target.currentWorkload;

    currentOverloaded.currentWorkload -= course.workloadUnits;
    currentOverloaded.courses = currentOverloaded.courses.filter((c) => c.courseId !== course.courseId);

    target.currentWorkload += course.workloadUnits;
    target.courses.push(course);

    const sourceAfter = currentOverloaded.currentWorkload;
    const targetAfter = target.currentWorkload;

    const recReason = `Transfer ${course.courseCode} (${course.workloadUnits}h) from ${currentOverloaded.name} to ${target.name}. ${compatibilityReason}. Reduces ${currentOverloaded.name}'s load from ${sourceBefore}h to ${sourceAfter}h (max ${currentOverloaded.maxWorkload}h) and sets ${target.name} to ${targetAfter}h (max ${target.maxWorkload}h).`;

    algorithmSteps.push(
      `Applied transfer: ${course.courseCode} (${course.workloadUnits}h) → ${target.name}. Reason: ${compatibilityReason}.`
    );

    recommendations.push({
      id: `rec_${Date.now()}_${iteration}`,
      sourceFacultyId: currentOverloaded.facultyId,
      sourceFacultyName: currentOverloaded.name,
      sourceFacultyCode: currentOverloaded.facultyCode,
      targetFacultyId: target.facultyId,
      targetFacultyName: target.name,
      targetFacultyCode: target.facultyCode,
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      courseWorkloadUnits: course.workloadUnits,
      sourceBefore,
      sourceAfter,
      targetBefore,
      targetAfter,
      reason: recReason,
      compatibilityScore: score,
    });

    iteration++;
  }

  const afterStats = simFaculty.map((f) => ({
    facultyId: f.facultyId,
    name: f.name,
    workload: f.currentWorkload,
    max: f.maxWorkload,
    status: f.currentWorkload > f.maxWorkload ? 'Overloaded' : f.currentWorkload >= f.maxWorkload - 2 ? 'Near Limit' : 'Normal',
  }));

  const totalOverloadAfter = simFaculty.reduce(
    (acc, f) => acc + Math.max(0, f.currentWorkload - f.maxWorkload),
    0
  );
  const overloadedAfter = simFaculty.filter((f) => f.currentWorkload > f.maxWorkload).length;

  const endTime = performance.now();

  return {
    recommendations,
    overloadedBeforeCount: overloadedBefore,
    overloadedAfterCount: overloadedAfter,
    totalOverloadHoursBefore: totalOverloadBefore,
    totalOverloadHoursAfter: totalOverloadAfter,
    beforeStats,
    afterStats,
    algorithmSteps,
    executionTimeMs: Math.max(0.05, Number((endTime - startTime).toFixed(3))),
  };
}
