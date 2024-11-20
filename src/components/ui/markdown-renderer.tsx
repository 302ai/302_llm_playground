/**
 * @fileoverview Advanced markdown renderer component with support for math equations,
 * mermaid diagrams, code highlighting, and GitHub-flavored markdown.
 * @author zpl
 * @created 2024-11-20
 */

'use client'
import 'katex/dist/katex.min.css'
import mermaid from 'mermaid'
import React, { Suspense, useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { visit } from 'unist-util-visit'

import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/utils/tailwindcss'
import { useTranslations } from 'next-intl'

import type { Components } from 'react-markdown'

/**
 * Configuration options for KaTeX math rendering
 * @const
 */
const katexOptions = {
  strict: false,
  trust: true,
  throwOnError: false,
  macros: {
    '\\f': 'f(#1)',
    '\\RR': '\\mathbb{R}',
    '\\NN': '\\mathbb{N}',
    '\\ZZ': '\\mathbb{Z}',
    '\\CC': '\\mathbb{C}',
    '\\QQ': '\\mathbb{Q}',
  },
  fleqn: false,
  leqno: false,
  output: 'html',
  displayMode: true,
  errorColor: '#cc0000',
  minRuleThickness: 0.05,
  maxSize: Infinity,
  maxExpand: 1000,
  globalGroup: true,
  allowedEnvironments: [
    'matrix',
    'pmatrix',
    'bmatrix',
    'Bmatrix',
    'vmatrix',
    'Vmatrix',
    'equation',
    'equation*',
    'align',
    'align*',
    'gather',
    'gather*',
    'cases',
  ],
}

/**
 * Props interface for the MarkdownRenderer component
 * @interface MarkdownRendererProps
 * @property {string} children - Markdown content to render
 */
interface MarkdownRendererProps {
  children: string
}

/**
 * Wrapper component for math equations
 * Provides error boundary and styling for math content
 * @component
 */
const MathWrapper = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations('playground')
  const ref = React.useRef<HTMLSpanElement>(null)
  const [latex, setLatex] = useState('')
  const [isDisplay, setIsDisplay] = useState(false)

  useEffect(() => {
    if (ref.current) {
      const annotation = ref.current.querySelector('.katex-mathml annotation')
      if (annotation) {
        setLatex(annotation.textContent || '')
      }
      // Check if it's a display equation
      setIsDisplay(!!ref.current.closest('.katex-display'))
    }
  }, [])

  return (
    <span
      ref={ref}
      className={cn(
        'group/math relative',
        isDisplay ? 'block' : 'inline-block'
      )}
    >
      {children}
      {latex && (
        <span
          className={cn(
            'invisible absolute flex space-x-1 rounded-lg bg-background/50 opacity-0 transition-all duration-200 group-hover/math:visible group-hover/math:opacity-100',
            isDisplay ? 'right-0 top-0' : '-top-6 left-1/2 -translate-x-1/2'
          )}
        >
          <CopyButton content={latex} copyMessage={t('copiedSuccess')} />
        </span>
      )}
    </span>
  )
}

/**
 * Wrapper component for mermaid diagrams
 * Handles diagram rendering and error states
 * @component
 */
const MermaidWrapper = ({ children }: { children: string }) => {
  const elementRef = React.useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const t = useTranslations('playground')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      renderDiagram()
    }, 300)

    async function renderDiagram() {
      if (!children.trim()) return

      try {
        const isValid = await mermaid.parse(children)
        if (!isValid) return

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          },
        })

        const { svg } = await mermaid.render(
          `mermaid-${Math.random().toString(36).substr(2, 9)}`,
          children
        )
        setSvg(svg)
        setError('')
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        }
        setSvg('')
      }
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [children])

  if (!svg && !error) {
    return (
      <div ref={elementRef} className='text-muted-foreground'>
        {t('generatingDiagram')}
      </div>
    )
  }

  if (error) {
    const isIncomplete =
      error.includes('Syntax error') || error.includes('Invalid')
    return (
      <div ref={elementRef} className='text-muted-foreground'>
        {isIncomplete ? t('waitingForDiagram') : t('diagramSyntaxError')}
      </div>
    )
  }

  return (
    <div className='group/mermaid relative my-4'>
      <div
        ref={elementRef}
        className='flex justify-center overflow-x-auto'
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className='invisible absolute right-2 top-2 flex space-x-1 rounded-lg bg-background/50 p-1 opacity-0 transition-all duration-200 group-hover/mermaid:visible group-hover/mermaid:opacity-100'>
        <CopyButton content={children} copyMessage={t('copiedSuccess')} />
      </div>
    </div>
  )
}

