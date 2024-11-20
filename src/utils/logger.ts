/**
 * @fileoverview Unified logging system for both client and server-side logging.
 * Provides colored output, log levels, and contextual information.
 * @author zpl
 * @created 2024-11-20
 */

import chalk from 'chalk'

/**
 * Enumeration of available log levels in ascending order of severity.
 * @enum {string}
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Color configuration for different log levels using chalk.
 * @const
 * @type {Object.<LogLevel, Function>}
 */
const LogColors = {
  [LogLevel.DEBUG]: chalk.blue,
  [LogLevel.INFO]: chalk.green,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red,
}

/**
 * Configuration options for logging operations.
 * @interface
 * @property {LogLevel} [level] - Severity level of the log
 * @property {string} [module] - Module/component name generating the log
 * @property {Record<string, unknown>} [context] - Additional contextual data
 * @property {boolean} [isServer] - Whether the log is from server-side
 */
export interface LogOptions {
  level?: LogLevel
  module?: string
  context?: Record<string, unknown>
  isServer?: boolean
}

/**
 * Default logging configuration.
 * @const
 * @type {LogOptions}
 */
const defaultOptions: LogOptions = {
  level: LogLevel.INFO,
  module: 'APP',
  isServer: typeof window === 'undefined',
}

/**
 * Logger class implementing the Singleton pattern.
 * Provides unified logging functionality with different severity levels.
 * 
 * @class
 */
class Logger {
  private static instance: Logger
  private isDevelopment: boolean

  /**
   * Private constructor to enforce Singleton pattern.
   * Determines the runtime environment.
   */
  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  /**
   * Gets the singleton instance of the Logger.
   * @static
   * @returns {Logger} The singleton Logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Formats a log message with timestamp, runtime environment, and context.
   * @private
   * @param {string} message - The main log message
   * @param {LogOptions} options - Logging configuration options
   * @returns {string} Formatted log message
   */
  private formatMessage(message: string, options: LogOptions): string {
    const timestamp = new Date().toISOString()
    const moduleInfo = options.module ? `[${options.module}]` : ''
    const runtimeEnv = options.isServer ? '[Server]' : '[Client]'
    const contextInfo = options.context ? `\nContext: ${JSON.stringify(options.context, null, 2)}` : ''
    
    return `${timestamp} ${runtimeEnv} ${moduleInfo} ${message}${contextInfo}`
  }

  /**
   * Core logging function that handles message formatting and output.
   * Only logs in development or when explicitly enabled in production.
   * @private
   * @param {string} message - The message to log
   * @param {LogOptions} options - Logging configuration options
   */
  private log(message: string, options: LogOptions = defaultOptions): void {
    const mergedOptions = { ...defaultOptions, ...options }
    const formattedMessage = this.formatMessage(message, mergedOptions)
    const colorize = LogColors[mergedOptions.level!]

    // Only log in development or if explicitly enabled in production
    if (!this.isDevelopment && !process.env.ENABLE_PRODUCTION_LOGGING) {
      return
    }

    switch (mergedOptions.level) {
      case LogLevel.DEBUG:
        console.debug(colorize(formattedMessage))
        break
      case LogLevel.INFO:
        console.info(colorize(formattedMessage))
        break
      case LogLevel.WARN:
        console.warn(colorize(formattedMessage))
        break
      case LogLevel.ERROR:
        console.error(colorize(formattedMessage))
        break
    }
  }

  /**
   * Logs a debug message.
   * @param {string} message - Debug message
   * @param {Omit<LogOptions, 'level'>} [options] - Logging options excluding level
   */
  public debug(message: string, options?: Omit<LogOptions, 'level'>): void {
    this.log(message, { ...options, level: LogLevel.DEBUG })
  }

  /**
   * Logs an info message.
   * @param {string} message - Info message
   * @param {Omit<LogOptions, 'level'>} [options] - Logging options excluding level
   */
  public info(message: string, options?: Omit<LogOptions, 'level'>): void {
    this.log(message, { ...options, level: LogLevel.INFO })
  }

  /**
   * Logs a warning message.
   * @param {string} message - Warning message
   * @param {Omit<LogOptions, 'level'>} [options] - Logging options excluding level
   */
  public warn(message: string, options?: Omit<LogOptions, 'level'>): void {
    this.log(message, { ...options, level: LogLevel.WARN })
  }

  /**
   * Logs an error message with optional error object details.
   * @param {string} message - Error message
   * @param {Error} [error] - Error object to include in context
   * @param {Omit<LogOptions, 'level'>} [options] - Logging options excluding level
   */
  public error(message: string, error?: Error, options?: Omit<LogOptions, 'level'>): void {
    const errorContext = error ? {
      context: {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
    } : {}
    
    this.log(message, { ...options, ...errorContext, level: LogLevel.ERROR })
  }
}

/**
 * Singleton instance of the Logger class.
 * Use this for all logging operations throughout the application.
 * @const
 * @type {Logger}
 */
export const logger = Logger.getInstance()
