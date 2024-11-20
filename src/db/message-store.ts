/**
 * @fileoverview Message store implementation for managing playground messages.
 * Provides functionality for CRUD operations on messages with IndexedDB storage.
 * @author zpl
 * @created 2024-11-20
 */

import { PlaygroundMessage } from '@/stores/playground'
import { arrayMove } from '@dnd-kit/sortable'
import { db } from '.'
import { logger } from '@/utils/logger'

/**
 * Callback type for message state changes.
 * @callback Listener
 * @param {PlaygroundMessage[]} messages - Updated array of messages
 */
type Listener = (messages: PlaygroundMessage[]) => void

/**
 * Manages the state and persistence of playground messages.
 * Implements observer pattern for state updates and handles concurrent operations.
 * 
 * @class
 */
class MessageStore {
  private listeners: Set<Listener> = new Set()
  private messages: PlaygroundMessage[] = []
  private editOperations = new Map<string, Promise<void>>()
  private isSavingReorder = false

  /**
   * Subscribes a listener to message state changes.
   * @param {Listener} listener - Callback function to be called on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.messages)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notifies all listeners of state changes.
   * Creates a deep copy of messages to prevent external modifications.
   * @private
   */
  private notify() {
    const messagesCopy = this.messages.map(msg => ({...msg}))
    this.listeners.forEach(listener => listener(messagesCopy))
  }

  /**
   * Initializes the message store by loading messages from IndexedDB.
   * @async
   */
  async init() {
    const messages = await db.messages.orderBy('timestamp').toArray()
    this.messages = messages
    this.notify()
  }

  /**
   * Adds a new message to the store.
   * @async
   * @param {Omit<PlaygroundMessage, 'timestamp'>} message - Message to add
   */
  async addMessage(message: Omit<PlaygroundMessage, 'timestamp'>) {
    const timestamp = Date.now()
    const newMessage = { ...message, timestamp }
    
    logger.debug('Adding new message', { 
      context: { messageId: message.id, role: message.role },
      module: 'MessageStore'
    })
    
    const updatedMessages = [...this.messages, newMessage]
    this.messages = updatedMessages
    this.notify()

    await db.messages.add(newMessage)
    logger.info('Message added successfully', { 
      context: { messageId: message.id },
      module: 'MessageStore'
    })
  }

  /**
   * Updates an existing message.
   * Handles concurrent edits using a promise-based queue.
   * @async
   * @param {string} id - ID of the message to edit
   * @param {PlaygroundMessage | string} update - Updated message or content
   */
  async editMessage(id: string, update: PlaygroundMessage | string) {
    const currentOperation = this.editOperations.get(id)
    if (currentOperation) {
      await currentOperation
    }

    const operation = (async () => {
      try {
        const message = await db.messages.get(id)
        if (!message) return

        const currentMessage = this.messages.find(msg => msg.id === id)
        if (!currentMessage) return

        const updatedMessage = typeof update === 'string' 
          ? { ...currentMessage, content: update }
          : { ...currentMessage, ...update }

        await db.messages.put(updatedMessage)
        this.messages = this.messages.map(msg => 
          msg.id === id ? updatedMessage : msg
        )
        this.notify()
      } finally {
        this.editOperations.delete(id)
      }
    })()

    this.editOperations.set(id, operation)
    await operation
  }

  /**
   * Deletes a message by ID.
   * Waits for any pending edit operations before deletion.
   * @async
   * @param {string} id - ID of the message to delete
   */
  async deleteMessage(id: string) {
    logger.debug('Deleting message', { 
      context: { messageId: id },
      module: 'MessageStore'
    })
    
    const currentOperation = this.editOperations.get(id)
    if (currentOperation) {
      await currentOperation
    }
    
    await db.messages.delete(id)
    this.messages = this.messages.filter(msg => msg.id !== id)
    this.notify()
    
    logger.info('Message deleted successfully', { 
      context: { messageId: id },
      module: 'MessageStore'
    })
  }

  /**
   * Reorders messages using drag-and-drop functionality.
   * Updates timestamps to maintain order in IndexedDB.
   * @async
   * @param {string} activeId - ID of the message being moved
   * @param {string} overId - ID of the target position
   */
  async reorderMessages(activeId: string, overId: string) {
    if (this.isSavingReorder) return
    
    logger.debug('Reordering messages', { 
      context: { activeId, overId },
      module: 'MessageStore'
    })
    
    try {
      this.isSavingReorder = true

      const newMessages = arrayMove(
        this.messages,
        this.messages.findIndex(item => item.id === activeId),
        this.messages.findIndex(item => item.id === overId)
      )

      this.messages = newMessages
      this.notify()

      for (const operation of this.editOperations.values()) {
        await operation
      }

      const updatedMessages = newMessages.map((msg, index) => ({
        ...msg,
        timestamp: Date.now() + index
      }))

      await Promise.all(updatedMessages.map(msg => db.messages.put(msg)))

      this.messages = updatedMessages
      this.notify()
      
      logger.info('Messages reordered successfully', { 
        context: { activeId, overId },
        module: 'MessageStore'
      })
    } catch (error) {
      logger.error('Error reordering messages', error as Error, { 
        context: { activeId, overId },
        module: 'MessageStore'
      })
      throw error
    } finally {
      this.isSavingReorder = false
    }
  }

  /**
   * Deletes all messages from a specified message onwards.
   * @async
   * @param {string} id - ID of the first message to delete
   */
  async deleteMessagesFrom(id: string) {
    for (const operation of this.editOperations.values()) {
      await operation
    }

    const index = this.messages.findIndex(msg => msg.id === id)
    if (index === -1) return

    const messagesToDelete = this.messages.slice(index).map(msg => msg.id!)
    await db.messages.bulkDelete(messagesToDelete)
    
    this.messages = this.messages.slice(0, index)
    this.notify()
  }

  /**
   * Clears all messages from the store.
   * @async
   */
  async clear() {
    logger.info('Clearing all messages', { module: 'MessageStore' })
    
    for (const operation of this.editOperations.values()) {
      await operation
    }

    await db.messages.clear()
    
    this.messages = []
    
    this.notify()
    logger.info('All messages cleared successfully', { module: 'MessageStore' })
  }

  /**
   * Retrieves all messages from the store.
   * Returns cached messages if available, otherwise loads from IndexedDB.
   * @async
   * @returns {Promise<PlaygroundMessage[]>} Array of all messages
   */
  async getAllMessages(): Promise<PlaygroundMessage[]> {
    if (this.messages.length > 0) {
      return [...this.messages]
    }
    
    const messages = await db.messages.orderBy('timestamp').toArray()
    return messages
  }
}

/**
 * Singleton instance of MessageStore.
 * Use this instance for all message operations.
 * @constant
 * @type {MessageStore}
 */
export const messageStore = new MessageStore()