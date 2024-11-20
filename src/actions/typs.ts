/**
 * @fileoverview Generic response type definitions for API interactions.
 * Provides a standardized structure for API responses across the application.
 * @author zpl
 * @created 2024-11-20
 */

/**
 * Generic response wrapper for API responses.
 * Provides a consistent structure for all API responses in the application.
 * 
 * @template T The type of data contained in the response
 * @interface GResponse
 * @property {number} code - HTTP status code or custom response code
 * @property {T} data - Response payload of generic type T
 * @property {string} message - Human-readable response message
 * 
 * @example
 * ```typescript
 * // Example usage with a custom data type
 * interface UserData {
 *   id: string;
 *   name: string;
 * }
 * 
 * const response: GResponse<UserData> = {
 *   code: 200,
 *   data: { id: '123', name: 'John' },
 *   message: 'User retrieved successfully'
 * };
 * ```
 */
export type GResponse<T> = {
  code: number
  data: T
  message: string
}
