import { useEffect, useState } from 'react';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { getMyDeliveries, markDelivered } from '../../api/deliveries';
import type { Delivery } from '../../types';

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

function MyDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveringId, setDeliveringId] = useState<number | null>(null);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyDeliveries();
      setDeliveries(data);
    } catch (loadError: unknown) {
      const message =
        typeof loadError === 'object' && loadError && 'response' in loadError
          ? String((loadError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to load deliveries.')
          : 'Unable to load deliveries.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeliveries();
  }, []);

  const handleDeliver = async (deliveryId: number) => {
    setDeliveringId(deliveryId);
    setError('');

    try {
      await markDelivered(deliveryId);
      await loadDeliveries();
    } catch (deliverError: unknown) {
      const message =
        typeof deliverError === 'object' && deliverError && 'response' in deliverError
          ? String((deliverError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to mark delivered.')
          : 'Unable to mark delivered.';

      if ((deliverError as { response?: { status?: number } })?.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else {
        setError(message);
      }
    } finally {
      setDeliveringId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">My deliveries</h1>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <div className="rounded-[6px] border border-line bg-surface p-4 text-sm text-slate-500">Loading deliveries...</div>
      ) : deliveries.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-line bg-surface p-5 text-center text-sm text-slate-500">
          No deliveries yet.
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="rounded-[6px] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">{delivery.invoiceNumber}</p>
                  <p className="text-sm text-slate-600">{delivery.clientName}</p>
                </div>
                <StatusBadge status={delivery.invoiceStatus} />
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>{delivery.clientAddress}</p>
                <p>{delivery.clientCity}</p>
                <p>Picked up at: {formatDateTime(delivery.pickedUpAt)}</p>
                <p>Delivered at: {formatDateTime(delivery.deliveredAt)}</p>
              </div>

              {delivery.invoiceStatus === 'PickedUp' ? (
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-auto"
                    loading={deliveringId === delivery.id}
                    disabled={deliveringId === delivery.id}
                    onClick={() => handleDeliver(delivery.id)}
                  >
                    Deliver
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyDeliveriesPage;
