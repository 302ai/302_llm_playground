/**
 * @fileoverview React hook for managing playground messages with persistence.
 * Provides CRUD operations, drag-and-drop reordering, and state management.
 * @author zpl
 * @created 2024-11-20
 */

import { messageStore } from '@/db/message-store'
import { PlaygroundMessage } from '@/stores/playground'
import type { DragEndEvent } from '@dnd-kit/core'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

/**
 * React hook that provides message management functionality.
 * Handles message persistence, state management, and user interactions.
 * 
 * @function
 * @param {string} [defaultSystemMessage] - Optional system message to initialize with
 * @returns {Object} Message management interface
 * @property {PlaygroundMessage[]} messages - Current message list
 * @property {boolean} loading - Loading state indicator
 * @property {Function} setMessages - Message state setter (placeholder)
 * @property {Function} handleEdit - Message edit handler
 * @property {Function} handleDelete - Message deletion handler
 * @property {Function} handleDragEnd - Drag-and-drop handler
 * @property {Function} addMessage - Message addition handler
 * @property {Function} removeMessagesFrom - Bulk message removal handler
 * 
 * @example
 * ```tsx
 * function MessageList() {
 *   const {
 *     messages,
 *     loading,
 *     handleEdit,
 *     handleDelete,
 *     addMessage
 *   } = useMessages('Welcome to the playground');
 * 
 *   if (loading) return <Loading />;
 * 
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <Message
 *           key={msg.id}
 *           message={msg}
 *           onEdit={handleEdit}
 *           onDelete={handleDelete}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMessages(defaultSystemMessage?: string) {
  // Track message list and loading state
  const [messages, setMessages] = useState<PlaygroundMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize message store and set up subscription
  useEffect(() => {
    messageStore.init().then(async () => {
      const allMessages = await messageStore.getAllMessages()
      
      // Add default system message if none exists
      if (allMessages.length === 0 && defaultSystemMessage) {
        await messageStore.addMessage({
          id: uuidv4(),
          role: 'system',
          content: defaultSystemMessage,
        })
      }
      
      setLoading(false)
    })
    
    // Subscribe to message store updates
    return messageStore.subscribe(setMessages)
  }, [defaultSystemMessage])

  /**
   * Handles message editing.
   * @param {string} id - ID of message to edit
   * @param {PlaygroundMessage | string} update - Updated message or content
   */
  const handleEdit = useCallback((id: string, update: PlaygroundMessage | string) => {
    messageStore.editMessage(id, update)
  }, [])

  /**
   * Handles message deletion.
   * @param {string} id - ID of message to delete
   */
  const handleDelete = useCallback((id: string) => {
    messageStore.deleteMessage(id)
  }, [])

  /**
   * Handles drag-and-drop reordering of messages.
   * @param {DragEndEvent} event - Drag end event from dnd-kit
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    messageStore.reorderMessages(active.id as string, over.id as string)
  }, [])

  /**
   * Adds a new message to the store.
   * @param {PlaygroundMessage} message - Message to add
   */
  const addMessage = useCallback((message: PlaygroundMessage) => {
    messageStore.addMessage(message)
  }, [])

  /**
   * Removes all messages starting from the specified message.
   * @param {string} id - ID of first message to remove
   */
  const removeMessagesFrom = useCallback((id: string) => {
    messageStore.deleteMessagesFrom(id)
  }, [])

  return {
    messages,
    loading,
    setMessages: () => {}, // Placeholder for compatibility
    handleEdit,
    handleDelete,
    handleDragEnd,
    addMessage,
    removeMessagesFrom,
  }
}