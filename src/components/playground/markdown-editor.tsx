/**
 * @fileoverview Markdown editor component with preview and edit modes.
 * Features real-time editing, markdown preview, and KaTeX math support.
 * @author zpl
 * @created 2024-11-20
 */

import { cn } from '@/utils/tailwindcss'
import 'katex/dist/katex.min.css'
import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useDebounceCallback, useEventCallback } from 'usehooks-ts'
import { MarkdownRenderer } from '../ui/markdown-renderer'

/**
 * Props for the main MarkdownEditor component.
 * 
 * @interface MarkdownEditorProps
 * @property {string} content - Current markdown content
 * @property {boolean} [isEditing] - Whether editor is in edit mode
 * @property {(content: string) => void} onChange - Content change callback
 */
interface MarkdownEditorProps {
  content: string
  isEditing?: boolean
  onChange: (content: string) => void
}

/**
 * Component displayed when content is empty.
 * Shows a placeholder message with an icon.
 * 
 * @component
 */
const EmptyContent = () => {
  const t = useTranslations('playground')
  return (
    <div className='flex items-center gap-2 py-2 text-gray-400'>
      <FileText className='h-4 w-4' />
      <span className='text-sm'>{t('emptyContent')}</span>
    </div>
  )
}

/**
 * Props for the editable content area.
 * 
 * @interface EditableProps
 * @property {string} content - Current text content
 * @property {(content: string) => void} onChange - Content change callback
 * @property {string} [className] - Additional CSS classes
 */
interface EditableProps {
  content: string
  onChange: (content: string) => void
  className?: string
}

/**
 * Editable content area component with paste and keyboard handling.
 * Provides a contentEditable div with custom event handling.
 * 
 * @component
 * @param {EditableProps} props - Component props
 */
const EditableContent = memo(function EditableContent({
  content,
  onChange,
  className,
}: EditableProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  /**
   * Handles paste events to ensure plain text pasting.
   * Prevents rich text formatting from being pasted.
   */
  const handlePaste = useEventCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  })

  /**
   * Handles input events and updates content state.
   * Syncs the contentEditable div's content with parent state.
   */
  const handleInput = useEventCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerText
      onChange(newContent)
    }
  })

  /**
   * Handles keyboard events for special keys.
   * Implements custom behavior for Tab and Enter keys.
   */
  const handleKeyDown = useEventCallback((e: React.KeyboardEvent) => {
    // Handle tab key - insert spaces instead of changing focus
    if (e.key === 'Tab') {
      e.preventDefault()
      document.execCommand('insertText', false, '  ')
    }

    // Handle enter key - insert line break without shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      document.execCommand('insertLineBreak')
    }
  })

  // Sync content with external changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== content) {
      editorRef.current.innerText = content
    }
  }, [content])

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onPaste={handlePaste}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={cn(
        'min-h-[1.5em] w-full whitespace-pre-wrap break-words rounded px-0',
        'focus:outline-none',
        'text-gray-900',
        'overflow-wrap-anywhere',
        className
      )}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        maxWidth: '100%',
      }}
    />
  )
})

/**
 * Main markdown editor component with edit and preview modes.
 * Features debounced content updates and synchronized state.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <MarkdownEditor
 *   content={markdownText}
 *   onChange={setMarkdownText}
 * />
 * 
 * // With edit mode enabled
 * <MarkdownEditor
 *   content={markdownText}
 *   isEditing={true}
 *   onChange={setMarkdownText}
 * />
 * ```
 */
export const MarkdownEditor = memo(function MarkdownEditor({
  content,
  isEditing = false,
  onChange,
}: MarkdownEditorProps) {
  // Local state for content to enable debouncing
  const [localContent, setLocalContent] = useState(content)

  // Debounce content updates to reduce update frequency
  const debouncedOnChange = useDebounceCallback((value: string) => {
    onChange(value)
  }, 300)

  // Handle content changes with debouncing
  const handleChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent)
      debouncedOnChange(newContent)
    },
    [debouncedOnChange]
  )

  // Sync local content with external changes when not editing
  useEffect(() => {
    if (content !== localContent && !isEditing) {
      setLocalContent(content)
    }
  }, [content, isEditing, localContent])

  // Render edit mode or preview mode
  if (isEditing) {
    return (
      <EditableContent
        content={localContent}
        onChange={handleChange}
        className={cn(
          'h-fit overflow-hidden rounded border-none',
          'text-gray-900 shadow-none'
        )}
      />
    )
  }

  return (
    <div>
      {content ? (
        <MarkdownRenderer>{content}</MarkdownRenderer>
      ) : (
        <EmptyContent />
      )}
    </div>
  )
})
