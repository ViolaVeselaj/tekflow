import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { deleteInvoice, getInvoices } from '../../api/invoices';
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

function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getInvoices();
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

  useEffect(() => {
    void loadInvoices();
  }, []);

  const handleDelete = async (invoice: Invoice) => {
    const confirmed = window.confirm('Delete this invoice? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingId(invoice.id);
    setError('');

    try {
      await deleteInvoice(invoice.id);
      await loadInvoices();
    } catch (deleteError: unknown) {
      const status =
        typeof deleteError === 'object' && deleteError && 'response' in deleteError
          ? Number((deleteError as { response?: { status?: number } }).response?.status)
          : undefined;

      const backendMessage =
        typeof deleteError === 'object' && deleteError && 'response' in deleteError
          ? String((deleteError as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : '';

      if (status === 403) {
        setError('You do not have permission to delete this invoice.');
        return;
      }

      if (status === 404) {
        setError('Invoice not found.');
        return;
      }

      if (status === 409) {
        setError(backendMessage || 'Unable to delete this invoice.');
        return;
      }

      setError('Unable to delete the invoice.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Invoices</h1>
          </div>

          <Link to="/invoices/new">
            <Button type="button" variant="primary">Add invoice</Button>
          </Link>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        {loading ? (
          <div className="text-sm text-slate-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="rounded-[6px] border border-dashed border-line bg-paper p-6 text-center">
            <p className="text-base font-medium text-ink">No invoices yet.</p>
            <div className="mt-4">
              <Link to="/invoices/new">
                <Button type="button" variant="primary">Add invoice</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-ink">
              <thead>
                <tr>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Invoice number</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Client</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Issue date</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Amount</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Status</th>
                  <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="align-middle">
                    <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{invoice.invoiceNumber}</td>
                    <td className="border-b border-line px-3 py-2.5 text-slate-600">{invoice.clientName}</td>
                    <td className="border-b border-line px-3 py-2.5 text-slate-600">{formatDate(invoice.issueDate)}</td>
                    <td className="border-b border-line px-3 py-2.5 font-medium tabular-nums text-slate-700">{formatCurrency(invoice.amount)}</td>
                    <td className="border-b border-line px-3 py-2.5">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link to={`/invoices/${invoice.id}`} className="text-sm font-medium text-route hover:underline">
                          View
                        </Link>
                        {invoice.status === 'Created' ? (
                          <>
                            <Link to={`/invoices/${invoice.id}/edit`} className="text-sm font-medium text-route hover:underline">
                              Edit
                            </Link>
                            <Button
                              type="button"
                              variant="secondary"
                              className="border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#A4262C] hover:bg-transparent hover:text-[#7F1D1D] focus-visible:ring-0"
                              disabled={deletingId === invoice.id}
                              loading={deletingId === invoice.id}
                              onClick={() => void handleDelete(invoice)}
                            >
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
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

export default InvoicesPage;
