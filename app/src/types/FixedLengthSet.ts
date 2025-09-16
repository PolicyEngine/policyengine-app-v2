export type FixedLengthSet<T = any> = (T | null)[];

export function FixedLengthSet<T = any>(length: number): FixedLengthSet<T> {
  return Array(length).fill(null);
}

// Resize methods (available but NOT used in reducer)
export function lengthen<T>(set: FixedLengthSet<T>, count: number): FixedLengthSet<T> {
  return [...set, ...Array(count).fill(null)];
}

export function shorten<T>(set: FixedLengthSet<T>, count: number): FixedLengthSet<T> {
  return set.slice(0, Math.max(0, set.length - count));
}

export function changeSizeTo<T>(set: FixedLengthSet<T>, newSize: number): FixedLengthSet<T> {
  const currentSize = set.length;
  if (newSize > currentSize) {
    return lengthen(set, newSize - currentSize);
  } else if (newSize < currentSize) {
    return shorten(set, currentSize - newSize);
  }
  return set;
}

// Core methods for fixed-size operations
export function setAt<T>(set: FixedLengthSet<T>, index: number, value: T | null): FixedLengthSet<T> {
  if (index < 0 || index >= set.length) {
    throw new Error(`Index ${index} out of bounds for FixedLengthSet of length ${set.length}`);
  }
  const newSet = [...set];
  newSet[index] = value;
  return newSet;
}

export function removeAt<T>(set: FixedLengthSet<T>, index: number): FixedLengthSet<T> {
  return setAt(set, index, null);
}

export function get<T>(set: FixedLengthSet<T>, index: number): T | null {
  return set[index] ?? null;
}

export function findFirstEmpty<T>(set: FixedLengthSet<T>): number {
  return set.findIndex(item => item === null);
}

export function findIndex<T>(set: FixedLengthSet<T>, predicate: (value: T | null, index: number) => boolean): number {
  return set.findIndex(predicate);
}

export function getCompactArray<T>(set: FixedLengthSet<T>): T[] {
  return set.filter((item): item is T => item !== null);
}

export function hasEmpty<T>(set: FixedLengthSet<T>): boolean {
  return set.includes(null);
}

export function isFull<T>(set: FixedLengthSet<T>): boolean {
  return !hasEmpty(set);
}

export function swap<T>(set: FixedLengthSet<T>, index1: number, index2: number): FixedLengthSet<T> {
  if (index1 < 0 || index1 >= set.length || index2 < 0 || index2 >= set.length) {
    throw new Error('Indices out of bounds for swap operation');
  }
  const newSet = [...set];
  const temp = newSet[index1];
  newSet[index1] = newSet[index2];
  newSet[index2] = temp;
  return newSet;
}

export function fromArray<T>(arr: (T | null)[]): FixedLengthSet<T> {
  return [...arr];
}