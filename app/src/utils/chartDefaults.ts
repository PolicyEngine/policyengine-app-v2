/**
 * Smart defaults for chart configuration
 */

export interface DataRow {
  [key: string]: any;
}

export interface SmartChartDefaults {
  xAxisColumns: string[];
  yAxisColumns: string[];
  columnOrder: string[];
  visibleColumns: string[];
  xAxisTitle: string;
  yAxisTitle: string;
}

/**
 * Determine if a column has all identical values
 */
function hasAllSameValues(rows: DataRow[], column: string): boolean {
  if (rows.length === 0) return true;
  const firstValue = rows[0][column];
  return rows.every(row => row[column] === firstValue);
}

/**
 * Determine if a column has mostly null/undefined values
 */
function isMostlyEmpty(rows: DataRow[], column: string): boolean {
  if (rows.length === 0) return true;
  const nonNullCount = rows.filter(row =>
    row[column] !== null &&
    row[column] !== undefined &&
    row[column] !== '' &&
    row[column] !== '-'
  ).length;
  return nonNullCount / rows.length < 0.5;
}

/**
 * Get smart column ordering for tables
 */
function getColumnOrder(columns: string[], isAggregateChange: boolean, rows: DataRow[]): string[] {
  const order: string[] = [];

  // Priority order for aggregate changes
  if (isAggregateChange) {
    const priorityOrder = [
      // What: the metric being measured
      'Variable',

      // Result: the main values of interest
      'Change',
      'Relative change (%)',

      // Context: filters and conditions
      'Quantile ≤',
      'Quantile ≥',
      'Filter variable',
      'Filter value',
      'Filter ≥',
      'Filter ≤',
      'Quantile value',
      'Year',

      // Comparison values
      'Baseline',
      'Comparison',

      // Technical details: simulations and metadata
      'Baseline sim',
      'Comparison sim',
      'Function',
      'Entity',
    ];

    priorityOrder.forEach(col => {
      if (columns.includes(col)) {
        order.push(col);
      }
    });
  } else {
    // Priority order for regular aggregates
    const priorityOrder = [
      // What: the metric being measured
      'Variable',

      // Result: the main value
      'Value',

      // Context: filters and conditions
      'Quantile ≤',
      'Quantile ≥',
      'Filter variable',
      'Filter value',
      'Filter ≥',
      'Filter ≤',
      'Quantile value',
      'Year',

      // Technical details: simulation and metadata
      'Simulation',
      'Function',
      'Entity',
    ];

    priorityOrder.forEach(col => {
      if (columns.includes(col)) {
        order.push(col);
      }
    });
  }

  // Separate remaining columns into those with values and those mostly null
  const remainingColumns = columns.filter(col => !order.includes(col));
  const columnsWithValues: string[] = [];
  const columnsWithNulls: string[] = [];

  remainingColumns.forEach(col => {
    if (isMostlyEmpty(rows, col)) {
      columnsWithNulls.push(col);
    } else {
      columnsWithValues.push(col);
    }
  });

  // Add columns with values, then columns with nulls
  return [...order, ...columnsWithValues, ...columnsWithNulls];
}

/**
 * Calculate smart defaults for chart configuration
 */
export function getSmartChartDefaults(
  rows: DataRow[],
  columns: string[],
  isAggregateChange: boolean
): SmartChartDefaults {
  if (rows.length === 0 || columns.length === 0) {
    return {
      xAxisColumns: [],
      yAxisColumns: [],
      columnOrder: columns,
      visibleColumns: columns,
    };
  }

  // For tables, show all columns. For charts, filter intelligently.
  const visibleColumns = columns;

  // Get smart column ordering
  const columnOrder = getColumnOrder(columns, isAggregateChange, rows);

  // Smart X-axis selection
  let xAxisColumns: string[] = [];

  // Prefer Quantile ≤ if it exists and has varying values
  if (visibleColumns.includes('Quantile ≤') && !hasAllSameValues(rows, 'Quantile ≤')) {
    xAxisColumns = ['Quantile ≤'];
  }
  // Then try Filter ≥
  else if (visibleColumns.includes('Filter ≥') && !hasAllSameValues(rows, 'Filter ≥')) {
    xAxisColumns = ['Filter ≥'];
  }
  // Then try Year
  else if (visibleColumns.includes('Year') && !hasAllSameValues(rows, 'Year')) {
    xAxisColumns = ['Year'];
  }
  // Then try Variable
  else if (visibleColumns.includes('Variable') && !hasAllSameValues(rows, 'Variable')) {
    xAxisColumns = ['Variable'];
  }
  // Fallback to first non-numeric visible column
  else {
    const firstCategorical = visibleColumns.find(col => {
      const firstValue = rows[0][col];
      return typeof firstValue !== 'number';
    });
    if (firstCategorical) {
      xAxisColumns = [firstCategorical];
    } else if (visibleColumns.length > 0) {
      xAxisColumns = [visibleColumns[0]];
    }
  }

  // Smart Y-axis selection
  let yAxisColumns: string[] = [];

  if (isAggregateChange) {
    // For aggregate changes, prefer Change
    if (visibleColumns.includes('Change')) {
      yAxisColumns = ['Change'];
    } else if (visibleColumns.includes('Relative change (%)')) {
      yAxisColumns = ['Relative change (%)'];
    } else if (visibleColumns.includes('Comparison')) {
      yAxisColumns = ['Comparison'];
    }
  } else {
    // For regular aggregates, prefer Value
    if (visibleColumns.includes('Value')) {
      yAxisColumns = ['Value'];
    }
  }

  // Generate smart axis labels
  let xAxisTitle = '';
  let yAxisTitle = '';

  // X-axis title
  if (xAxisColumns.length === 1) {
    const col = xAxisColumns[0];
    if (col === 'Quantile ≤') {
      xAxisTitle = 'Income decile';
    } else if (col === 'Filter ≥') {
      xAxisTitle = 'Filter value';
    } else if (col === 'Year') {
      xAxisTitle = 'Year';
    } else if (col === 'Variable') {
      xAxisTitle = 'Metric';
    } else {
      xAxisTitle = col;
    }
  } else if (xAxisColumns.length > 1) {
    xAxisTitle = xAxisColumns.join(', ');
  }

  // Y-axis title
  if (yAxisColumns.length === 1) {
    const col = yAxisColumns[0];
    if (col === 'Change') {
      xAxisTitle = isAggregateChange ? 'Income decile' : xAxisTitle;
      yAxisTitle = 'Change (£/year)';
    } else if (col === 'Relative change (%)') {
      yAxisTitle = 'Change (%)';
    } else if (col === 'Value') {
      yAxisTitle = 'Value (£/year)';
    } else if (col === 'Comparison') {
      yAxisTitle = 'Reform (£/year)';
    } else if (col === 'Baseline') {
      yAxisTitle = 'Baseline (£/year)';
    } else {
      yAxisTitle = col;
    }
  } else if (yAxisColumns.length > 1) {
    yAxisTitle = yAxisColumns.join(', ');
  }

  return {
    xAxisColumns,
    yAxisColumns,
    columnOrder,
    visibleColumns,
    xAxisTitle,
    yAxisTitle,
  };
}
