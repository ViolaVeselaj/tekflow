export type InvoiceStatus =
  | 'Created'
  | 'PickedUp'
  | 'Delivered'
  | 'Accepted'
  | 'PartiallyAccepted'
  | 'Rejected';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const statusMap: Record<
  InvoiceStatus,
  { label: string; textClass: string; bgClass: string; dotClass: string }
> = {
  Created: {
    label: 'Created',
    textClass: 'text-created-text',
    bgClass: 'bg-created-bg',
    dotClass: 'bg-created-text',
  },
  PickedUp: {
    label: 'Picked up',
    textClass: 'text-pickedup-text',
    bgClass: 'bg-pickedup-bg',
    dotClass: 'bg-pickedup-text',
  },
  Delivered: {
    label: 'Delivered',
    textClass: 'text-delivered-text',
    bgClass: 'bg-delivered-bg',
    dotClass: 'bg-delivered-text',
  },
  Accepted: {
    label: 'Accepted',
    textClass: 'text-accepted-text',
    bgClass: 'bg-accepted-bg',
    dotClass: 'bg-accepted-text',
  },
  PartiallyAccepted: {
    label: 'Partially accepted',
    textClass: 'text-partiallyaccepted-text',
    bgClass: 'bg-partiallyaccepted-bg',
    dotClass: 'bg-partiallyaccepted-text',
  },
  Rejected: {
    label: 'Rejected',
    textClass: 'text-rejected-text',
    bgClass: 'bg-rejected-bg',
    dotClass: 'bg-rejected-text',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status];

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-xs font-medium',
        config.textClass,
        config.bgClass,
      ].join(' ')}
    >
      <span className={['size-2 rounded-full', config.dotClass].join(' ')} aria-hidden="true" />
      {config.label}
    </span>
  );
}

export default StatusBadge;
