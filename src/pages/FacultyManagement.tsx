import React, { useState } from 'react';
import { FacultyWorkloadItem, Department, Course } from '../types/index.ts';
import { WorkloadMeter } from '../components/WorkloadMeter.tsx';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  GitBranch,
  Search,
  Filter,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface FacultyManagementProps {
  facultyList: FacultyWorkloadItem[];
  departments: Department[];
  courses: Course[];
  onRefresh: () => void;
  isAdmin: boolean;
}

export const FacultyManagement: React.FC<FacultyManagementProps> = ({
  facultyList,
  departments,
  courses,
  onRefresh,
  isAdmin,
}) => {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyWorkloadItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDeptId, setFormDeptId] = useState<number>(1);
  const [formDesignation, setFormDesignation] = useState('Assistant Professor');
  const [formSpec, setFormSpec] = useState('');
  const [formMaxWorkload, setFormMaxWorkload] = useState(18);
  const [assignCourseId, setAssignCourseId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.facultyCode.toLowerCase().includes(search.toLowerCase()) ||
      f.specialization.toLowerCase().includes(search.toLowerCase());

    const matchesDept = filterDept === 'all' || String(f.departmentId) === filterDept;
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.createFaculty({
        name: formName,
        email: formEmail,
        facultyCode: formCode,
        departmentId: formDeptId,
        designation: formDesignation,
        specialization: formSpec,
        maxWorkload: formMaxWorkload,
      });
      setFeedback({ type: 'success', text: 'Faculty member created successfully' });
      setShowAddModal(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create faculty' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.updateFaculty(selectedFaculty.facultyId, {
        name: formName,
        departmentId: formDeptId,
        designation: formDesignation,
        specialization: formSpec,
        maxWorkload: formMaxWorkload,
      });
      setFeedback({ type: 'success', text: 'Faculty updated successfully' });
      setShowEditModal(false);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update faculty' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (facultyId: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? This will unassign all courses.`)) return;
    try {
      await api.deleteFaculty(facultyId);
      setFeedback({ type: 'success', text: `${name} has been removed.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete faculty' });
    }
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty || !assignCourseId) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.assignCourse(selectedFaculty.facultyId, Number(assignCourseId));
      setFeedback({ type: 'success', text: 'Course assigned and workload recalculated' });
      setShowAssignModal(false);
      setAssignCourseId('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to assign course' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignCourse = async (facultyId: number, courseId: number) => {
    try {
      await api.unassignCourse(facultyId, courseId);
      setFeedback({ type: 'success', text: 'Course unassigned from faculty' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to unassign course' });
    }
  };

  const openEdit = (f: FacultyWorkloadItem) => {
    setSelectedFaculty(f);
    setFormName(f.name);
    setFormEmail(f.email);
    setFormCode(f.facultyCode);
    setFormDeptId(f.departmentId);
    setFormDesignation(f.designation);
    setFormSpec(f.specialization);
    setFormMaxWorkload(f.maxWorkload);
    setShowEditModal(true);
  };

  const openAssign = (f: FacultyWorkloadItem) => {
    setSelectedFaculty(f);
    setAssignCourseId('');
    setShowAssignModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormCode('');
    setFormDeptId(1);
    setFormDesignation('Assistant Professor');
    setFormSpec('');
    setFormMaxWorkload(18);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Faculty Directory & Allocation Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic appointments, maximum workload ceilings, and subject assignments
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Faculty</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold underline text-[11px]">
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
            placeholder="Search faculty name, code, specialization..."
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
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.departmentName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">All Workload Statuses</option>
            <option value="Overloaded">Overloaded (&gt;18h)</option>
            <option value="Near Limit">Near Limit (16-18h)</option>
            <option value="Normal">Normal</option>
            <option value="Underload">Underload (&lt;12h)</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map((f) => (
          <div
            key={f.facultyId}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{f.name}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {f.facultyCode} • {f.designation}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                    {f.departmentName}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                    f.status === 'Overloaded'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : f.status === 'Near Limit'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : f.status === 'Underload'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {f.status}
                </span>
              </div>

              {/* Specialization */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-3">
                <span className="font-bold text-slate-700">Specialization:</span> {f.specialization}
              </div>

              {/* Workload Meter */}
              <div className="mt-3">
                <WorkloadMeter
                  current={f.totalWorkload}
                  max={f.maxWorkload}
                  percentage={f.workloadPercentage}
                  status={f.status}
                  size="md"
                />
              </div>

              {/* Assigned Courses List */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Assigned Courses ({f.courses.length})</span>
                  {isAdmin && (
                    <button
                      onClick={() => openAssign(f)}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  )}
                </div>

                {f.courses.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No courses currently assigned.</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {f.courses.map((c) => (
                      <div
                        key={c.courseId}
                        className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100"
                      >
                        <span className="font-medium text-slate-800 truncate max-w-[170px]">
                          {c.courseCode}: {c.courseName}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-bold text-indigo-900 bg-white px-1.5 py-0.2 rounded border border-slate-200 text-[10px]">
                            {c.workloadUnits}h
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleUnassignCourse(f.facultyId, c.courseId)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Unassign"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => openEdit(f)}
                  className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Limit</span>
                </button>
                <button
                  onClick={() => handleDelete(f.facultyId, f.name)}
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
            <h3 className="text-base font-bold mb-4 pb-2 border-b">Add Faculty Member</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Rao"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. s.rao@university.edu"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Faculty Code</label>
                  <input
                    type="text"
                    required
                    placeholder="FAC-CSE-010"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Max Workload (hrs)</label>
                  <input
                    type="number"
                    min={6}
                    max={30}
                    required
                    value={formMaxWorkload}
                    onChange={(e) => setFormMaxWorkload(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Academic Department</label>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName} ({d.departmentCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Designation</label>
                <select
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Specialization Competencies</label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence, Natural Language Processing"
                  value={formSpec}
                  onChange={(e) => setFormSpec(e.target.value)}
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
                  {submitting ? 'Creating...' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">
              Edit Faculty: {selectedFaculty.name}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Maximum Workload Limit (hrs)</label>
                <input
                  type="number"
                  min={6}
                  max={30}
                  required
                  value={formMaxWorkload}
                  onChange={(e) => setFormMaxWorkload(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
                <span className="text-[10px] text-slate-500">
                  Changing this ceiling automatically adjusts overload/underload thresholds.
                </span>
              </div>
              <div>
                <label className="font-semibold block mb-1">Designation</label>
                <select
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Specialization</label>
                <input
                  type="text"
                  value={formSpec}
                  onChange={(e) => setFormSpec(e.target.value)}
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

      {/* Assign Course Modal */}
      {showAssignModal && selectedFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">
              Assign Course to {selectedFaculty.name}
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Current Load: {selectedFaculty.totalWorkload} / {selectedFaculty.maxWorkload}h
            </p>
            <form onSubmit={handleAssignCourse} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Select Course to Assign</label>
                <select
                  required
                  value={assignCourseId}
                  onChange={(e) => setAssignCourseId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">Choose a course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode}: {c.courseName} ({c.workloadUnits}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !assignCourseId}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
