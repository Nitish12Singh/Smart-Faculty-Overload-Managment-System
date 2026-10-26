import React, { useState } from 'react';
import { Department, FacultyWorkloadItem, Course } from '../types/index.ts';
import { Building2, Plus, Users, BookOpen } from 'lucide-react';
import { api } from '../services/api.ts';

interface DepartmentsPageProps {
  departments: Department[];
  facultyList: FacultyWorkloadItem[];
  courses: Course[];
  onRefresh: () => void;
  canManage: boolean;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({
  departments,
  facultyList,
  courses,
  onRefresh,
  canManage,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await api.createDepartment({ departmentName: deptName, departmentCode: deptCode.toUpperCase() });
      setMsg({ type: 'success', text: 'Department added successfully' });
      setShowAddModal(false);
      setDeptName('');
      setDeptCode('');
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to create department' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Departments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional faculties, course offerings, and affiliated professors
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
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

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((d) => {
          const deptFaculty = facultyList.filter((f) => f.departmentId === d.id);
          const deptCourses = courses.filter((c) => c.departmentId === d.id);
          const totalLoad = deptFaculty.reduce((acc, f) => acc + f.totalWorkload, 0);

          return (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700">
                    {d.departmentCode}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{d.departmentName}</h3>
                    <span className="text-[11px] text-slate-500">Code: {d.departmentCode}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-slate-100 font-bold text-xs rounded-lg text-slate-700">
                  {totalLoad} Workload Units
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Faculty</span>
                    <span className="font-bold text-slate-800">{deptFaculty.length} members</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Courses</span>
                    <span className="font-bold text-slate-800">{deptCourses.length} offerings</span>
                  </div>
                </div>
              </div>

              {/* Faculty names preview */}
              <div className="text-[11px] text-slate-500 pt-1">
                <span className="font-semibold text-slate-600">Faculty: </span>
                {deptFaculty.map((f) => f.name).join(', ') || 'No faculty assigned yet.'}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">Add Academic Department</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical & Electronics Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EEE"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
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
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
