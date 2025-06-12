import * as TogglePrimitive from '@radix-ui/react-toggle'
import clsx from 'clsx'

export function Toggle({ pressed, onPressedChange, children }: {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  children: React.ReactNode
}) {
  return (
    <TogglePrimitive.Root
      className={clsx('px-3 py-1.5 border rounded-md', {
        'bg-zinc-900 text-white': pressed,
        'bg-white text-zinc-700': !pressed,
      })}
      pressed={pressed}
      onPressedChange={onPressedChange}
    >
      {children}
    </TogglePrimitive.Root>
  )
}
