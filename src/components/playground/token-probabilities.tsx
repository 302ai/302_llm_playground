import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTranslations } from 'next-intl'
import { memo } from 'react'

// soft background color array
const TOKEN_COLORS = [
  'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/30',
  'bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/30',
  'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/30',
  'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/30',
  'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/30',
  'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/30',
  'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30',
  'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-900/30',
]

interface TopLogprob {
  token: string
  logprob: number
}

interface TokenLogprob {
  token: string
  logprob: number
  topLogprobs: TopLogprob[]
}

interface TokenProbabilitiesProps {
  logprobs: TokenLogprob[]
}

interface TokenPopoverProps extends TokenLogprob {
  colorIndex: number
}

const TokenPopover = memo(function TokenPopover({
  token,
  logprob,
  topLogprobs,
  colorIndex,
}: TokenPopoverProps) {
  const t = useTranslations('playground')
  const colorClass = TOKEN_COLORS[colorIndex % TOKEN_COLORS.length]
  const probability = Math.exp(logprob) * 100
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className={`cursor-pointer rounded px-1 py-0.5 font-mono transition-colors ${colorClass}`}>
          {token}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start" sideOffset={8}>
        <div className="space-y-3">
          {/* current token */}
          <div>
            <div className="mb-1.5 text-sm font-medium text-foreground/80">
              {t('message.currentToken')}
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5">
              <span className="font-mono">{token}</span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(probability, 100)}px` }} />
                <span className="text-sm text-muted-foreground">
                  {probability.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* alternative tokens */}
          {topLogprobs.length > 1 && (
            <div>
              <div className="mb-1.5 text-sm font-medium text-foreground/80">
                {t('message.alternativeTokens')}
              </div>
              <div className="space-y-1">
                {topLogprobs
                  .filter((top) => top.token !== token)
                  .map((top, index) => {
                    const altProbability = Math.exp(top.logprob) * 100
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md px-3 py-1.5 hover:bg-muted/50"
                      >
                        <span className="font-mono">{top.token}</span>
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="h-2 rounded bg-primary/40" 
                            style={{ width: `${Math.min(altProbability, 100)}px` }} 
                          />
                          <span className="text-sm text-muted-foreground">
                            {altProbability.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})

export const TokenProbabilities = memo(function TokenProbabilities({
  logprobs,
}: TokenProbabilitiesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {logprobs.map((item, index) => (
        <TokenPopover 
          key={index}
          token={item.token}
          logprob={item.logprob}
          topLogprobs={item.topLogprobs}
          colorIndex={index}
        />
      ))}
    </div>
  )
}) 