/**
 * @fileoverview Request configuration for next-intl internationalization.
 * Handles locale detection and message loading for the application.
 * @author zpl
 * @created 2024-11-20
 */

import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

/**
 * Configures internationalization settings for incoming requests.
 * 
 * @function getRequestConfig
 * @async
 * @param {Object} params - Configuration parameters
 * @param {Promise<string>} params.requestLocale - The requested locale from the client
 * @returns {Promise<{locale: string, messages: Object}>} Locale configuration and messages
 * 
 * @example
 * // Configuration is used by next-intl middleware
 * // Automatically loads locale-specific messages from messages/{locale}.json
 * const config = await getRequestConfig({ requestLocale: 'en' })
 * // Returns: { locale: 'en', messages: {...} }
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Fallback to default locale if requested locale is invalid
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
