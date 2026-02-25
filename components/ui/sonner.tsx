'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'dark' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:border group-[.toaster]:border-white/[0.08] group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl',
          description: 'group-[.toast]:text-muted-foreground',
          success:
            'group-[.toaster]:border-primary/30 group-[.toaster]:bg-card group-[.toaster]:text-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-white/[0.04] group-[.toast]:text-muted-foreground group-[.toast]:border-white/[0.12]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
