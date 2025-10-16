/**
 * Metadata about a calculation
 * Tracks what type of calculation and where results should be saved
 */
export interface CalcMetadata {
  /**
   * The ID of the entity being calculated (reportId or simulationId)
   */
  calcId: string;

  /**
   * The type of calculation being performed
   */
  calcType: 'economy' | 'household';

  /**
   * Where the calculation result should be saved
   */
  targetType: 'report' | 'simulation';

  /**
   * Timestamp when calculation started (milliseconds since epoch)
   */
  startedAt: number;
}