/**
 * Custom remark plugin for syntax highlighting
 * Processes code blocks and adds language information
 */
function remarkHighlight() {
  return (tree: any) => {
    visit(tree, 'text', (node, index, parent) => {
      const matches = Array.from(
        node.value.matchAll(/==(.*?)==/g)
      ) as Array<RegExpMatchArray>
      if (!matches.length) return

      const children = []
      let lastIndex = 0

      matches.forEach((match: RegExpMatchArray) => {
        const beforeText = node.value.slice(lastIndex, match.index)
        if (beforeText) {
          children.push({ type: 'text', value: beforeText })
        }

        children.push({
          type: 'highlight',
          data: { hName: 'mark' },
          children: [{ type: 'text', value: match[1] }],
        })

        lastIndex = (match.index ?? 0) + match[0].length
      })

      const afterText = node.value.slice(lastIndex)
      if (afterText) {
        children.push({ type: 'text', value: afterText })
      }

      parent.children.splice(index, 1, ...children)
    })
  }
}

/**
 * Main markdown renderer component
 * Configures and combines various markdown plugins and renderers
 * @component
 * @param {MarkdownRendererProps} props - Component props
 */
export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  const components: Components = {
    ...COMPONENTS,
    span: ({
      className,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      node,
      ...props
    }) => {
      // Only handle katex class, whether it's a block or inline
      if (className === 'katex') {
        return (
          <MathWrapper>
            <span className={className} {...props} />
          </MathWrapper>
        )
      }

      return <span className={className} {...props} />
    },
  }

  return (
    <Markdown
      remarkPlugins={[
        remarkGfm,
        remarkHighlight,
        [remarkMath, { singleDollar: true, doubleBackslash: true }],
      ]}
      rehypePlugins={[
        [
          rehypeKatex,
          {
            ...katexOptions,
            output: 'htmlAndMathml',
            trust: true,
            strict: false,
            throwOnError: false,
          },
        ],
      ]}
      components={components}
      className='space-y-3'
    >
      {children}
    </Markdown>
  )
}

/**
 * Props interface for syntax-highlighted pre elements
 * @interface HighlightedPre
 */
interface HighlightedPre extends React.HTMLAttributes<HTMLPreElement> {
  children: string
  language: string
}

/**
 * Memoized component for syntax-highlighted code blocks
 * Uses web-worker based highlighting for performance
 * @component
 */
const HighlightedPre = React.memo(
  ({ children, language, ...props }: HighlightedPre) => {
    const [tokens, setTokens] = useState<any[]>([])

    useEffect(() => {
      async function highlightCode() {
        const { codeToTokens, bundledLanguages } = await import('shiki')

        if (!(language in bundledLanguages)) {
          return
        }

        const result = await codeToTokens(children, {
          lang: language as keyof typeof bundledLanguages,
          defaultColor: false,
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        })

        setTokens(result.tokens)
      }

      highlightCode()
    }, [children, language])

    if (!tokens.length) {
      return <pre {...props}>{children}</pre>
    }

    return (
      <pre {...props}>
        <code>
          {tokens.map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              <span>
                {line.map((token: any, tokenIndex: number) => {
                  const style =
                    typeof token.htmlStyle === 'string'
                      ? undefined
                      : token.htmlStyle

                  return (
                    <span
                      key={tokenIndex}
                      className='bg-shiki-light-bg text-shiki-light dark:bg-shiki-dark-bg dark:text-shiki-dark'
                      style={style}
                    >
                      {token.content}
                    </span>
                  )
                })}
              </span>
              {lineIndex !== tokens.length - 1 && '\n'}
            </React.Fragment>
          ))}
        </code>
      </pre>
    )
  }
)
HighlightedPre.displayName = 'HighlightedCode'

