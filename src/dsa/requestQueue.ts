/**
 * DSA Module: FIFO Queue
 *
 * Implements a FIFO (First-In, First-Out) Request Queue for managing:
 *  - Pending workload reduction requests
 *  - Course reassignment requests
 *  - Overload exemption reviews
 */

interface QueueNode<T> {
  value: T;
  next: QueueNode<T> | null;
}

export class RequestQueue<T> {
  private head: QueueNode<T> | null = null;
  private tail: QueueNode<T> | null = null;
  private count: number = 0;

  public enqueue(item: T): void {
    const newNode: QueueNode<T> = { value: item, next: null };
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.count++;
  }

  public dequeue(): T | null {
    if (!this.head) return null;
    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    this.count--;
    return value;
  }

  public peek(): T | null {
    return this.head ? this.head.value : null;
  }

  public isEmpty(): boolean {
    return this.count === 0;
  }

  public size(): number {
    return this.count;
  }

  public toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur) {
      result.push(cur.value);
      cur = cur.next;
    }
    return result;
  }
}
