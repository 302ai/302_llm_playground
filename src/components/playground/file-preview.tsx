import { cn } from '@/utils/tailwindcss'
import { FileIcon, X, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface FilePreviewProps {
  files: {
    url: string
    type: 'image' | 'file'
    name: string
    size: number
  }[]
  canDelete?: boolean
  onDelete?: (index: number) => void
  className?: string
}

export function FilePreview({ files, canDelete, onDelete, className }: FilePreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!files?.length) return null

  const images = files
    .filter(f => f.type === 'image')
    .map(f => ({ src: f.url }))

  const getImageIndex = (url: string) => images.findIndex(img => img.src === url)

  return (
    <>
      <div className={cn('flex flex-wrap gap-2 mt-2', className)}>
        {files.map((file, index) => (
          <div key={file.url} className="relative group">
            {file.type === 'image' ? (
              <div 
                className="relative w-20 h-20 rounded-md overflow-hidden border border-border transition-all duration-200 hover:shadow-md cursor-pointer"
                onClick={() => setSelectedImage(file.url)}
              >
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-contain p-0.5"
                  sizes="80px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-foreground/0 group-hover:text-foreground/70" />
                </div>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border bg-muted/30 flex flex-col items-center justify-center p-2 transition-all duration-200 hover:shadow-md">
                      <FileIcon className="w-6 h-6 mb-1 text-muted-foreground" />
                      <div className="text-center">
                        <div className="text-xs font-medium truncate max-w-[70px]">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{file.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500/90 hover:bg-red-500 p-0"
                onClick={() => onDelete?.(index)}
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Lightbox
        open={selectedImage !== null}
        close={() => setSelectedImage(null)}
        index={selectedImage ? getImageIndex(selectedImage) : 0}
        slides={images}
        plugins={[Zoom]}
        animation={{ fade: 300 }}
        carousel={{ finite: images.length <= 1 }}
        render={{
          buttonPrev: images.length <= 1 ? () => null : undefined,
          buttonNext: images.length <= 1 ? () => null : undefined,
        }}
      />
    </>
  )
}
