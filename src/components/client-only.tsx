/**
 * @fileoverview Client-side only React component wrapper.
 * Prevents hydration mismatches by only rendering content after client-side mount.
 * @author zpl
 * @created 2024-11-20
 */

import React from 'react'

/**
 * Props type for the ClientOnly component.
 * Extends standard HTML div attributes with children support.
 * 
 * @typedef {React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>} ClientOnlyProps
 */
type ClientOnlyProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement>
>

/**
 * A wrapper component that only renders its children on the client side.
 * Useful for components that rely on browser APIs or need to prevent hydration mismatches.
 * 
 * @component
 * @param {ClientOnlyProps} props - Component props
 * @param {React.ReactNode} props.children - Child elements to render
 * @param {React.HTMLAttributes<HTMLDivElement>} props.delegated - Additional HTML div attributes
 * 
 * @example
 * ```tsx
 * // Wrap browser-dependent components
 * <ClientOnly>
 *   <BrowserOnlyComponent />
 * </ClientOnly>
 * 
 * // With additional div attributes
 * <ClientOnly className="mt-4 p-2">
 *   <BrowserOnlyContent />
 * </ClientOnly>
 * ```
 */
export function ClientOnly({ children, ...delegated }: ClientOnlyProps) {
  // Track component mount state
  const [hasMounted, setHasMounted] = React.useState(false)

  // Set mounted state after initial render
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  // Prevent rendering until client-side mount
  if (!hasMounted) {
    return null
  }

  return <div {...delegated}>{children}</div>
}
