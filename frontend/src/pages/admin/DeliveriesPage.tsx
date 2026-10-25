import { useEffect, useState } from 'react';
import { Alert } from '../../components/Alert';
import { StatusBadge } from '../../components/StatusBadge';
import { getAdminDeliveries } from '../../api/deliveries';
import type { AdminDelivery } from '../../types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAdminDeliveries();
        setDeliveries(data);
      } catch (loadError: unknown) {
        const responseStatus =
          typeof loadError === 'object' && loadError && 'response' in loadError
            ? Number((loadError as { response?: { status?: number } }).response?.status)
            : undefined;

        if (responseStatus === 403) {
          setError('You do not have permission to view deliveries.');
          return;
        }

        const message =
          typeof loadError === 'object' && loadError && 'response' in loadError
            ? String(
                (loadError as { response?: { data?: { message?: string } } }).response?.data?.message ??
                  'Unable to load deliveries.'
              )
            : 'Unable to load deliveries.';

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDeliveries();
  }, []);

  return (
    <div className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Deliveries</h1>
          </div>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        {loading ? (
          <div className="text-sm text-slate-500">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="rounded-[6px] border border-dashed border-line bg-paper p-6 text-center">
            <p className="text-base font-medium text-ink">No deliveries yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[6px] border border-line bg-surface">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-ink">
              <thead>
                <tr>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Invoice number</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Client</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Courier</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Picked up</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Delivered</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Status</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600 text-right">Postal cost</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="align-middle">
                    <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{delivery.invoiceNumber}</td>
                    <td className="border-b border-line px-3 py-2.5 text-slate-600">
                      <div className="font-medium text-ink">{delivery.clientName}</div>
                      <div className="text-xs text-slate-500">{delivery.clientCity}</div>
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-slate-600">{delivery.courierName}</td>
                    <td className="border-b border-line px-3 py-2.5 tabular-nums text-slate-600">
                      {formatDateTime(delivery.pickedUpAt)}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 tabular-nums text-slate-600">
                      {formatDateTime(delivery.deliveredAt ?? null)}
                    </td>
                    <td className="border-b border-line px-3 py-2.5">
                      <StatusBadge status={delivery.invoiceStatus} />
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right font-medium tabular-nums text-slate-700">
                      {formatCurrency(delivery.postalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveriesPage;
