import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { StatusBadge } from '../../components/StatusBadge';
import { getMyInvoices } from '../../api/invoices';
import type { Invoice } from '../../types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

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

function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getMyInvoices();
        setInvoices(data);
      } catch (loadError: unknown) {
        const message =
          typeof loadError === 'object' && loadError && 'response' in loadError
            ? String((loadError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to load invoices.')
            : 'Unable to load invoices.';

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadInvoices();
  }, []);

  return (
    <div className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">My invoices</h1>
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}

          {loading ? (
            <div className="rounded-[6px] border border-line bg-surface p-4 text-sm text-slate-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="rounded-[6px] border border-dashed border-line bg-surface p-5 text-center text-sm text-slate-500">
              No invoices yet.
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-[6px] border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-ink">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-slate-600">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>Amount: {formatCurrency(invoice.amount)}</p>
                    {invoice.description ? <p>{invoice.description}</p> : null}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link to={`/my/invoices/${invoice.id}`} className="inline-flex items-center justify-center rounded-[6px] border border-route bg-route px-3 py-2 text-sm font-medium text-white hover:bg-[#1d49ae]">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyInvoicesPage;
