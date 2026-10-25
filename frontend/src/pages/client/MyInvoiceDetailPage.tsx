import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { getInvoice, respondToInvoice } from '../../api/invoices';
import type { ClientInvoiceResponseRequest, Invoice, InvoiceDecision } from '../../types';

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

function MyInvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = id ? Number(id) : null;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInvoice = async () => {
    if (!invoiceId || !Number.isFinite(invoiceId)) {
      setError('Invoice not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await getInvoice(invoiceId);
      setInvoice(data);
      setComment('');
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

  useEffect(() => {
    void loadInvoice();
  }, [invoiceId]);

  const canRespond = invoice?.status === 'Delivered';
  const hasFinalResponse = invoice ? ['Accepted', 'PartiallyAccepted', 'Rejected'].includes(invoice.status) : false;

  const detailRows = useMemo(
    () => [
      ['Invoice number', invoice?.invoiceNumber ?? '—'],
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

  const submitResponse = async (decision: InvoiceDecision) => {
    if (!invoiceId || !invoice) {
      return;
    }

    const trimmedComment = comment.trim();

    if (decision === 'PartiallyAccepted' && !trimmedComment) {
      setError('Comment is required for partial acceptance.');
      return;
    }

    if (decision === 'Rejected' && !trimmedComment) {
      setError('Comment is required when rejecting an invoice.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload: ClientInvoiceResponseRequest = {
      decision,
      comment: trimmedComment || undefined,
    };

    try {
      await respondToInvoice(invoiceId, payload);
      await loadInvoice();
    } catch (submitError: unknown) {
      const message =
        typeof submitError === 'object' && submitError && 'response' in submitError
          ? String((submitError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to submit response.')
          : 'Unable to submit response.';

      if ((submitError as { response?: { status?: number } })?.response?.status === 403) {
        setError('You do not have access to this invoice.');
      } else if ((submitError as { response?: { status?: number } })?.response?.status === 409) {
        setError(message || 'Invoice is not available for response.');
      } else if ((submitError as { response?: { status?: number } })?.response?.status === 404) {
        setError('Invoice not found.');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Invoice details</h1>
        <Link to="/my/invoices" className="text-sm font-medium text-route hover:underline">
          Back to list
        </Link>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <div className="rounded-[6px] border border-line bg-surface p-4 text-sm text-slate-500">Loading invoice...</div>
      ) : !invoice ? null : (
        <>
          <div className="rounded-[6px] border border-line bg-surface p-4">
            <dl className="space-y-4">
              {detailRows.map(([label, value]) => (
                <div key={String(label)} className="grid gap-2 border-b border-line pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[180px_1fr]">
                  <dt className="text-sm font-medium text-slate-600">{label}</dt>
                  <dd className="text-sm text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {canRespond ? (
            <div className="rounded-[6px] border border-line bg-surface p-4">
              <h2 className="text-lg font-semibold text-ink">Your response</h2>

              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Button type="button" variant="primary" disabled={submitting} onClick={() => void submitResponse('Accepted')}>
                    Accept
                  </Button>
                  <Button type="button" variant="secondary" disabled={submitting} onClick={() => void submitResponse('PartiallyAccepted')}>
                    Partially accept
                  </Button>
                  <Button type="button" variant="danger" disabled={submitting} onClick={() => void submitResponse('Rejected')}>
                    Reject
                  </Button>
                </div>

                <label className="block space-y-1.5 text-sm text-ink">
                  <span className="font-medium">Comment</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={4}
                    placeholder="Add a note (optional for acceptance)"
                    className="w-full rounded-[6px] border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-slate-400 focus:border-route focus:outline-none focus:ring-2 focus:ring-route/20"
                  />
                </label>
              </div>
            </div>
          ) : hasFinalResponse ? (
            <div className="rounded-[6px] border border-line bg-surface p-4">
              <h2 className="text-lg font-semibold text-ink">Final response</h2>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status={invoice.status} />
              </div>
              {invoice.clientComment ? <p className="mt-3 text-sm text-slate-600">{invoice.clientComment}</p> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default MyInvoiceDetailPage;
