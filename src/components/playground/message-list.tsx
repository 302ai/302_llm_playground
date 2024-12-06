/**
 * @fileoverview Message list component that handles the display, sorting, and management of chat messages
 * in the playground. Includes drag-and-drop functionality, auto-scrolling, and message regeneration.
 */

import { messageStore } from '@/db/message-store'
import { useChatGeneration } from '@/hooks/use-chat-generation'
import { PlaygroundMessage, playgroundSettiongsAtom } from '@/stores/playground'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAtom } from 'jotai'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SortableMessage } from './sortable-message'

const MemoizedSortableMessage = memo(SortableMessage)

/**
 * Props interface for the MessageList component
 * @interface MessageListProps
 * @property {PlaygroundMessage[]} messages - Array of messages to display
 * @property {PlaygroundMessage | null} generatingMessage - Currently generating message, if any
 * @property {boolean} isRunning - Whether message generation is in progress
 * @property {Function} onDragEnd - Handler for when drag-and-drop operation ends
 * @property {Function} onEdit - Handler for editing a message
 * @property {Function} onDelete - Handler for deleting a message
 */
interface MessageListProps {
  messages: PlaygroundMessage[]
  generatingMessage: PlaygroundMessage | null
  isRunning: boolean
  onDragEnd: (event: DragEndEvent) => void
  onEdit: (id: string, message: PlaygroundMessage) => void
  onDelete: (id: string) => void
}

/**
 * A memoized component that displays a list of chat messages with drag-and-drop sorting,
 * auto-scrolling, and message regeneration capabilities.
 *
 * @component
 * @param {MessageListProps} props - Component props
 * @returns {JSX.Element} Rendered message list
 */
export const MessageList = memo(function MessageList({
  messages,
  generatingMessage,
  isRunning,
  onDragEnd,
  onEdit,
  onDelete,
}: MessageListProps) {
  /**
   * Sensors for drag-and-drop functionality
   */
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Refs for managing scroll behavior and positions
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastScrollHeightRef = useRef<number>(0)
  const lastScrollTopRef = useRef<number>(0)
  const scrollTimeoutRef = useRef<number>()
  const isScrollingRef = useRef(false)

  /**
   * Updates scroll position based on auto-scroll preference and previous scroll position
   */
  const updateScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || isScrollingRef.current) return

    if (shouldAutoScroll) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      })
    } else {
      // Maintain relative scroll position
      const scrollDiff = container.scrollHeight - lastScrollHeightRef.current
      container.scrollTop = lastScrollTopRef.current + scrollDiff
    }

    // Update recorded height and scroll position
    lastScrollHeightRef.current = container.scrollHeight
    lastScrollTopRef.current = container.scrollTop
  }, [shouldAutoScroll])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Clear previous timer
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }

      isScrollingRef.current = true

      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShouldAutoScroll(isAtBottom)

      // Record scroll position
      lastScrollHeightRef.current = scrollHeight
      lastScrollTopRef.current = scrollTop

      // Set new timer to reset state after scrolling stops
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false
      }, 150) // Reset state 150ms after scrolling stops
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isScrollingRef.current) {
      requestAnimationFrame(() => {
        updateScroll()
      })
    }
  }, [messages, generatingMessage, updateScroll])

  const [settings] = useAtom(playgroundSettiongsAtom)

  const {
    generate,
    isRunning: isRegenerating,
    generatingMessage: regeneratingMessage,
  } = useChatGeneration()

  /**
   * Regenerates a message at the specified index
   * @param {string} id - ID of the message to regenerate
   */
  const handleRegenerate = useCallback(
    async (id: string) => {
      const currentIndex = messages.findIndex((msg) => msg.id === id)
      if (currentIndex === -1) return

      const messageHistory = messages.slice(0, currentIndex)
      await messageStore.deleteMessagesFrom(id)
      const result = await generate(messageHistory, settings)

      if (result) {
        const { id, content, logprobs } = result
        await messageStore.addMessage({
          id,
          role: 'assistant',
          content,
          logprobs,
        })
      }
    },
    [messages, generate, settings]
  )

  /**
   * Merges the original messages with the generating message, if any
   */
  const allMessages = useMemo(() => {
    const result = [...messages]
    const generatingMsg = (isRunning && generatingMessage) || (isRegenerating && regeneratingMessage)
    
    if (generatingMsg) {
      const existingIndex = result.findIndex(msg => msg.id === generatingMsg.id)
      if (existingIndex >= 0) {
        result[existingIndex] = generatingMsg
      } else {
        result.push(generatingMsg)
      }
    }
    
    return result
  }, [messages, generatingMessage, regeneratingMessage, isRunning, isRegenerating])

  return (
    <div className='flex h-full w-full flex-col'>
      <div 
        ref={containerRef} 
        className='h-full w-full overflow-y-auto'
        style={{ 
          willChange: 'transform', // Optimize scroll performance
          backfaceVisibility: 'hidden', // Prevent flashing
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)', // Force hardware acceleration
        }}
      >
        <div className='w-full p-6'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={allMessages}
              strategy={verticalListSortingStrategy}
            >
              {allMessages.map((message) => (
                <MemoizedSortableMessage
                  key={message.id}
                  message={message}
                  handleEdit={onEdit}
                  handleDelete={onDelete}
                  handleRegenerate={handleRegenerate}
                  isRunning={
                    message.id === (generatingMessage?.id || regeneratingMessage?.id)
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
})
