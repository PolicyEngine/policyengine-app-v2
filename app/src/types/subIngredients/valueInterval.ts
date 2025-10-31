import { FOREVER } from '../../constants';

// This is the standard way of serializing intervals, including
// for parameter values within a given policy
export interface ValueInterval {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  value: any;
}

// These are used when reading parameter metadata, as
// the API returns values as map of start dates to values, no intervals
export interface ValuesList {
  [startDate: string]: any; // Maps ISO-formatted date string to value
}

export enum OverlapType {
  NO_OVERLAP_BEFORE = 'NO_OVERLAP_BEFORE',
  NO_OVERLAP_AFTER = 'NO_OVERLAP_AFTER',
  NEW_CONTAINS_EXISTING = 'NEW_CONTAINS_EXISTING',
  EXISTING_CONTAINS_NEW = 'EXISTING_CONTAINS_NEW',
  OVERLAP_START = 'OVERLAP_START',
  OVERLAP_END = 'OVERLAP_END',
}

export class ValueIntervalCollection {
  private intervals: ValueInterval[];

  constructor(input?: ValueInterval[] | ValuesList | ValueIntervalCollection) {
    this.intervals = [];
    if (!input) {
      return;
    }

    if (Array.isArray(input)) {
      this.intervals = [...input];
      return;
    }

    if (input instanceof ValueIntervalCollection) {
      this.intervals = input.getIntervals();
      return;
    }

    if (typeof input === 'object') {
      this.addValuesList(input as ValuesList);
      return;
    }

    // At this point, something has gone wrong
    throw new Error('Invalid input type for ValueIntervalCollection');
  }

  // addInterval(startDate: string, endDate: string, value: any): void {
  addInterval(interval: ValueInterval): void {
    const { startDate, endDate, value } = interval;
    this.validateISODateString(startDate);
    this.validateISODateString(endDate);

    this.validateValidInterval(startDate, endDate);

    const newInterval: ValueInterval = { startDate, endDate, value };

    if (this.intervals.length === 0) {
      this.intervals.push(newInterval);
      return;
    }

    const modifiedIntervals = this.processExistingIntervals(newInterval);
    this.intervals = [...modifiedIntervals, newInterval];
    this.intervals = this.sortIntervalsByStartDate(this.intervals);
    this.intervals = this.mergeSortedAdjacentSameValueIntervals(this.intervals);
  }

  /**
   * Used to add data from Parameter.values, which only maps
   * start dates to values, not end dates
   * @param valuesList A record of date strings to values, e.g.
   * { "2023-01-01": 100, "2023-02-01": 200 }
   */
  addValuesList(valuesList: ValuesList): void {
    const sortedList = this.sortValuesList(valuesList);
    const allStartDates = Object.keys(sortedList);

    for (const [date, value] of Object.entries(sortedList)) {
      // If last entry in Object, add an interval until FOREVER
      if (allStartDates.indexOf(date) === allStartDates.length - 1) {
        this.addInterval({ startDate: date, endDate: FOREVER, value } as ValueInterval);
      }
      // Otherwise, add an interval with end date of the day before the next date in the Object
      else {
        const nextDate = allStartDates[allStartDates.indexOf(date) + 1];
        this.addInterval({
          startDate: date,
          endDate: this.getDayBefore(this.parseDate(nextDate)),
          value,
        } as ValueInterval);
      }
    }
  }

  getAllStartDates(): string[] {
    return this.intervals.map((interval) => interval.startDate);
  }

  getAllEndDates(): string[] {
    return this.intervals.map((interval) => interval.endDate);
  }

  getAllValues(): any[] {
    return this.intervals.map((interval) => interval.value);
  }

  private processExistingIntervals(newInterval: ValueInterval): ValueInterval[] {
    const processedIntervals: ValueInterval[] = [];

    for (const existingInterval of this.intervals) {
      const modifiedIntervals = this.handleIntervalOverlap(existingInterval, newInterval);

      for (const interval of modifiedIntervals) {
        if (this.isValidInterval(interval)) {
          processedIntervals.push(interval);
        }
      }
    }

    return processedIntervals;
  }

  private handleIntervalOverlap(
    existingInterval: ValueInterval,
    newInterval: ValueInterval
  ): ValueInterval[] {
    const overlapType = this.analyzeOverlap(existingInterval, newInterval);

    switch (overlapType) {
      case OverlapType.NO_OVERLAP_BEFORE:
      case OverlapType.NO_OVERLAP_AFTER:
        return [existingInterval];

      case OverlapType.NEW_CONTAINS_EXISTING:
        return [this.createInvalidInterval()];

      case OverlapType.OVERLAP_END:
        return [
          this.createShortenedInterval(
            existingInterval,
            this.getDayBefore(this.parseDate(newInterval.startDate)),
            'end'
          ),
        ];

      case OverlapType.OVERLAP_START:
        return [
          this.createShortenedInterval(
            existingInterval,
            this.getDayAfter(this.parseDate(newInterval.endDate)),
            'start'
          ),
        ];

      case OverlapType.EXISTING_CONTAINS_NEW:
        return [
          this.createShortenedInterval(
            existingInterval,
            this.getDayBefore(this.parseDate(newInterval.startDate)),
            'end'
          ),
          this.createShortenedInterval(
            existingInterval,
            this.getDayAfter(this.parseDate(newInterval.endDate)),
            'start'
          ),
        ];

      default:
        return [existingInterval];
    }
  }

