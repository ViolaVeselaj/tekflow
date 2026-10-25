import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, ...props }: FieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className="block space-y-1.5 text-sm text-ink" htmlFor={inputId}>
      <span className="font-medium">{label}</span>
      <input
        id={inputId}
        className={[
          'w-full rounded-[6px] border bg-surface px-3 py-2 text-base text-ink placeholder:text-slate-400',
          'border-line focus:border-route focus:outline-none focus:ring-2 focus:ring-route/20',
          error ? 'border-red-300' : '',
        ].join(' ')}
        {...props}
      />
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

export default Field;
