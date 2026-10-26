/**
 * DSA Module: Priority Queue / Max Heap
 * Identifies faculty members who require immediate workload attention.
 * Priority Score is determined by:
 *  - Workload Percentage (weight 0.40)
 *  - Overload Hours (weight 0.35)
 *  - Number of Assigned Courses (weight 0.15)
 *  - Pending High-Priority Requests (weight 0.10)
 */

export interface PriorityFacultyItem {
  facultyId: number;
  facultyCode: string;
  name: string;
  departmentName: string;
  specialization: string;
  currentWorkload: number;
  maxWorkload: number;
  overloadHours: number;
  workloadPercentage: number;
  assignedCoursesCount: number;
  pendingRequestsCount: number;
  priorityScore: number;
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
}

export class MaxHeapFaculty {
  private heap: PriorityFacultyItem[] = [];

  constructor(items?: PriorityFacultyItem[]) {
    if (items && items.length > 0) {
      this.heap = [...items];
      this.buildHeap();
    }
  }

  // Calculate composite priority score
  public static calculatePriority(
    currentWorkload: number,
    maxWorkload: number,
    courseCount: number,
    pendingRequests: number
  ): { score: number; urgency: 'Critical' | 'High' | 'Medium' | 'Low'; reason: string } {
    const overload = Math.max(0, currentWorkload - maxWorkload);
    const percentage = maxWorkload > 0 ? (currentWorkload / maxWorkload) * 100 : 0;

    // Composite scoring function
    // Base score from overload percentage + overload hours bonus + course fatigue factor + request urgency
    let score = (percentage * 0.45) + (overload * 8.0) + (courseCount * 3.0) + (pendingRequests * 10.0);
    score = Math.round(score * 10) / 10;

    let urgency: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    let reason = 'Workload within standard academic parameters.';

    if (overload >= 4 || percentage >= 130) {
      urgency = 'Critical';
      reason = `Severe overload of +${overload}h (${Math.round(percentage)}% of capacity) across ${courseCount} courses requires urgent reassignment.`;
    } else if (overload > 0 || percentage > 100) {
      urgency = 'High';
      reason = `Exceeds maximum ceiling by +${overload}h. Requires course load reduction.`;
    } else if (percentage >= 85) {
      urgency = 'Medium';
      reason = `Near capacity at ${Math.round(percentage)}%. Monitor for additional assignment constraints.`;
    } else if (percentage < 60) {
      urgency = 'Low';
      reason = `Underutilized at ${Math.round(percentage)}%. Has ${maxWorkload - currentWorkload}h available bandwidth.`;
    }

    return { score, urgency, reason };
  }

  private parent(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private leftChild(i: number): number {
    return 2 * i + 1;
  }

  private rightChild(i: number): number {
    return 2 * i + 2;
  }

  public insert(item: PriorityFacultyItem): void {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }

  public peek(): PriorityFacultyItem | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public extractMax(): PriorityFacultyItem | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return max;
  }

  private heapifyUp(index: number): void {
    let current = index;
    while (current > 0 && this.heap[current].priorityScore > this.heap[this.parent(current)].priorityScore) {
      const p = this.parent(current);
      [this.heap[current], this.heap[p]] = [this.heap[p], this.heap[current]];
      current = p;
    }
  }

  private heapifyDown(index: number): void {
    let maxIndex = index;
    const l = this.leftChild(index);
    const r = this.rightChild(index);

    if (l < this.heap.length && this.heap[l].priorityScore > this.heap[maxIndex].priorityScore) {
      maxIndex = l;
    }

    if (r < this.heap.length && this.heap[r].priorityScore > this.heap[maxIndex].priorityScore) {
      maxIndex = r;
    }

    if (index !== maxIndex) {
      [this.heap[index], this.heap[maxIndex]] = [this.heap[maxIndex], this.heap[index]];
      this.heapifyDown(maxIndex);
    }
  }

  private buildHeap(): void {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.heapifyDown(i);
    }
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public toSortedArray(): PriorityFacultyItem[] {
    const copy = new MaxHeapFaculty([...this.heap]);
    const sorted: PriorityFacultyItem[] = [];
    while (!copy.isEmpty()) {
      sorted.push(copy.extractMax()!);
    }
    return sorted;
  }

  public getRawHeap(): PriorityFacultyItem[] {
    return [...this.heap];
  }
}
