'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** delay in ms */
  delay?: number
  /** translate distance in px */
  y?: number
  as?: 'div' | 'section' | 'li' | 'span'
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Tag = as as 'div'

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        'transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none',
        visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 blur-[2px]',
        className,
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transform: visible ? undefined : `translateY(${y}px)`,
      }}
    >
      {children}
    </Tag>
  )
}
