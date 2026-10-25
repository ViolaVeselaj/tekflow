import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-route text-white border-transparent hover:bg-[#1d49ae]',
  secondary: 'bg-surface text-ink border-line hover:bg-paper',
  danger: 'bg-[#FBE1E2] text-[#A4262C] border-[#F0B7BC] hover:bg-[#F8D9DA]',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center rounded-[6px] border px-3 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-route focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
