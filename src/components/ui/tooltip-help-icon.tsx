import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

interface TooltipHelpIconProps {
  content: React.ReactNode
  className?: string
}

export function TooltipHelpIcon({ content, className = 'h-4 w-4 text-gray-400 hover:text-gray-500' }: TooltipHelpIconProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='cursor-help'
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className={className} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          sideOffset={4}
          className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
        >
          {typeof content === 'string' ? <p>{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
