import React, { useState } from 'react';
import { FacultyWorkloadItem, WorkloadSummary, Department } from '../types/index.ts';
import { FileText, Download, BarChart3, PieChart, Printer, CheckCircle2 } from 'lucide-react';
import { getStoredToken } from '../services/api.ts';

interface ReportsPageProps {
  facultyList: FacultyWorkloadItem[];
  summary: WorkloadSummary | null;
  departments: Department[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  facultyList,
  summary,
  departments,
}) => {
  const [selectedReportType, setSelectedReportType] = useState('full_roster');
  const [deptFilter, setDeptFilter] = useState('all');

  const filteredFaculty = facultyList.filter((f) =>
    deptFilter === 'all' ? true : String(f.departmentId) === deptFilter
  );

  const handleExportCsv = () => {
    const token = getStoredToken();
    window.location.href = `/api/reports/workload-csv?token=${token}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Workload Analytics & Compliance Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready institutional reports for Deanery, UGC/AICTE/ABET accreditation, and NAAC dossiers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700">Report Focus:</span>
        <select
          value={selectedReportType}
          onChange={(e) => setSelectedReportType(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
        >
          <option value="full_roster">Comprehensive Faculty Workload Roster</option>
          <option value="overload_audit">Overload & Over-Allocation Audit</option>
          <option value="department_summary">Departmental Capacity & Headroom Distribution</option>
          <option value="optimization_summary">Greedy Balancing Impact Summary</option>
        </select>

        <span className="font-bold text-slate-700 ml-4">Filter Department:</span>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
        >
          <option value="all">All Academic Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.departmentName}
            </option>
          ))}
        </select>
      </div>

      {/* Report Canvas / Table for Screen & Print */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Official Institutional Document
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-2">
              National Engineering University — Academic Year 2026–2027
            </h3>
            <p className="text-xs text-slate-500">
              Report Subject: {selectedReportType.replace(/_/g, ' ').toUpperCase()} • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="text-right text-xs text-slate-600">
            <div>
              Total Faculty Audited: <strong>{filteredFaculty.length}</strong>
            </div>
            <div>
              Department Filter: <strong>{deptFilter === 'all' ? 'University-Wide' : 'Departmental'}</strong>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3 border-r border-slate-200">Faculty ID</th>
                <th className="p-3 border-r border-slate-200">Faculty Name</th>
                <th className="p-3 border-r border-slate-200">Department</th>
                <th className="p-3 border-r border-slate-200">Designation</th>
                <th className="p-3 border-r border-slate-200">Lecture (h)</th>
                <th className="p-3 border-r border-slate-200">Lab (h)</th>
                <th className="p-3 border-r border-slate-200">Tutorial (h)</th>
                <th className="p-3 border-r border-slate-200">Total Workload</th>
                <th className="p-3 border-r border-slate-200">Max Allowed</th>
                <th className="p-3 border-r border-slate-200">Workload %</th>
                <th className="p-3 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredFaculty.map((f) => (
                <tr key={f.facultyId} className="hover:bg-slate-50/80">
                  <td className="p-3 font-mono font-medium border-r border-slate-100">{f.facultyCode}</td>
                  <td className="p-3 font-bold border-r border-slate-100">{f.name}</td>
                  <td className="p-3 border-r border-slate-100">{f.departmentCode}</td>
                  <td className="p-3 text-slate-600 border-r border-slate-100">{f.designation}</td>
                  <td className="p-3 border-r border-slate-100">{f.teachingHours}h</td>
                  <td className="p-3 border-r border-slate-100">{f.labHours}h</td>
                  <td className="p-3 border-r border-slate-100">{f.tutorialHours}h</td>
                  <td className="p-3 font-black border-r border-slate-100 text-indigo-950">{f.totalWorkload}h</td>
                  <td className="p-3 border-r border-slate-100">{f.maxWorkload}h</td>
                  <td className="p-3 border-r border-slate-100 font-bold">{f.workloadPercentage}%</td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
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

        {/* Summary Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Official seal verified by Automated Faculty Workload Optimization Controller</span>
          <span className="font-semibold text-slate-700">Dean of Academic Affairs</span>
        </div>
      </div>
    </div>
  );
};
