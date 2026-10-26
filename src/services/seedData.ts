import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import {
  departments,
  users,
  faculty,
  courses,
  facultyCourses,
  workload,
  requests,
  timetable,
  notifications,
  systemSettings,
} from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    // Check if system_settings or users exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Database already seeded. Skipping initial seeding.');
      return;
    }

    console.log('Seeding database with university faculty overload data...');

    // 1. Seed System Settings
    await db.insert(systemSettings).values({
      lectureWeight: 1.0,
      labWeight: 1.5,
      tutorialWeight: 1.0,
      maxNormalThreshold: 18.0,
      warningThreshold: 16.0,
    });

    // 2. Seed Departments
    const deptRows = await db
      .insert(departments)
      .values([
        { departmentName: 'Computer Science & Engineering', departmentCode: 'CSE' },
        { departmentName: 'Electronics & Communication', departmentCode: 'ECE' },
        { departmentName: 'Information Technology', departmentCode: 'IT' },
        { departmentName: 'Mechanical Engineering', departmentCode: 'ME' },
      ])
      .returning();

    const cseDeptId = deptRows[0].id;
    const eceDeptId = deptRows[1].id;
    const itDeptId = deptRows[2].id;

    // 3. Hash Passwords
    const adminPassHash = await bcrypt.hash('admin123', 10);
    const hodPassHash = await bcrypt.hash('hod123', 10);
    const facultyPassHash = await bcrypt.hash('faculty123', 10);

    // 4. Seed Users
    const userRows = await db
      .insert(users)
      .values([
        {
          uid: 'uid_admin_01',
          name: 'Prof. Arvind Kulkarni (Dean Academics)',
          email: 'admin@university.edu',
          passwordHash: adminPassHash,
          role: 'admin',
          departmentId: cseDeptId,
        },
        {
          uid: 'uid_hod_01',
          name: 'Dr. Ramesh Gupta (HOD CSE)',
          email: 'hod.cs@university.edu',
          passwordHash: hodPassHash,
          role: 'hod',
          departmentId: cseDeptId,
        },
        {
          uid: 'uid_fac_sharma',
          name: 'Dr. Amit Sharma',
          email: 'sharma@university.edu',
          passwordHash: facultyPassHash,
          role: 'faculty',
          departmentId: cseDeptId,
        },
        {
          uid: 'uid_fac_singh',
          name: 'Dr. Priya Singh',
          email: 'singh@university.edu',
          passwordHash: facultyPassHash,
          role: 'faculty',
          departmentId: cseDeptId,
        },
        {
          uid: 'uid_fac_verma',
          name: 'Dr. Rajesh Verma',
          email: 'verma@university.edu',
          passwordHash: facultyPassHash,
          role: 'faculty',
          departmentId: cseDeptId,
        },
        {
          uid: 'uid_fac_kapoor',
          name: 'Dr. Ananya Kapoor',
          email: 'kapoor@university.edu',
          passwordHash: facultyPassHash,
          role: 'faculty',
          departmentId: eceDeptId,
        },
        {
          uid: 'uid_fac_mehta',
          name: 'Dr. Vikram Mehta',
          email: 'mehta@university.edu',
          passwordHash: facultyPassHash,
          role: 'faculty',
          departmentId: cseDeptId,
        },
      ])
      .returning();

    const adminUser = userRows[0];
    const hodUser = userRows[1];
    const sharmaUser = userRows[2];
    const singhUser = userRows[3];
    const vermaUser = userRows[4];
    const kapoorUser = userRows[5];
    const mehtaUser = userRows[6];

    // 5. Seed Faculty profiles
    const facultyRows = await db
      .insert(faculty)
      .values([
        {
          userId: sharmaUser.id,
          facultyCode: 'FAC-CSE-001',
          designation: 'Associate Professor',
          specialization: 'Data Structures & Algorithms, Database Systems',
          maxWorkload: 18,
        },
        {
          userId: singhUser.id,
          facultyCode: 'FAC-CSE-002',
          designation: 'Assistant Professor',
          specialization: 'Machine Learning, Artificial Intelligence',
          maxWorkload: 18,
        },
        {
          userId: vermaUser.id,
          facultyCode: 'FAC-CSE-003',
          designation: 'Assistant Professor',
          specialization: 'Database Systems, Computer Networks',
          maxWorkload: 18,
        },
        {
          userId: kapoorUser.id,
          facultyCode: 'FAC-ECE-004',
          designation: 'Associate Professor',
          specialization: 'VLSI & Embedded Systems',
          maxWorkload: 18,
        },
        {
          userId: mehtaUser.id,
          facultyCode: 'FAC-CSE-005',
          designation: 'Assistant Professor',
          specialization: 'Cloud Computing & Distributed Systems',
          maxWorkload: 18,
        },
      ])
      .returning();

    const facSharma = facultyRows[0];
    const facSingh = facultyRows[1];
    const facVerma = facultyRows[2];
    const facKapoor = facultyRows[3];
    const facMehta = facultyRows[4];

    // 6. Seed Courses
    const courseRows = await db
      .insert(courses)
      .values([
        {
          courseCode: 'CS201',
          courseName: 'Data Structures and Algorithms',
          departmentId: cseDeptId,
          credits: 4,
          courseType: 'Theory + Lab',
          lectureHours: 4,
          labHours: 2, // 2 * 1.5 = 3
          tutorialHours: 1, // total = 8
          requiredSpecialization: 'Data Structures & Algorithms',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS303',
          courseName: 'Database Management Systems',
          departmentId: cseDeptId,
          credits: 4,
          courseType: 'Theory + Lab',
          lectureHours: 4,
          labHours: 2, // 2 * 1.5 = 3
          tutorialHours: 1, // total = 8
          requiredSpecialization: 'Database Systems',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS401',
          courseName: 'Advanced Algorithm Design',
          departmentId: cseDeptId,
          credits: 4,
          courseType: 'Theory + Lab',
          lectureHours: 4,
          labHours: 2, // 2 * 1.5 = 3
          tutorialHours: 1, // total = 8
          requiredSpecialization: 'Data Structures & Algorithms',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS305',
          courseName: 'Artificial Intelligence Foundations',
          departmentId: cseDeptId,
          credits: 3,
          courseType: 'Theory + Lab',
          lectureHours: 3,
          labHours: 2, // 3
          tutorialHours: 0, // total = 6
          requiredSpecialization: 'Artificial Intelligence',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS405',
          courseName: 'Deep Learning & Neural Networks',
          departmentId: cseDeptId,
          credits: 3,
          courseType: 'Theory + Lab',
          lectureHours: 3,
          labHours: 2, // 3
          tutorialHours: 0, // total = 6
          requiredSpecialization: 'Machine Learning',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS101',
          courseName: 'Computer Programming in C/C++',
          departmentId: cseDeptId,
          credits: 3,
          courseType: 'Theory',
          lectureHours: 3,
          labHours: 0,
          tutorialHours: 1, // total = 4
          requiredSpecialization: 'Computer Science',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS302',
          courseName: 'Computer Networks & Security',
          departmentId: cseDeptId,
          credits: 3,
          courseType: 'Theory + Lab',
          lectureHours: 3,
          labHours: 2, // 3
          tutorialHours: 0, // total = 6
          requiredSpecialization: 'Computer Networks',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS202',
          courseName: 'Object Oriented Programming',
          departmentId: cseDeptId,
          credits: 3,
          courseType: 'Theory',
          lectureHours: 3,
          labHours: 0,
          tutorialHours: 1, // total = 4
          requiredSpecialization: 'Computer Science',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'EC301',
          courseName: 'VLSI Circuit Design',
          departmentId: eceDeptId,
          credits: 4,
          courseType: 'Theory + Lab',
          lectureHours: 4,
          labHours: 4, // 6
          tutorialHours: 1, // total = 11
          requiredSpecialization: 'VLSI & Embedded Systems',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'EC205',
          courseName: 'Signals & Linear Systems',
          departmentId: eceDeptId,
          credits: 3,
          courseType: 'Theory',
          lectureHours: 3,
          labHours: 0,
          tutorialHours: 1, // total = 4
          requiredSpecialization: 'Electronics',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'CS410',
          courseName: 'Cloud Computing & DevOps',
          departmentId: cseDeptId,
          credits: 3,
          courseType: 'Theory + Lab',
          lectureHours: 3,
          labHours: 2, // 3
          tutorialHours: 0, // total = 6
          requiredSpecialization: 'Cloud Computing',
          semester: 'Fall 2026',
        },
        {
          courseCode: 'IT304',
          courseName: 'Web & Distributed Technologies',
          departmentId: itDeptId,
          credits: 3,
          courseType: 'Theory + Lab',
          lectureHours: 3,
          labHours: 2, // 3
          tutorialHours: 0, // total = 6
          requiredSpecialization: 'Web Technologies',
          semester: 'Fall 2026',
        },
      ])
      .returning();

    const [
      cDSA,
      cDBMS,
      cAdvAlgo,
      cAI,
      cDL,
      cProg,
      cNet,
      cOOP,
      cVLSI,
      cSignals,
      cCloud,
      cWeb,
    ] = courseRows;

    // 7. Assign Courses to Faculty
    // Dr. Sharma: CS201 (8h) + CS303 (8h) + CS401 (8h) = 24h (Overloaded! 24/18 = 133%)
    await db.insert(facultyCourses).values([
      { facultyId: facSharma.id, courseId: cDSA.id },
      { facultyId: facSharma.id, courseId: cDBMS.id },
      { facultyId: facSharma.id, courseId: cAdvAlgo.id },
    ]);

    // Dr. Singh: CS305 (6h) + CS405 (6h) + CS101 (4h) = 16h (Normal / Near Limit! 16/18 = 88.9%)
    await db.insert(facultyCourses).values([
      { facultyId: facSingh.id, courseId: cAI.id },
      { facultyId: facSingh.id, courseId: cDL.id },
      { facultyId: facSingh.id, courseId: cProg.id },
    ]);

    // Dr. Verma: CS302 (6h) + CS202 (4h) = 10h (Underloaded / Available! 10/18 = 55.6%)
    await db.insert(facultyCourses).values([
      { facultyId: facVerma.id, courseId: cNet.id },
      { facultyId: facVerma.id, courseId: cOOP.id },
    ]);

    // Dr. Kapoor: EC301 (11h) + EC205 (4h) = 15h (Normal! 15/18 = 83.3%)
    await db.insert(facultyCourses).values([
      { facultyId: facKapoor.id, courseId: cVLSI.id },
      { facultyId: facKapoor.id, courseId: cSignals.id },
    ]);

    // Dr. Mehta: CS410 (6h) + IT304 (6h) = 12h (Available! 12/18 = 66.7%)
    await db.insert(facultyCourses).values([
      { facultyId: facMehta.id, courseId: cCloud.id },
      { facultyId: facMehta.id, courseId: cWeb.id },
    ]);

    // 8. Seed Workload Stats
    await db.insert(workload).values([
      {
        facultyId: facSharma.id,
        teachingHours: 12,
        labHours: 6, // 6 * 1.5 = 9
        tutorialHours: 3,
        otherHours: 0,
        totalWorkload: 24.0,
        workloadPercentage: 133.3,
        status: 'Overloaded',
      },
      {
        facultyId: facSingh.id,
        teachingHours: 9,
        labHours: 4, // 4 * 1.5 = 6
        tutorialHours: 1,
        otherHours: 0,
        totalWorkload: 16.0,
        workloadPercentage: 88.9,
        status: 'Near Limit',
      },
      {
        facultyId: facVerma.id,
        teachingHours: 6,
        labHours: 2, // 2 * 1.5 = 3
        tutorialHours: 1,
        otherHours: 0,
        totalWorkload: 10.0,
        workloadPercentage: 55.6,
        status: 'Underload',
      },
      {
        facultyId: facKapoor.id,
        teachingHours: 7,
        labHours: 4, // 6
        tutorialHours: 2,
        otherHours: 0,
        totalWorkload: 15.0,
        workloadPercentage: 83.3,
        status: 'Normal',
      },
      {
        facultyId: facMehta.id,
        teachingHours: 6,
        labHours: 4, // 6
        tutorialHours: 0,
        otherHours: 0,
        totalWorkload: 12.0,
        workloadPercentage: 66.7,
        status: 'Underload',
      },
    ]);

    // 9. Seed Workload Adjustment Requests
    await db.insert(requests).values([
      {
        facultyId: facSharma.id,
        requestType: 'Reduction',
        courseId: cDBMS.id,
        targetFacultyId: facVerma.id,
        description:
          'Current teaching commitment is 24 hours (overload by 6h). Requesting reassignment of CS303 Database Systems to Dr. Rajesh Verma who specializes in Database Systems and has 8h headroom.',
        priority: 5, // High priority in Max Heap
        status: 'Pending',
        adminRemarks: null,
      },
      {
        facultyId: facSingh.id,
        requestType: 'Course Reassignment',
        courseId: cProg.id,
        targetFacultyId: facMehta.id,
        description:
          'Requesting shift of CS101 lab assistant hours due to upcoming sponsored IEEE conference research chair duties.',
        priority: 2,
        status: 'Pending',
        adminRemarks: null,
      },
      {
        facultyId: facKapoor.id,
        requestType: 'Exemption',
        courseId: null,
        targetFacultyId: null,
        description: 'Exemption from extra tutorial sessions for accreditation dossier preparation.',
        priority: 3,
        status: 'Approved',
        adminRemarks: 'Approved for 2 weeks during NAAC audit window.',
      },
    ]);

    // 10. Seed Timetable
    await db.insert(timetable).values([
      {
        facultyId: facSharma.id,
        courseId: cDSA.id,
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        room: 'CS-LT101',
      },
      {
        facultyId: facSharma.id,
        courseId: cDBMS.id,
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '12:00',
        room: 'CS-LT102',
      },
      {
        facultyId: facSharma.id,
        courseId: cAdvAlgo.id,
        day: 'Wednesday',
        startTime: '14:00',
        endTime: '16:00',
        room: 'CS-PG01',
      },
      {
        facultyId: facSingh.id,
        courseId: cAI.id,
        day: 'Monday',
        startTime: '11:00',
        endTime: '13:00',
        room: 'AI-LAB3',
      },
      {
        facultyId: facSingh.id,
        courseId: cDL.id,
        day: 'Thursday',
        startTime: '14:00',
        endTime: '16:00',
        room: 'GPU-Cluster',
      },
      {
        facultyId: facVerma.id,
        courseId: cNet.id,
        day: 'Tuesday',
        startTime: '14:00',
        endTime: '16:00',
        room: 'NET-LAB1',
      },
      {
        facultyId: facVerma.id,
        courseId: cOOP.id,
        day: 'Friday',
        startTime: '10:00',
        endTime: '12:00',
        room: 'CS-LT103',
      },
    ]);

    // 11. Seed Notifications
    await db.insert(notifications).values([
      {
        userId: sharmaUser.id,
        title: 'Workload Threshold Warning',
        message: 'Your current workload is 24.0 hours, exceeding the university threshold of 18.0 hours (+6.0h overload).',
        type: 'overload',
        isRead: false,
      },
      {
        userId: adminUser.id,
        title: 'New Workload Reduction Request',
        message: 'Dr. Amit Sharma has submitted an urgent priority reduction request for CS303 Database Systems.',
        type: 'assignment',
        isRead: false,
      },
      {
        userId: hodUser.id,
        title: 'Department Workload Disparity Alert',
        message: 'CSE department has 1 faculty overloaded (+6h) and 2 faculty with available capacity (>6h headroom). Smart Balancer recommendation ready.',
        type: 'optimization',
        isRead: false,
      },
      {
        userId: vermaUser.id,
        title: 'Available Capacity Noticed',
        message: 'You have 8.0 hours available workload capacity in the Fall 2026 semester.',
        type: 'info',
        isRead: true,
      },
    ]);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
