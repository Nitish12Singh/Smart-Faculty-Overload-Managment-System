import React, { useState, useEffect } from 'react';
import { User, FacultyWorkloadItem, WorkloadSummary, Department, Course, NotificationItem, Role } from './types/index.ts';
import { api, getStoredToken, clearStoredToken, setStoredToken } from './services/api.ts';
import { LoginPage } from './pages/LoginPage.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Chatbot } from './components/Chatbot.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { FacultyDashboard } from './pages/FacultyDashboard.tsx';
import { HodDashboard } from './pages/HodDashboard.tsx';
import { FacultyManagement } from './pages/FacultyManagement.tsx';
import { CourseManagement } from './pages/CourseManagement.tsx';
import { DepartmentsPage } from './pages/DepartmentsPage.tsx';
import { AssignmentsPage } from './pages/AssignmentsPage.tsx';
import { SmartBalancerPage } from './pages/SmartBalancerPage.tsx';
import { DsaLaboratoryPage } from './pages/DsaLaboratoryPage.tsx';
import { RequestsPage } from './pages/RequestsPage.tsx';
import { TimetablePage } from './pages/TimetablePage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { WorkloadMeter } from './components/WorkloadMeter.tsx';
import { Bot, Loader2, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Global shared state
  const [facultyList, setFacultyList] = useState<FacultyWorkloadItem[]>([]);
  const [summary, setSummary] = useState<WorkloadSummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadUniversityData();
    }
  }, [user]);

  const checkAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch (e) {
      console.warn('Session expired or invalid, clearing token');
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUniversityData = async () => {
    try {
      const [fac, sum, depts, crs, notifs] = await Promise.all([
        api.getFacultyList(),
        api.getWorkloadSummary(),
        api.getDepartments(),
        api.getCourses(),
        api.getNotifications(),
      ]);
      setFacultyList(fac);
      setSummary(sum);
      setDepartments(depts);
      setCourses(crs);
      setNotifications(notifs);
    } catch (e) {
      console.error('Failed to load university datasets:', e);
    }
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setActiveTab('dashboard');
  };

  // Quick switch test personas
  const handleSwitchRole = async (targetRole: Role) => {
    let email = 'admin@university.edu';
    let password = 'admin123';
    if (targetRole === 'hod') {
      email = 'hod.cs@university.edu';
      password = 'hod123';
    } else if (targetRole === 'faculty') {
      email = 'sharma@university.edu';
      password = 'faculty123';
    }

    try {
      const res = await api.login({ email, password, role: targetRole });
      setStoredToken(res.token);
      setUser(res.user);
      setActiveTab('dashboard');
    } catch (e) {
      console.error('Failed to switch persona:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold tracking-wide">
          Connecting to Smart Faculty Overload Management System...
        </span>
      </div>
    );
  }

  // 1. First Screen: Professional Login Page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Find current faculty item if logged in user is faculty
  const currentFacultyItem = facultyList.find((f) => f.userId === user.id) || null;
  const pendingRequestsCount = summary?.pendingRequestsCount ?? 0;
  const overloadCount = summary?.overloadFaculty ?? 0;

  // Filter faculty by global search if present
  const displayFacultyList = globalSearch.trim()
    ? facultyList.filter(
        (f) =>
          f.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
          f.facultyCode.toLowerCase().includes(globalSearch.toLowerCase()) ||
          f.specialization.toLowerCase().includes(globalSearch.toLowerCase()) ||
          f.status.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : facultyList;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        onRefreshNotifications={loadUniversityData}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        onSwitchRole={handleSwitchRole}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-Specific Navigation Sidebar */}
        <Sidebar
          role={user.role}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingRequestsCount={pendingRequestsCount}
          overloadCount={overloadCount}
          onOpenChatbot={() => setIsChatbotOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Global Search Results Alert if active */}
            {globalSearch.trim() && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs flex items-center justify-between">
                <span>
                  Filtering records for: <strong>&quot;{globalSearch}&quot;</strong> (
                  {displayFacultyList.length} matching faculty found)
                </span>
                <button
                  onClick={() => setGlobalSearch('')}
                  className="font-bold text-indigo-700 hover:text-indigo-900"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* Render Dashboard based on role */}
            {activeTab === 'dashboard' && (
              <>
                {user.role === 'admin' && (
                  <AdminDashboard
                    summary={summary}
                    facultyList={displayFacultyList}
                    onNavigateTab={setActiveTab}
                    onRefresh={loadUniversityData}
                  />
                )}
                {user.role === 'hod' && (
                  <HodDashboard
                    user={user}
                    facultyList={displayFacultyList}
                    summary={summary}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {user.role === 'faculty' && (
                  <FacultyDashboard
                    user={user}
                    facultyItem={currentFacultyItem}
                    onOpenChatbot={() => setIsChatbotOpen(true)}
                    onRefresh={loadUniversityData}
                  />
                )}
              </>
            )}

            {/* Faculty Profile Tab (Faculty only) */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Personal Faculty Profile</h2>
                  <p className="text-xs text-slate-500">Official institutional academic dossier</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Full Name</span>
                    <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Institutional ID</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentFacultyItem?.facultyCode || 'FAC-CSE-001'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Designation</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentFacultyItem?.designation || 'Associate Professor'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Department</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentFacultyItem?.departmentName || 'Computer Science & Engineering'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                    <span className="text-slate-400 block text-[10px]">Specialization Domain</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentFacultyItem?.specialization || 'Data Structures & Algorithms, Database Systems'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Contracted Max Load</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentFacultyItem?.maxWorkload || 18} Hours / Week
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Current Status</span>
                    <span
                      className={`font-bold text-sm ${
                        currentFacultyItem?.status === 'Overloaded' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {currentFacultyItem?.status || 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Faculty Management Tab */}
            {activeTab === 'faculty' && (
              <FacultyManagement
                facultyList={displayFacultyList}
                departments={departments}
                courses={courses}
                onRefresh={loadUniversityData}
                isAdmin={user.role === 'admin'}
              />
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <CourseManagement
                courses={courses}
                departments={departments}
                onRefresh={loadUniversityData}
                canManage={user.role === 'admin' || user.role === 'hod'}
              />
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <DepartmentsPage
                departments={departments}
                facultyList={displayFacultyList}
                courses={courses}
                onRefresh={loadUniversityData}
                canManage={user.role === 'admin'}
              />
            )}

            {/* Course Assignments Tab */}
            {activeTab === 'assignments' && (
              <AssignmentsPage
                facultyList={displayFacultyList}
                courses={courses}
                onRefresh={loadUniversityData}
                canManage={user.role === 'admin' || user.role === 'hod'}
              />
            )}

            {/* Workload Matrix View Tab */}
            {activeTab === 'workload' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Faculty Workload Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous monitoring of teaching hours, laboratories, tutorials, and capacity headroom
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="p-3.5">Code</th>
                          <th className="p-3.5">Faculty Name</th>
                          <th className="p-3.5">Department</th>
                          <th className="p-3.5">Lecture</th>
                          <th className="p-3.5">Lab (x1.5)</th>
                          <th className="p-3.5">Tutorial</th>
                          <th className="p-3.5">Total Load</th>
                          <th className="p-3.5 min-w-[180px]">Workload Progress</th>
                          <th className="p-3.5">Ceiling</th>
                          <th className="p-3.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {displayFacultyList.map((f) => (
                          <tr key={f.facultyId} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 font-mono font-medium">{f.facultyCode}</td>
                            <td className="p-3.5 font-bold text-slate-900">{f.name}</td>
                            <td className="p-3.5">{f.departmentCode}</td>
                            <td className="p-3.5">{f.teachingHours}h</td>
                            <td className="p-3.5">{f.labHours}h</td>
                            <td className="p-3.5">{f.tutorialHours}h</td>
                            <td className="p-3.5 font-black text-slate-900">{f.totalWorkload}h</td>
                            <td className="p-3.5">
                              <WorkloadMeter
                                current={f.totalWorkload}
                                max={f.maxWorkload}
                                percentage={f.workloadPercentage}
                                status={f.status}
                                showLabels={false}
                                size="sm"
                              />
                            </td>
                            <td className="p-3.5">{f.maxWorkload}h</td>
                            <td className="p-3.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  f.status === 'Overloaded'
                                    ? 'bg-rose-100 text-rose-800'
                                    : f.status === 'Near Limit'
                                    ? 'bg-amber-100 text-amber-800'
                                    : f.status === 'Underload'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Balancer Tab */}
            {activeTab === 'balancer' && (
              <SmartBalancerPage onRefreshAll={loadUniversityData} />
            )}

            {/* DSA Implementation Tab */}
            {activeTab === 'dsa' && <DsaLaboratoryPage />}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <RequestsPage user={user} onRefreshAll={loadUniversityData} />
            )}

            {/* Timetable Tab */}
            {activeTab === 'timetable' && (
              <TimetablePage
                user={user}
                facultyList={facultyList}
                courses={courses}
                canEdit={user.role === 'admin' || user.role === 'hod'}
              />
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <ReportsPage
                facultyList={displayFacultyList}
                summary={summary}
                departments={departments}
              />
            )}

            {/* Settings Tab (Admin only) */}
            {activeTab === 'settings' && <SettingsPage onRefreshAll={loadUniversityData} />}
          </div>
        </main>
      </div>

      {/* Floating Action Button for FacultyAssist Chatbot */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-5 right-5 z-40 p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white shadow-xl shadow-indigo-600/30 ring-2 ring-white/30 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Open FacultyAssist AI Chatbot"
        >
          <Bot className="w-5 h-5 text-white" />
          <span className="text-xs font-bold hidden sm:inline-block pr-1">FacultyAssist</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Floating Chatbot Component */}
      <Chatbot
        user={user}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  );
}
