import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { deleteInvoice, downloadInvoiceExcel, downloadInvoicePdf, getInvoice } from '../../api/invoices';
import type { Invoice } from '../../types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceId = id ? Number(id) : null;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!invoiceId || !Number.isFinite(invoiceId)) {
      setError('Invoice not found.');
      setLoading(false);
      return;
    }

    const loadInvoice = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getInvoice(invoiceId);
        setInvoice(data);
      } catch (loadError: unknown) {
        const message =
          typeof loadError === 'object' && loadError && 'response' in loadError
            ? String((loadError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Invoice not found.')
            : 'Invoice not found.';

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadInvoice();
  }, [invoiceId]);

  const handleDownloadPdf = async () => {
    if (!invoice || !invoiceId) {
      return;
    }

    try {
      setPdfLoading(true);
      setError('');
      await downloadInvoicePdf(invoiceId, invoice.invoiceNumber);
    } catch (downloadError: unknown) {
      const status =
        typeof downloadError === 'object' && downloadError && 'response' in downloadError
          ? Number((downloadError as { response?: { status?: number } }).response?.status)
          : undefined;

      if (status === 403) {
        setError('You do not have permission to download this file.');
        return;
      }

      if (status === 404) {
        setError('Invoice not found.');
        return;
      }

      setError('Unable to download the file.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!invoice || !invoiceId) {
      return;
    }

    try {
      setExcelLoading(true);
      setError('');
      await downloadInvoiceExcel(invoiceId, invoice.invoiceNumber);
    } catch (downloadError: unknown) {
      const status =
        typeof downloadError === 'object' && downloadError && 'response' in downloadError
          ? Number((downloadError as { response?: { status?: number } }).response?.status)
          : undefined;

      if (status === 403) {
        setError('You do not have permission to download this file.');
        return;
      }

      if (status === 404) {
        setError('Invoice not found.');
        return;
      }

      setError('Unable to download the file.');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice || !invoiceId) {
      return;
    }

    const confirmed = window.confirm('Delete this invoice? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteInvoice(invoice.id);
      navigate('/invoices', { replace: true });
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
      setDeleting(false);
    }
  };

  const status = invoice?.status ?? 'Created';
  const isCreatedStatus = status === 'Created';

  const detailRows = useMemo(
    () => [
      ['Invoice number', invoice?.invoiceNumber ?? '—'],
      ['Client', invoice?.clientName ?? '—'],
      ['Issue date', formatDate(invoice?.issueDate)],
      ['Amount', invoice ? formatCurrency(invoice.amount) : '—'],
      ['Description', invoice?.description || '—'],
      ['Status', invoice ? <StatusBadge key="status" status={invoice.status} /> : '—'],
      ['Created at', formatDate(invoice?.createdAt)],
      ['Accepted at', formatDate(invoice?.acceptedAt)],
      ['Client comment', invoice?.clientComment || '—'],
    ],
    [invoice]
  );

  return (
    <div className="min-h-[240px] rounded-[6px] border border-line bg-surface p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-slate-500">Invoices</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Invoice details</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/invoices">
            <Button type="button" variant="secondary">Back to list</Button>
          </Link>
          {invoice ? (
            <>
              <Button type="button" variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading || excelLoading || deleting} loading={pdfLoading}>
                {pdfLoading ? 'Downloading PDF...' : 'Download PDF'}
              </Button>
              <Button type="button" variant="primary" onClick={handleDownloadExcel} disabled={pdfLoading || excelLoading || deleting} loading={excelLoading}>
                {excelLoading ? 'Downloading Excel...' : 'Download Excel'}
              </Button>
            </>
          ) : null}
          {isCreatedStatus && invoice ? (
            <>
              <Link to={`/invoices/${invoice.id}/edit`}>
                <Button type="button" variant="primary">Edit invoice</Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#A4262C] hover:bg-transparent hover:text-[#7F1D1D] focus-visible:ring-0"
                onClick={() => void handleDelete()}
                disabled={deleting}
                loading={deleting}
              >
                {deleting ? 'Deleting invoice...' : 'Delete invoice'}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <div className="text-sm text-slate-500">Loading invoice...</div>
      ) : !invoice ? null : (
        <div className="mx-auto max-w-3xl rounded-[6px] border border-line bg-paper p-5">
          <dl className="space-y-4">
            {detailRows.map(([label, value]) => (
              <div key={String(label)} className="grid gap-2 border-b border-line pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-medium text-slate-600">{label}</dt>
                <dd className="text-sm text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

export default InvoiceDetailPage;
