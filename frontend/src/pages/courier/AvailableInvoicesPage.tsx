import { useEffect, useState } from 'react';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { getAvailableDeliveries, pickupInvoice } from '../../api/deliveries';
import type { AvailableDelivery } from '../../types';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function AvailableInvoicesPage() {
  const [availableInvoices, setAvailableInvoices] = useState<AvailableDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickupLoadingId, setPickupLoadingId] = useState<number | null>(null);

  const loadAvailableInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAvailableDeliveries();
      setAvailableInvoices(data);
    } catch (loadError: unknown) {
      const message =
        typeof loadError === 'object' && loadError && 'response' in loadError
          ? String((loadError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to load available invoices.')
          : 'Unable to load available invoices.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAvailableInvoices();
  }, []);

  const handlePickup = async (invoiceId: number) => {
    setPickupLoadingId(invoiceId);
    setError('');

    try {
      await pickupInvoice(invoiceId);
      await loadAvailableInvoices();
    } catch (pickupError: unknown) {
      const message =
        typeof pickupError === 'object' && pickupError && 'response' in pickupError
          ? String((pickupError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to pick up invoice.')
          : 'Unable to pick up invoice.';

      if ((pickupError as { response?: { status?: number } })?.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else {
        setError(message || 'Invoice is not available for pickup.');
      }
    } finally {
      setPickupLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Available invoices</h1>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <div className="rounded-[6px] border border-line bg-surface p-4 text-sm text-slate-500">Loading available invoices...</div>
      ) : availableInvoices.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-line bg-surface p-5 text-center text-sm text-slate-500">
          No invoices available for pickup.
        </div>
      ) : (
        <div className="space-y-3">
          {availableInvoices.map((invoice) => (
            <div key={invoice.invoiceId} className="rounded-[6px] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-slate-600">{invoice.clientName}</p>
                </div>
                <StatusBadge status={invoice.invoiceStatus} />
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>{invoice.clientAddress}</p>
                <p>{invoice.clientCity}</p>
                <p>Issue date: {formatDate(invoice.issueDate)}</p>
                <p>Amount: {formatCurrency(invoice.amount)}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  className="w-auto"
                  loading={pickupLoadingId === invoice.invoiceId}
                  disabled={pickupLoadingId === invoice.invoiceId}
                  onClick={() => handlePickup(invoice.invoiceId)}
                >
                  Pick up
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AvailableInvoicesPage;
