export const FOREVER = '2100-12-31';
export const BASE_URL = 'https://api.policyengine.org';
export const CURRENT_YEAR = '2025';

/**
 * Temporary constant for report time calculations
 * TODO: Replace with dynamic date selection from user input
 */
export const TEMP_REPORT_TIME = 2025;

/**
 * Default date for parameter definition lookups when no specific date is provided
 * Used for querying current law parameter values from metadata
 */
export const UNCONFIRMED_PARAM_DEFINITION_DATE = '2025-01-01';

/**
 * Mock user ID used for anonymous/unauthenticated users
 * TODO: Replace with actual user ID from auth context when authentication is implemented
 */
export const MOCK_USER_ID = 'anonymous';
