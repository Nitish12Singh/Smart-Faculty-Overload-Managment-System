/**
 * DSA Module: Sorting Algorithms
 * Implements Merge Sort and Quick Sort for Faculty Workload Sorting
 */

export interface FacultySortable {
  facultyId: number;
  facultyCode: string;
  name: string;
  departmentName: string;
  specialization: string;
  teachingHours: number;
  courseCount: number;
  totalWorkload: number;
  maxWorkload: number;
  workloadPercentage: number;
  overloadAmount: number;
  status: string;
}

export type SortKey = 'totalWorkload' | 'teachingHours' | 'courseCount' | 'workloadPercentage' | 'overloadAmount';
export type SortOrder = 'asc' | 'desc';
export type SortAlgorithm = 'merge_sort' | 'quick_sort';

export interface SortResult {
  sortedList: FacultySortable[];
  algorithm: SortAlgorithm;
  algorithmName: string;
  timeComplexity: string;
  spaceComplexity: string;
  comparisons: number;
  swaps: number;
  executionTimeMs: number;
  explanation: string;
}

/**
 * Merge Sort Implementation
 * Time Complexity: O(n log n) Best, Average, Worst
 * Space Complexity: O(n) auxiliary space
 * Stable sorting algorithm
 */
export function mergeSortFaculty(
  arr: FacultySortable[],
  key: SortKey,
  order: SortOrder = 'desc'
): SortResult {
  const startTime = performance.now();
  let comparisons = 0;
  let swaps = 0;

  function compare(a: FacultySortable, b: FacultySortable): number {
    comparisons++;
    const valA = a[key];
    const valB = b[key];
    if (order === 'asc') {
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    } else {
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    }
  }

  function merge(left: FacultySortable[], right: FacultySortable[]): FacultySortable[] {
    const result: FacultySortable[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
      swaps++;
    }

    while (i < left.length) {
      result.push(left[i]);
      i++;
    }
    while (j < right.length) {
      result.push(right[j]);
      j++;
    }

    return result;
  }

  function divideAndConquer(items: FacultySortable[]): FacultySortable[] {
    if (items.length <= 1) return items;
    const mid = Math.floor(items.length / 2);
    const left = divideAndConquer(items.slice(0, mid));
    const right = divideAndConquer(items.slice(mid));
    return merge(left, right);
  }

  const sortedList = divideAndConquer([...arr]);
  const endTime = performance.now();

  return {
    sortedList,
    algorithm: 'merge_sort',
    algorithmName: 'Merge Sort — O(n log n)',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    comparisons,
    swaps,
    executionTimeMs: Math.max(0.01, Number((endTime - startTime).toFixed(3))),
    explanation: `Merge Sort recursively divided ${arr.length} faculty entries into subarrays and merged them in ${comparisons} comparisons. Guaranteed O(n log n) stable sorting.`,
  };
}

/**
 * Quick Sort Implementation
 * Time Complexity: O(n log n) Average/Best, O(n^2) Worst
 * Space Complexity: O(log n) auxiliary stack space
 * In-place partitioning
 */
export function quickSortFaculty(
  arr: FacultySortable[],
  key: SortKey,
  order: SortOrder = 'desc'
): SortResult {
  const startTime = performance.now();
  let comparisons = 0;
  let swaps = 0;
  const list = [...arr];

  function compare(a: FacultySortable, b: FacultySortable): number {
    comparisons++;
    const valA = a[key];
    const valB = b[key];
    if (order === 'asc') {
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    } else {
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    }
  }

  function partition(low: number, high: number): number {
    const pivot = list[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (compare(list[j], pivot) <= 0) {
        i++;
        [list[i], list[j]] = [list[j], list[i]];
        swaps++;
      }
    }
    [list[i + 1], list[high]] = [list[high], list[i + 1]];
    swaps++;
    return i + 1;
  }

  function quickSortHelper(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      quickSortHelper(low, pi - 1);
      quickSortHelper(pi + 1, high);
    }
  }

  if (list.length > 1) {
    quickSortHelper(0, list.length - 1);
  }
  const endTime = performance.now();

  return {
    sortedList: list,
    algorithm: 'quick_sort',
    algorithmName: 'Quick Sort — O(n log n)',
    timeComplexity: 'O(n log n) average',
    spaceComplexity: 'O(log n)',
    comparisons,
    swaps,
    executionTimeMs: Math.max(0.01, Number((endTime - startTime).toFixed(3))),
    explanation: `Quick Sort partitioned around pivot elements in ${swaps} swaps and ${comparisons} comparisons. Highly cache-friendly in-place sort.`,
  };
}
