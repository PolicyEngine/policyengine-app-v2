/**
 * String utility functions for text formatting and manipulation
 */

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 * @example capitalize('hello') // 'Hello'
 * @example capitalize('HELLO') // 'HELLO'
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