  private analyzeOverlap(existingInterval: ValueInterval, newInterval: ValueInterval): OverlapType {
    const existingStart = this.parseDate(existingInterval.startDate);
    const existingEnd = this.parseDate(existingInterval.endDate);
    const newStart = this.parseDate(newInterval.startDate);
    const newEnd = this.parseDate(newInterval.endDate);

    // No overlap - new interval is completely before existing
    if (newEnd < existingStart) {
      return OverlapType.NO_OVERLAP_BEFORE;
    }

    // No overlap - new interval is completely after existing
    if (newStart > existingEnd) {
      return OverlapType.NO_OVERLAP_AFTER;
    }

    // New interval completely contains existing
    if (newStart <= existingStart && newEnd >= existingEnd) {
      return OverlapType.NEW_CONTAINS_EXISTING;
    }

    // Existing interval completely contains new
    if (existingStart < newStart && existingEnd > newEnd) {
      return OverlapType.EXISTING_CONTAINS_NEW;
    }

    // New interval overlaps the start of existing
    if (newStart <= existingStart && newEnd >= existingStart && newEnd < existingEnd) {
      return OverlapType.OVERLAP_START;
    }

    // New interval overlaps the end of existing
    if (newStart > existingStart && newStart <= existingEnd && newEnd >= existingEnd) {
      return OverlapType.OVERLAP_END;
    }

    // Fallback - shouldn't reach here with valid inputs
    return OverlapType.NO_OVERLAP_AFTER;
  }

  private createShortenedInterval(
    interval: ValueInterval,
    newDate: string,
    shortenFrom: 'start' | 'end'
  ): ValueInterval {
    return {
      ...interval,
      startDate: shortenFrom === 'start' ? newDate : interval.startDate,
      endDate: shortenFrom === 'end' ? newDate : interval.endDate,
    };
  }

  private createInvalidInterval(): ValueInterval {
    return { startDate: '', endDate: '', value: null };
  }

  private isValidInterval(interval: ValueInterval): boolean {
    return interval.startDate !== '' && interval.endDate !== '';
  }

  private parseDate(dateString: string): number {
    return Date.parse(dateString);
  }

  private getDayBefore(timestamp: number): string {
    const ISO_STRING_SEPARATOR = 'T';
    const date = new Date(timestamp);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split(ISO_STRING_SEPARATOR)[0];
  }

  private getDayAfter(timestamp: number): string {
    const ISO_STRING_SEPARATOR = 'T';
    const date = new Date(timestamp);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split(ISO_STRING_SEPARATOR)[0];
  }

  private sortIntervalsByStartDate(intervals: ValueInterval[]): ValueInterval[] {
    return intervals.sort((a, b) => this.parseDate(a.startDate) - this.parseDate(b.startDate));
  }

  private validateISODateString(dateString: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      throw new Error(`Invalid date format: ${dateString}. Expected format is YYYY-MM-DD`);
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
  }

  private validateValidInterval(startDate: string, endDate: string) {
    if (startDate === '' || endDate === '') {
      throw new Error(`Invalid interval: start date and end date cannot be empty`);
    }

    if (this.parseDate(startDate) >= this.parseDate(endDate)) {
      throw new Error(
        `Invalid interval: start date ${startDate} must be before end date ${endDate}`
      );
    }
  }

  private sortValuesList(valuesList: ValuesList): ValuesList {
    return Object.fromEntries(
      Object.entries(valuesList).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    );
  }

  /**
   * Merges adjacent intervals with the same value from a sorted interval list.
   * PRECONDITION: intervals must be sorted by start date
   * @param sortedIntervals - Array of intervals sorted by startDate
   * @returns New array with adjacent same-value intervals merged
   */
  private mergeSortedAdjacentSameValueIntervals(sortedIntervals: ValueInterval[]): ValueInterval[] {
    if (sortedIntervals.length <= 1) {
      return [...sortedIntervals];
    }

    const merged: ValueInterval[] = [];
    let currentInterval = { ...sortedIntervals[0] };

    for (let i = 1; i < sortedIntervals.length; i++) {
      const nextInterval = sortedIntervals[i];

      // Check if current and next intervals are adjacent with same value
      const dayAfterCurrentEnd = this.getDayAfter(this.parseDate(currentInterval.endDate));
      const isAdjacent =
        this.parseDate(nextInterval.startDate) === this.parseDate(dayAfterCurrentEnd);
      const hasSameValue = currentInterval.value === nextInterval.value;

      if (isAdjacent && hasSameValue) {
        // Merge: extend current interval's end date to include next interval
        currentInterval.endDate = nextInterval.endDate;
      } else {
        // No merge: push current interval and start tracking the next one
        merged.push(currentInterval);
        currentInterval = { ...nextInterval };
      }
    }

    // Don't forget to add the last interval
    merged.push(currentInterval);

    return merged;
  }

  getIntervals(): ValueInterval[] {
    return [...this.intervals];
  }

  /**
   * Gets the value at a specific date by finding the interval that contains it
   * @param date - ISO date string (YYYY-MM-DD)
   * @returns The value at that date, or undefined if no interval contains it
   */
  getValueAtDate(date: string): any {
    this.validateISODateString(date);
    const targetDate = this.parseDate(date);

    for (const interval of this.intervals) {
      const startDate = this.parseDate(interval.startDate);
      const endDate = this.parseDate(interval.endDate);

      if (targetDate >= startDate && targetDate <= endDate) {
        return interval.value;
      }
    }

    return undefined;
  }

  clear(): void {
    this.intervals = [];
  }
}
