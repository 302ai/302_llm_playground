/**
 * @fileoverview Environment variable configuration and validation using t3-env.
 * @author zpl
 * @created 2024-11-20
 */

import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Environment variable configuration with runtime validation.
 * Uses t3-env for type-safe environment variables and Zod for validation.
 * 
 * @constant
 * @type {Object}
 * @property {Object} server - Server-side environment variables
 * @property {string} server.AI_302_API_KEY - API key for AI 302 service
 * @property {string} server.AI_302_API_URL - Base URL for AI 302 service
 * @property {Object} client - Client-side environment variables (empty for security)
 */
export const env = createEnv({
  server: {
    AI_302_API_KEY: z.string().min(1),
    AI_302_API_URL: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
})
