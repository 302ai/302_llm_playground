/**
 * @fileoverview Global constants and configuration values used throughout the application.
 * @author zpl
 * @created 2024-11-20
 */

/**
 * Global application constants.
 * @constant
 * @type {Object}
 */
export const GLOBAL = {
  /**
   * Internationalization (i18n) configuration settings.
   * @property {Object} LOCALE - Locale-related constants
   * @property {string} LOCALE.KEY - Key used for storing language preference
   * @property {string[]} LOCALE.SUPPORTED - List of supported language codes:
   *   - 'zh': Chinese
   *   - 'en': English
   *   - 'ja': Japanese
   * @property {string} LOCALE.DEFAULT - Default language code (English)
   */
  LOCALE: {
    KEY: 'lang',
    SUPPORTED: ['zh', 'en', 'ja'],
    DEFAULT: 'en',
  },
}
