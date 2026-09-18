import type { InputHTMLAttributes } from 'react'

type AuthFieldProps = {
  label: string
  id: string
} & InputHTMLAttributes<HTMLInputElement>

export function AuthField({ label, id, ...props }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-input bg-card/60 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
        {...props}
      />
    </div>
  )
}
