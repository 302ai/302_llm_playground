/**
 * @fileoverview Playground state management using Jotai atoms.
 * Manages chat settings, messages, and UI preferences with persistent storage.
 * @author zpl
 * @created 2024-11-20
 */

import { atomWithStorage } from 'jotai/utils'

/**
 * Atom for managing playground settings with persistent storage.
 * Uses localStorage to maintain settings across sessions.
 * 
 * @constant
 * @type {Atom<PlaygroundSettings>}
 * @property {string} model - Selected AI model identifier
 * @property {number} temperature - Model temperature setting (0-1)
 * @property {number} topP - Top-p sampling parameter (0-1)
 * @property {number} frequencyPenalty - Penalty for frequent token use (0-2)
 * @property {number} presencePenalty - Penalty for token presence (0-2)
 * @property {string} apiKey - API key for model access
 * @property {number} maxTokens - Maximum number of tokens for the model
 * 
 * @example
 * ```typescript
 * const [settings, setSettings] = useAtom(playgroundSettiongsAtom);
 * // Update temperature
 * setSettings({ ...settings, temperature: 0.8 });
 * ```
 */
export const playgroundSettiongsAtom = atomWithStorage('playground-settings', {
  model: 'gpt-4o',
  temperature: 0.7,
  topP: 0.7,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5,
  apiKey: '',
  maxTokens: 8192,
})

/**
 * Type definition for chat messages in the playground.
 * Represents both user inputs and AI responses.
 * 
 * @interface PlaygroundMessage
 * @property {string} id - Unique message identifier
 * @property {'system' | 'user' | 'assistant'} role - Message sender role
 * @property {string} content - Message content
 * @property {number} [timestamp] - Optional message timestamp
 */
export type PlaygroundMessage = {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

/**
 * Type definition for UI mode settings.
 * Controls the complexity level of the interface.
 * 
 * @typedef {'beginner' | 'expert'} UiMode
 */
export type UiMode = 'beginner' | 'expert'

/**
 * Atom for managing UI mode preference with persistent storage.
 * Defaults to 'beginner' mode for new users.
 * 
 * @constant
 * @type {import('jotai').Atom<UiMode>}
 */
export const uiModeAtom = atomWithStorage<UiMode>('ui-mode', 'beginner')

/**
 * Validates message content before sending.
 * Ensures messages are not empty or only whitespace.
 * 
 * @function
 * @param {string} content - Message content to validate
 * @returns {boolean} True if message is valid, false otherwise
 */
export const validateMessage = (content: string) => {
  if (!content.trim()) return false
  return true
}

/**
 * Synchronously retrieves playground settings from localStorage.
 * Used for scenarios where async atom access is not suitable.
 * 
 * @function
 * @returns {PlaygroundSettings} Current playground settings
 */
export const getSettingsSync = () => {
  return JSON.parse(localStorage.getItem('playground-settings') || '{}')
}