/**
 * Props interface for code block components
 * @interface CodeBlockProps
 */
interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
  className?: string
  language: string
}

/**
 * Code block component with copy functionality
 * @component
 */
const CodeBlock = ({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) => {
  const t = useTranslations('playground')
  const code =
    typeof children === 'string'
      ? children
      : childrenTakeAllStringContents(children)

  if (language === 'mermaid') {
    return <MermaidWrapper>{code}</MermaidWrapper>
  }

  const preClass = cn(
    'overflow-x-scroll rounded-md border bg-background/50 p-4 font-mono text-sm [scrollbar-width:none]',
    className
  )

  return (
    <div className='group/code relative mb-4'>
      <Suspense
        fallback={
          <pre className={preClass} {...restProps}>
            {children}
          </pre>
        }
      >
        <HighlightedPre language={language} className={preClass}>
          {code}
        </HighlightedPre>
      </Suspense>

      <div className='invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100'>
        <CopyButton content={code} copyMessage={t('copiedSuccess')} />
      </div>
    </div>
  )
}

/**
 * Utility function to extract all string content from children
 * @param {any} element - React element to process
 * @returns {string} Concatenated string content
 */
function childrenTakeAllStringContents(element: any): string {
  if (typeof element === 'string') {
    return element
  }

  if (element?.props?.children) {
    const children = element.props.children

    if (Array.isArray(children)) {
      return children
        .map((child) => childrenTakeAllStringContents(child))
        .join('')
    } else {
      return childrenTakeAllStringContents(children)
    }
  }

  return ''
}

/**
 * Custom components for markdown rendering
 * Provides styled HTML elements with proper accessibility
 * @const
 */
const COMPONENTS = {
  h1: withClass('h1', 'text-2xl font-semibold'),
  h2: withClass('h2', 'font-semibold text-xl'),
  h3: withClass('h3', 'font-semibold text-lg'),
  h4: withClass('h4', 'font-semibold text-base'),
  h5: withClass('h5', 'font-medium'),
  strong: withClass('strong', 'font-semibold'),
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className='text-primary underline underline-offset-2'
      target='_blank'
      rel='noopener noreferrer'
      {...props}
    />
  ),
  blockquote: withClass('blockquote', 'border-l-2 border-primary pl-4'),
  code: ({ children, className, ...rest }: any) => {
    const match = /language-(\w+)/.exec(className || '')
    return match ? (
      <CodeBlock className={className} language={match[1]} {...rest}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          'font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-background/50 [:not(pre)>&]:px-1 [:not(pre)>&]:py-0.5'
        )}
        {...rest}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }: any) => children,
  ol: withClass('ol', 'list-decimal space-y-2 pl-6'),
  ul: withClass('ul', 'list-disc space-y-2 pl-6'),
  li: withClass('li', 'my-1.5'),
  table: withClass(
    'table',
    'w-full border-collapse overflow-y-auto rounded-md border border-foreground/20'
  ),
  th: withClass(
    'th',
    'border border-foreground/20 px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right'
  ),
  td: withClass(
    'td',
    'border border-foreground/20 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right'
  ),
  tr: withClass('tr', 'm-0 border-t p-0 even:bg-muted'),
  p: withClass(
    'p',
    'whitespace-pre-wrap [&_.katex]:leading-tight [&_.katex-display]:leading-tight [&_.katex]:subpixel-antialiased [&_.katex-display]:subpixel-antialiased'
  ),
  hr: withClass('hr', 'border-foreground/20'),
  mark: withClass('mark', 'bg-yellow-200 dark:bg-yellow-800 rounded px-1'),
}

/**
 * Higher-order component to add className to elements
 * @param {keyof JSX.IntrinsicElements} Tag - HTML element tag
 * @param {string} classes - CSS classes to apply
 */
function withClass(Tag: keyof JSX.IntrinsicElements, classes: string) {
  const Component = ({ ...props }: any) => (
    <Tag className={classes} {...props} />
  )
  Component.displayName = Tag
  return Component
}

export default MarkdownRenderer
