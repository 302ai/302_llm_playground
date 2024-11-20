/**
 * @fileoverview Internationalization routing configuration and navigation utilities.
 * @author zpl
 * @created 2024-11-20
 */

import { GLOBAL } from '@/constants/values'
import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

/**
 * Defines the base routing configuration for internationalization.
 * Uses global constants to specify supported locales and default language.
 * 
 * @constant
 * @type {Object}
 * @property {string[]} locales - Array of supported language codes
 * @property {string} defaultLocale - Default language code for the application
 */
export const routing = defineRouting({
  locales: GLOBAL.LOCALE.SUPPORTED,
  defaultLocale: GLOBAL.LOCALE.DEFAULT,
})

/**
 * Exports navigation utilities configured with internationalization support.
 * @exports {Object} Navigation utilities
 * @property {Component} Link - Internationalized link component
 * @property {Function} redirect - Function to handle i18n-aware redirects
 * @property {Function} usePathname - Hook to get the current pathname
 * @property {Function} useRouter - Hook for i18n-aware routing
 * @property {Function} getPathname - Function to generate localized pathnames
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
