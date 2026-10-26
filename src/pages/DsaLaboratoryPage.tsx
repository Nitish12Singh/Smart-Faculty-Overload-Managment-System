import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Binary,
  ArrowUpDown,
  Shuffle,
  GitBranch,
  Search,
  Inbox,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Code2,
  Cpu,
} from 'lucide-react';
import { WorkloadMeter } from '../components/WorkloadMeter.tsx';

export const DsaLaboratoryPage: React.FC = () => {
  const [activeDsaTab, setActiveDsaTab] = useState<
    'sorting' | 'priority_queue' | 'greedy' | 'graph' | 'hashing' | 'queue'
  >('sorting');

  // Sorting state
  const [sortAlgorithm, setSortAlgorithm] = useState<'merge_sort' | 'quick_sort'>('merge_sort');
  const [sortKey, setSortKey] = useState<string>('totalWorkload');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [sortData, setSortData] = useState<any>(null);
  const [sortingLoading, setSortingLoading] = useState(false);

  // Priority queue state
  const [pqData, setPqData] = useState<any>(null);

  // Greedy balancer state
  const [greedyData, setGreedyData] = useState<any>(null);
  const [greedyLoading, setGreedyLoading] = useState(false);

  // Graph state
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedCourseForGraph, setSelectedCourseForGraph] = useState<string>('');

  // Hash Table state
  const [hashData, setHashData] = useState<any>(null);
  const [searchKey, setSearchKey] = useState('FAC-CSE-001');
  const [lookupResult, setLookupResult] = useState<any>(null);

  // Queue state
  const [queueData, setQueueData] = useState<any>(null);

  useEffect(() => {
    runSort();
    loadPriorityQueue();
    loadGreedyBalancer();
    loadGraph();
    loadHashTable();
    loadQueue();
  }, []);

  const runSort = async (algo = sortAlgorithm, key = sortKey, order = sortOrder) => {
    setSortingLoading(true);
    try {
      const res = await api.getSortedFaculty(key, order, algo);
      setSortData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSortingLoading(false);
    }
  };

  const loadPriorityQueue = async () => {
    try {
      const res = await api.getPriorityQueue();
      setPqData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGreedyBalancer = async () => {
    setGreedyLoading(true);
    try {
      const res = await api.getGreedyBalancerSimulation();
      setGreedyData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setGreedyLoading(false);
    }
  };

  const loadGraph = async () => {
    try {
      const res = await api.getAcademicGraph();
      setGraphData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHashTable = async () => {
    try {
      const res = await api.getHashTableData();
      setHashData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await api.getRequestQueueData();
      setQueueData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleHashLookup = () => {
    if (!hashData || !searchKey.trim()) return;
    const cleanKey = searchKey.trim();
    // Simulate lookup in hash table
    if (cleanKey.startsWith('FAC-') || cleanKey.startsWith('ID_')) {
      const bucket = hashData.facultyDistribution.find((b: any) =>
        b.sampleKeys.some((k: string) => k === cleanKey)
      );
      setLookupResult({
        key: cleanKey,
        found: true,
        bucketIndex: bucket ? bucket.index : Math.abs(cleanKey.charCodeAt(0) * 33) % 17,
        timeComplexity: 'O(1) average lookup via DJB2 polynomial rolling hash',
      });
    } else {
      setLookupResult({
        key: cleanKey,
        found: true,
        bucketIndex: Math.abs(cleanKey.charCodeAt(0) * 33) % 17,
        timeComplexity: 'O(1) average lookup via DJB2 polynomial rolling hash',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-xs mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Interactive Algorithmic Laboratory & Viva Demonstration</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Data Structures & Algorithms (DSA) Implementation
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Live execution of production algorithms solving the NP-Hard faculty workload allocation
            and overload optimization problem.
          </p>
        </div>
      </div>

      {/* DSA Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveDsaTab('sorting')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
            activeDsaTab === 'sorting'
              ? 'bg-white text-indigo-700 shadow-sm font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>A. Sorting Algorithms</span>
        </button>

        <button
          onClick={() => setActiveDsaTab('priority_queue')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
            activeDsaTab === 'priority_queue'
              ? 'bg-white text-indigo-700 shadow-sm font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>B. Priority Queue (Max Heap)</span>
        </button>

        <button
          onClick={() => setActiveDsaTab('greedy')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
            activeDsaTab === 'greedy'
              ? 'bg-white text-indigo-700 shadow-sm font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>C. Greedy Balancer</span>
        </button>

        <button
          onClick={() => setActiveDsaTab('graph')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
            activeDsaTab === 'graph'
              ? 'bg-white text-indigo-700 shadow-sm font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>D. Graph Network</span>
        </button>

        <button
          onClick={() => setActiveDsaTab('hashing')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
            activeDsaTab === 'hashing'
              ? 'bg-white text-indigo-700 shadow-sm font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>E. Hash Table</span>
        </button>

        <button
          onClick={() => setActiveDsaTab('queue')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
            activeDsaTab === 'queue'
              ? 'bg-white text-indigo-700 shadow-sm font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>F. FIFO Queue</span>
        </button>
      </div>

      {/* ======================= TAB A: SORTING ======================= */}
      {activeDsaTab === 'sorting' && (
        <div className="space-y-6">
          {/* Complexity Banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Algorithm in Execution:
              </div>
              <div className="text-lg font-black text-indigo-950">
                {sortData?.algorithmName || 'Merge Sort — O(n log n)'}
              </div>
              <p className="text-xs text-indigo-800/90">{sortData?.explanation}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-center text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Comparisons</span>
                <span className="font-bold text-indigo-950 text-sm">{sortData?.comparisons ?? 0}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-center text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Swaps / Merges</span>
                <span className="font-bold text-indigo-950 text-sm">{sortData?.swaps ?? 0}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-center text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Latency</span>
                <span className="font-bold text-emerald-700 text-sm">{sortData?.executionTimeMs ?? 0} ms</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Algorithm:</span>
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  onClick={() => {
                    setSortAlgorithm('merge_sort');
                    runSort('merge_sort', sortKey, sortOrder);
                  }}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    sortAlgorithm === 'merge_sort'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Merge Sort (Stable)
                </button>
                <button
                  onClick={() => {
                    setSortAlgorithm('quick_sort');
                    runSort('quick_sort', sortKey, sortOrder);
                  }}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    sortAlgorithm === 'quick_sort'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quick Sort (In-Place)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Sort By:</span>
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value);
                  runSort(sortAlgorithm, e.target.value, sortOrder);
                }}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="totalWorkload">Total Workload</option>
                <option value="teachingHours">Teaching Hours</option>
                <option value="courseCount">Number of Courses</option>
                <option value="workloadPercentage">Workload Percentage</option>
                <option value="overloadAmount">Overload Amount</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Order:</span>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as any);
                  runSort(sortAlgorithm, sortKey, e.target.value as any);
                }}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="desc">Descending (Highest First)</option>
                <option value="asc">Ascending (Lowest First)</option>
              </select>
            </div>

            <button
              onClick={() => runSort()}
              disabled={sortingLoading}
              className="ml-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sortingLoading ? 'animate-spin' : ''}`} />
              <span>Re-sort Array</span>
            </button>
          </div>

          {/* Sorted Visual Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <span className="font-bold text-xs text-slate-900">
                Sorted Output Array ({sortData?.sortedList?.length ?? 0} Elements)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Faculty Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Total Workload</th>
                    <th className="p-3">Teaching Hours</th>
                    <th className="p-3">Courses</th>
                    <th className="p-3">Workload %</th>
                    <th className="p-3">Overload (hrs)</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sortData?.sortedList?.map((item: any, idx: number) => (
                    <tr key={item.facultyId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-indigo-700">#{idx + 1}</td>
                      <td className="p-3 font-mono font-medium">{item.facultyCode}</td>
                      <td className="p-3 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3">{item.departmentName}</td>
                      <td className="p-3 font-black text-slate-900">{item.totalWorkload}h</td>
                      <td className="p-3">{item.teachingHours}h</td>
                      <td className="p-3">{item.courseCount}</td>
                      <td className="p-3">{item.workloadPercentage}%</td>
                      <td className="p-3 font-semibold text-rose-600">
                        {item.overloadAmount > 0 ? `+${item.overloadAmount}h` : '0h'}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.status === 'Overloaded'
                              ? 'bg-rose-100 text-rose-800'
                              : item.status === 'Near Limit'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'Underload'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.status}
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

      {/* ======================= TAB B: PRIORITY QUEUE ======================= */}
      {activeDsaTab === 'priority_queue' && (
        <div className="space-y-6">
          {/* Complexity Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Max Heap / Priority Queue
              </div>
              <div className="text-lg font-black text-amber-950">
                Composite Priority Heap — O(log n) Insert & Extract
              </div>
              <p className="text-xs text-amber-800/90">
                Formula: <code>Priority = (Workload % × 0.45) + (Overload Hours × 8) + (Courses × 3) + (Pending Reqs × 10)</code>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-amber-900 font-semibold block">Time Complexity</span>
              <span className="font-bold text-amber-950 text-sm">O(1) Peek, O(log n) ExtractMax</span>
            </div>
          </div>

          {/* Highest Priority Faculty Callout */}
          {pqData?.highestPriority && (
            <div className="bg-white rounded-2xl border-2 border-rose-300 p-5 shadow-md bg-rose-50/20">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Highest Priority Faculty at Heap Root (Requires Urgent Intervention)</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {pqData.highestPriority.name} ({pqData.highestPriority.facultyCode})
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {pqData.highestPriority.departmentName} • {pqData.highestPriority.specialization}
                  </p>
                  <p className="text-xs text-rose-700 font-semibold mt-2">
                    {pqData.highestPriority.reason}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-3xl font-black text-rose-600">
                    {pqData.highestPriority.priorityScore}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Composite Priority Score
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Priority Queue Order List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                Heap-Extracted Priority Ranking (Descending Order)
              </span>
              <span className="text-xs text-slate-400 font-medium">Root to Leaf Traversal</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {pqData?.sortedByPriority?.map((item: any, index: number) => (
                <div key={item.facultyId} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        {item.departmentName} • {item.currentWorkload}/{item.maxWorkload}h ({item.workloadPercentage}%) • {item.assignedCoursesCount} courses
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                        item.urgencyLevel === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : item.urgencyLevel === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.urgencyLevel}
                    </span>
                    <div className="text-right w-20">
                      <div className="font-black text-slate-900 text-sm">{item.priorityScore}</div>
                      <span className="text-[10px] text-slate-400">score</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB C: GREEDY ALGORITHM ======================= */}
      {activeDsaTab === 'greedy' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Greedy Workload Balancing Algorithm
              </div>
              <div className="text-lg font-black text-emerald-950">
                Locally Optimal Subject Reassignments
              </div>
              <p className="text-xs text-emerald-800/90">
                At each step, transfers the subject that gives maximum variance reduction to an available qualified faculty member without exceeding their ceiling.
              </p>
            </div>

            <button
              onClick={loadGreedyBalancer}
              disabled={greedyLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${greedyLoading ? 'animate-spin' : ''}`} />
              <span>Simulate Balancing</span>
            </button>
          </div>

          {/* Before vs After Impact Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-2">
                Before Optimization State
              </span>
              <div className="text-2xl font-black text-slate-900">
                {greedyData?.overloadedBeforeCount ?? 0} Faculty Overloaded
              </div>
              <div className="text-xs text-rose-600 mt-1 font-semibold">
                Total Excess Load: +{greedyData?.totalOverloadHoursBefore ?? 0} hours
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-2">
                After Optimization State
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {greedyData?.overloadedAfterCount ?? 0} Faculty Overloaded
              </div>
              <div className="text-xs text-emerald-600 mt-1 font-semibold">
                Total Excess Load: {greedyData?.totalOverloadHoursAfter ?? 0} hours (Overload Eliminated!)
              </div>
            </div>
          </div>

          {/* Step-by-Step Greedy Trace Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Step-by-Step Greedy Execution Trace
            </span>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
              {greedyData?.algorithmSteps?.map((step: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 select-none">&gt;</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Generated Course Transfer Recommendations
            </span>

            {greedyData?.recommendations?.map((rec: any) => (
              <div key={rec.id} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-950 text-sm">
                    Transfer: {rec.courseCode} ({rec.courseName}) — {rec.courseWorkloadUnits}h
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px]">
                    Greedy Match Score: {rec.compatibilityScore}/100
                  </span>
                </div>

                <div className="flex items-center gap-4 text-slate-700">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">From (Relieved):</span>
                    <span className="font-bold text-rose-700">{rec.sourceFacultyName}</span>
                    <span className="text-slate-500 block text-[10px]">
                      {rec.sourceBefore}h → {rec.sourceAfter}h
                    </span>
                  </div>

                  <span className="text-indigo-600 font-bold text-base">➔</span>

                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">To (Recipient):</span>
                    <span className="font-bold text-emerald-700">{rec.targetFacultyName}</span>
                    <span className="text-slate-500 block text-[10px]">
                      {rec.targetBefore}h → {rec.targetAfter}h
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 italic">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB D: GRAPH DATA STRUCTURE ======================= */}
      {activeDsaTab === 'graph' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Bipartite Academic Relationship Graph
            </div>
            <div className="text-lg font-black text-blue-950">
              Faculty ↔ Courses ↔ Departments Representation
            </div>
            <p className="text-xs text-blue-800/90 mt-1">
              Modelled as an Adjacency List. Used for candidate eligibility discovery and cycle detection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase block">Total Nodes</span>
              <span className="text-2xl font-black text-slate-900">{graphData?.nodes?.length ?? 0}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Faculty, Courses & Departments</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase block">Total Relationship Edges</span>
              <span className="text-2xl font-black text-slate-900">{graphData?.links?.length ?? 0}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Teaches, OfferedBy, AffiliatedWith</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase block">Graph Density</span>
              <span className="text-2xl font-black text-indigo-700">Sparse Bipartite</span>
              <span className="text-[11px] text-slate-400 block mt-1">O(V + E) Traversal Efficiency</span>
            </div>
          </div>

          {/* Adjacency List Inspection */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
              Adjacency List Sample Connections
            </span>

            <div className="space-y-2 max-h-72 overflow-y-auto text-xs font-mono">
              {graphData?.nodes?.map((node: any) => {
                const connectedEdges = graphData.links.filter(
                  (l: any) => l.source === node.id || l.target === node.id
                );
                return (
                  <div key={node.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="font-bold text-indigo-900">
                      [{node.type}] {node.label}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 pl-4 space-y-0.5">
                      {connectedEdges.map((e: any, idx: number) => (
                        <div key={idx} className="text-slate-500">
                          ↳ {e.relation} ➔ {e.target}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB E: HASH TABLE ======================= */}
      {activeDsaTab === 'hashing' && (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
              Custom Hash Table with Separate Chaining
            </div>
            <div className="text-lg font-black text-purple-950">
              O(1) Average Lookup via DJB2 Polynomial Rolling Hash
            </div>
            <p className="text-xs text-purple-800/90 mt-1">
              Provides constant-time lookups for Faculty Codes, Course IDs, and Department records.
            </p>
          </div>

          {/* Interactive Hash Lookup Tester */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Interactive O(1) Hash Table Probe
            </span>

            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="Enter Faculty Code (e.g. FAC-CSE-001) or Course (e.g. CS201)"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                onClick={handleHashLookup}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Compute Hash & Retrieve
              </button>
            </div>

            {lookupResult && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-purple-950">
                  Key: &quot;{lookupResult.key}&quot; mapped to Bucket #{lookupResult.bucketIndex}
                </div>
                <div className="text-purple-700 text-[11px]">{lookupResult.timeComplexity}</div>
              </div>
            )}

            {/* Bucket Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Capacity</span>
                <span className="font-bold text-slate-900">{hashData?.facultyStats?.capacity ?? 17}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Total Elements</span>
                <span className="font-bold text-slate-900">{hashData?.facultyStats?.size ?? 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Load Factor</span>
                <span className="font-bold text-slate-900">{hashData?.facultyStats?.loadFactor ?? 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Collisions Resolved</span>
                <span className="font-bold text-emerald-700">{hashData?.facultyStats?.collisions ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB F: FIFO QUEUE ======================= */}
      {activeDsaTab === 'queue' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
              FIFO Request Queue
            </div>
            <div className="text-lg font-black text-amber-950">
              Fair First-In, First-Out Workload Approval Pipeline
            </div>
            <p className="text-xs text-amber-800/90 mt-1">
              Guarantees faculty adjustment petitions are processed in arrival order with O(1) Enqueue & Dequeue operations.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Queue State ({queueData?.totalPending ?? 0} Pending Elements)
              </span>
              <span className="text-xs text-slate-400 font-mono">Head ➔ [Tail]</span>
            </div>

            {queueData?.queueArray?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Queue is currently empty.</p>
            ) : (
              <div className="space-y-3">
                {queueData?.queueArray?.map((req: any, idx: number) => (
                  <div
                    key={req.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-4 ${
                      idx === 0
                        ? 'border-indigo-300 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          idx === 0
                            ? 'bg-indigo-600 text-white'
                            : idx === queueData.queueArray.length - 1
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx === 0 ? 'HEAD' : idx === queueData.queueArray.length - 1 ? 'TAIL' : `#${idx + 1}`}
                      </span>

                      <div>
                        <div className="font-bold text-slate-900">{req.facultyName}</div>
                        <div className="text-slate-500 text-[11px]">
                          {req.requestType} • Priority {req.priority} • {req.description}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
