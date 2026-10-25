import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'error' | 'success' | 'info';
  children: ReactNode;
}

const variantStyles = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div className={['rounded-[6px] border px-3 py-2 text-sm', variantStyles[variant]].join(' ')}>
      {children}
    </div>
  );
}

export default Alert;
