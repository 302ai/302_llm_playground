import { ButtonProps } from "@/components/ui/button"
import { ReactNode } from "react"
import { Button } from "./button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./tooltip"

interface TooltipButtonProps extends ButtonProps {
  tooltipContent: ReactNode
  tooltipSideOffset?: number
  tooltipDelayDuration?: number
  tooltipClassName?: string
  children: ReactNode
}

export function TooltipButton({
  tooltipContent,
  tooltipSideOffset = 4,
  tooltipDelayDuration = 0,
  tooltipClassName = "max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50",
  children,
  ...buttonProps
}: TooltipButtonProps) {
  return (
    <TooltipProvider delayDuration={tooltipDelayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...buttonProps}>{children}</Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={tooltipSideOffset} className={tooltipClassName}>
          {typeof tooltipContent === "string" ? (
            <p>{tooltipContent}</p>
          ) : (
            tooltipContent
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
