/**
 * @fileoverview Server action for fetching available AI models from the API.
 * Provides functionality to retrieve and validate model information.
 * @author zpl
 * @created 2024-11-20
 */

'use server'

import { env } from "@/env"
import { normalizeUrl } from "@/utils/api"
import ky from "ky"
import { GResponse } from "./typs"
import { logger } from '@/utils/logger'

/**
 * Represents the structure of an individual AI model's information.
 * @interface ModelInfo
 * @property {string} id - Unique identifier for the model
 * @property {string} object - Type/category of the model
 */
export type ModelInfo = {
  id: string
  object: string
}

/**
 * Type definition for the API response containing model information.
 * Wraps an array of ModelInfo in the generic response structure.
 * @type {GResponse<ModelInfo[]>}
 */
export type GetModelResponse = GResponse<ModelInfo[]>

/**
 * Server action that fetches the list of available AI models.
 * Makes an authenticated request to the AI API endpoint to retrieve model information.
 * 
 * @async
 * @function
 * @returns {Promise<ModelInfo[]>} Array of available model information
 * @throws {Error} If the API request fails or returns invalid data
 * 
 * @example
 * ```typescript
 * try {
 *   const models = await getModels();
 *   console.log('Available models:', models.map(m => m.id));
 * } catch (error) {
 *   console.error('Failed to fetch models:', error);
 * }
 * ```
 */
export const getModels = async () => {
  logger.info('Fetching available models', { module: 'Models' })
  const baseUrl = normalizeUrl(env.AI_302_API_URL)
  
  try {
    // Fetch models with LLM filter and authentication
    const model = await ky
      .get(`${baseUrl}/v1/models?llm=1`, {
        headers: {
          Authorization: `Bearer ${env.AI_302_API_KEY}`,
        },
      })
      .json<GetModelResponse>()

    logger.info('Successfully fetched models', { 
      context: { modelCount: model.data.length },
      module: 'Models'
    })
    return model.data
  } catch (error) {
    logger.error('Failed to fetch models', error as Error, { module: 'Models' })
    throw error
  }
}