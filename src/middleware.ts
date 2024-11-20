/**
 * @fileoverview Next.js middleware configuration for internationalization (i18n).
 * @author zpl
 * @created 2024-11-20
 */

import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/**
 * Creates and exports the internationalization middleware.
 * Handles language-based routing and localization for the application.
 */
export default createMiddleware(routing)

/**
 * Middleware configuration object specifying URL patterns to match.
 * @constant
 * @type {Object}
 * @property {string[]} matcher - Array of URL patterns:
 *   - '/' : Matches the root path
 *   - '/(zh|en|ja)/:path*' : Matches paths starting with language codes (zh, en, ja)
 */
export const config = {
  matcher: ['/', '/(zh|en|ja)/:path*'],
}
