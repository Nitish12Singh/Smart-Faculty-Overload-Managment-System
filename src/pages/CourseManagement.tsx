import React, { useState } from 'react';
import { Course, Department } from '../types/index.ts';
import { BookOpen, Plus, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { api } from '../services/api.ts';

interface CourseManagementProps {
  courses: Course[];
  departments: Department[];
  onRefresh: () => void;
  canManage: boolean;
}

export const CourseManagement: React.FC<CourseManagementProps> = ({
  courses,
  departments,
  onRefresh,
  canManage,
}) => {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form states
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [deptId, setDeptId] = useState<number>(1);
  const [credits, setCredits] = useState(4);
  const [courseType, setCourseType] = useState('Theory + Lab');
  const [lectureHours, setLectureHours] = useState(4);
  const [labHours, setLabHours] = useState(2);
  const [tutorialHours, setTutorialHours] = useState(1);
  const [reqSpec, setReqSpec] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      c.courseName.toLowerCase().includes(search.toLowerCase()) ||
      (c.requiredSpecialization || '').toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || String(c.departmentId) === filterDept;
    return matchSearch && matchDept;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await api.createCourse({
        courseCode,
        courseName,
        departmentId: deptId,
        credits,
        courseType,
        lectureHours,
        labHours,
        tutorialHours,
        requiredSpecialization: reqSpec,
      });
      setMsg({ type: 'success', text: 'Course created successfully' });
      setShowAddModal(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to create course' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSubmitting(true);
    setMsg(null);
    try {
      await api.updateCourse(selectedCourse.id, {
        courseName,
        credits,
        courseType,
        lectureHours,
        labHours,
        tutorialHours,
        requiredSpecialization: reqSpec,
      });
      setMsg({ type: 'success', text: 'Course updated and faculty workloads recomputed' });
      setShowEditModal(false);
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update course' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete ${code}?`)) return;
    try {
      await api.deleteCourse(id);
      setMsg({ type: 'success', text: `${code} removed successfully.` });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to delete course' });
    }
  };

  const openEdit = (c: Course) => {
    setSelectedCourse(c);
    setCourseCode(c.courseCode);
    setCourseName(c.courseName);
    setDeptId(c.departmentId);
    setCredits(c.credits);
    setCourseType(c.courseType);
    setLectureHours(c.lectureHours);
    setLabHours(c.labHours);
    setTutorialHours(c.tutorialHours);
    setReqSpec(c.requiredSpecialization || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setCourseCode('');
    setCourseName('');
    setDeptId(1);
    setCredits(4);
    setCourseType('Theory + Lab');
    setLectureHours(4);
    setLabHours(2);
    setTutorialHours(1);
    setReqSpec('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Courses Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure lecture hours, laboratory sessions, credits, and domain specialization requirements
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        )}
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search course code, title, or specialization requirement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">All Academic Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.departmentName} ({d.departmentCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                  {c.courseCode}
                </span>
                <span className="font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                  {c.credits} Credits
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mt-2">{c.courseName}</h3>
              <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                {c.departmentName}
              </div>

              {/* Workload Breakdown Pill Box */}
              <div className="bg-slate-50 rounded-xl p-2.5 mt-3 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Lecture: {c.lectureHours}h</span>
                  <span>Lab: {c.labHours}h (x1.5 = {c.labHours * 1.5}h)</span>
                  <span>Tut: {c.tutorialHours}h</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                  <span>Total Workload Weight:</span>
                  <span className="text-indigo-900">{c.workloadUnits} Hours</span>
                </div>
              </div>

              {c.requiredSpecialization && (
                <div className="text-[11px] text-slate-500 mt-2">
                  <span className="font-semibold text-slate-700">Specialization:</span>{' '}
                  {c.requiredSpecialization}
                </div>
              )}

              {/* Currently Assigned Faculty */}
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px]">
                <span className="font-semibold text-slate-600 block mb-1">
                  Currently Assigned Faculty:
                </span>
                {c.assignedFaculty && c.assignedFaculty.length > 0 ? (
                  <div className="space-y-0.5">
                    {c.assignedFaculty.map((f, i) => (
                      <span key={i} className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mr-1">
                        {f.facultyName} ({f.facultyCode})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">
                    ⚠️ Unassigned (Requires Instructor)
                  </span>
                )}
              </div>
            </div>

            {canManage && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => openEdit(c)}
                  className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.courseCode)}
                  className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">Add New Academic Course</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS306"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Operating Systems"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Offering Department</label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Lecture (h)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={lectureHours}
                    onChange={(e) => setLectureHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Lab (h)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={labHours}
                    onChange={(e) => setLabHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tutorial (h)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={tutorialHours}
                    onChange={(e) => setTutorialHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Required Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems, Systems Architecture"
                  value={reqSpec}
                  onChange={(e) => setReqSpec(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">
              Edit Course: {selectedCourse.courseCode}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Lecture (h)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={lectureHours}
                    onChange={(e) => setLectureHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Lab (h)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={labHours}
                    onChange={(e) => setLabHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tutorial (h)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={tutorialHours}
                    onChange={(e) => setTutorialHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Required Specialization</label>
                <input
                  type="text"
                  value={reqSpec}
                  onChange={(e) => setReqSpec(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
