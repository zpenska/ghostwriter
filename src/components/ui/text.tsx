import clsx from 'clsx'
import { Link } from './link'
import type { HTMLAttributes, ReactNode } from 'react'

// 👇 NEW: Define variants
export type TextVariant =
  | 'body'
  | 'caption'
  | 'title'
  | 'subtitle'
  | 'code'
  | 'lead'

const variantStyles: Record<TextVariant, string> = {
  body: 'text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400',
  caption: 'text-xs text-zinc-500 dark:text-zinc-400',
  title: 'text-xl font-bold text-zinc-900 dark:text-white',
  subtitle: 'text-base font-semibold text-zinc-800 dark:text-zinc-200',
  code: 'font-mono text-sm text-zinc-800 dark:text-white',
  lead: 'text-lg text-zinc-900 dark:text-white',
}

type TextProps = {
  children: ReactNode
  variant?: TextVariant
  className?: string
} & HTMLAttributes<HTMLParagraphElement>

// ✅ Updated <Text /> with variant support
export function Text({
  children,
  variant = 'body',
  className,
  ...props
}: TextProps) {
  return (
    <p
      data-slot="text"
      {...props}
      className={clsx(variantStyles[variant], className)}
    >
      {children}
    </p>
  )
}

// ✅ Keep your other exports the same

export function TextLink({ className, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        className,
        'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white'
      )}
    />
  )
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
  return (
    <strong
      {...props}
      className={clsx(className, 'font-medium text-zinc-950 dark:text-white')}
    />
  )
}

export function Code({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      className={clsx(
        className,
        'rounded-sm border border-zinc-950/10 bg-zinc-950/2.5 px-0.5 text-sm font-medium text-zinc-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white'
      )}
    />
  )
}
