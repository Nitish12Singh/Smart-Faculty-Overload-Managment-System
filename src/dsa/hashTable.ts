/**
 * DSA Module: Hash Table
 *
 * Implements a Hash Table using Separate Chaining (Linked Buckets)
 * to demonstrate O(1) average lookup for:
 *  - Faculty ID
 *  - Course Code / ID
 *  - Department ID
 *  - User ID / Email
 */

interface HashEntry<K, V> {
  key: K;
  value: V;
  next: HashEntry<K, V> | null;
}

export class CustomHashTable<K extends string | number, V> {
  private capacity: number;
  private size: number = 0;
  private buckets: Array<HashEntry<K, V> | null>;
  public collisions: number = 0;

  constructor(capacity = 31) {
    this.capacity = capacity;
    this.buckets = new Array(capacity).fill(null);
  }

  // DJB2 Hash Algorithm for strings / numbers
  private hash(key: K): number {
    const str = String(key);
    let hashVal = 5381;
    for (let i = 0; i < str.length; i++) {
      hashVal = (hashVal * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hashVal % this.capacity);
  }

  public put(key: K, value: V): void {
    const index = this.hash(key);
    let current = this.buckets[index];

    if (!current) {
      this.buckets[index] = { key, value, next: null };
      this.size++;
      this.checkLoadFactor();
      return;
    }

    // Traverse chain
    this.collisions++;
    while (current) {
      if (current.key === key) {
        current.value = value;
        return;
      }
      if (!current.next) break;
      current = current.next;
    }

    current.next = { key, value, next: null };
    this.size++;
    this.checkLoadFactor();
  }

  public get(key: K): V | undefined {
    const index = this.hash(key);
    let current = this.buckets[index];
    while (current) {
      if (current.key === key) {
        return current.value;
      }
      current = current.next;
    }
    return undefined;
  }

  public has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  public remove(key: K): boolean {
    const index = this.hash(key);
    let current = this.buckets[index];
    let prev: HashEntry<K, V> | null = null;

    while (current) {
      if (current.key === key) {
        if (prev) {
          prev.next = current.next;
        } else {
          this.buckets[index] = current.next;
        }
        this.size--;
        return true;
      }
      prev = current;
      current = current.next;
    }
    return false;
  }

  private checkLoadFactor(): void {
    const loadFactor = this.size / this.capacity;
    if (loadFactor > 0.75) {
      this.rehash(this.capacity * 2 + 1);
    }
  }

  private rehash(newCapacity: number): void {
    const oldBuckets = this.buckets;
    this.capacity = newCapacity;
    this.buckets = new Array(newCapacity).fill(null);
    this.size = 0;
    this.collisions = 0;

    for (const head of oldBuckets) {
      let current = head;
      while (current) {
        this.put(current.key, current.value);
        current = current.next;
      }
    }
  }

  public getStats(): {
    capacity: number;
    size: number;
    loadFactor: number;
    collisions: number;
    bucketOccupancy: number;
  } {
    const occupied = this.buckets.filter((b) => b !== null).length;
    return {
      capacity: this.capacity,
      size: this.size,
      loadFactor: Number((this.size / this.capacity).toFixed(3)),
      collisions: this.collisions,
      bucketOccupancy: occupied,
    };
  }

  public getBucketDistribution(): Array<{ index: number; chainLength: number; sampleKeys: string[] }> {
    return this.buckets.map((head, index) => {
      let count = 0;
      const keys: string[] = [];
      let cur = head;
      while (cur) {
        count++;
        if (keys.length < 3) keys.push(String(cur.key));
        cur = cur.next;
      }
      return { index, chainLength: count, sampleKeys: keys };
    });
  }
}
