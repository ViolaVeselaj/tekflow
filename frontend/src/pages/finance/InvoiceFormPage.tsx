import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { getClients } from '../../api/clients';
import { createInvoice, getInvoice, updateInvoice } from '../../api/invoices';
import type { Client, CreateInvoiceRequest, Invoice, UpdateInvoiceRequest } from '../../types';

interface InvoiceFormValues {
  invoiceNumber: string;
  issueDate: string;
  amount: string;
  description: string;
  clientId: string;
}

const emptyForm: InvoiceFormValues = {
  invoiceNumber: '',
  issueDate: '',
  amount: '',
  description: '',
  clientId: '',
};

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response as { data?: string | { message?: string } } | undefined;

    if (typeof response?.data === 'string') {
      return response.data;
    }

    if (response?.data && typeof response.data === 'object' && 'message' in response.data) {
      return String(response.data.message);
    }
  }

  return 'Something went wrong.';
}

function InvoiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceId = id ? Number(id) : null;
  const isEditMode = Boolean(invoiceId && Number.isFinite(invoiceId));

  const [form, setForm] = useState<InvoiceFormValues>(emptyForm);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pageTitle = useMemo(() => (isEditMode ? 'Edit invoice' : 'Add invoice'), [isEditMode]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const data = await getClients();
        setClients(data);
      } catch (loadError: unknown) {
        const message = getErrorMessage(loadError);
        setError(message || 'Unable to load clients.');
      } finally {
        setLoadingClients(false);
      }
    };

    void loadClients();
  }, []);

  useEffect(() => {
    if (!isEditMode || !invoiceId) {
      return;
    }

    const loadInvoice = async () => {
      try {
        setLoadingInvoice(true);
        setError('');
        const invoice: Invoice = await getInvoice(invoiceId);

        if (invoice.status !== 'Created') {
          setError('This invoice can no longer be edited because its delivery workflow has started.');
          return;
        }

        setForm({
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          amount: String(invoice.amount),
          description: invoice.description ?? '',
          clientId: String(invoice.clientId),
        });
      } catch (loadError: unknown) {
        const message = getErrorMessage(loadError);
        setError(message === 'Invoice not found.' ? 'Invoice not found.' : message || 'Unable to load invoice.');
      } finally {
        setLoadingInvoice(false);
      }
    };

    void loadInvoice();
  }, [invoiceId, isEditMode]);

  const handleChange = (field: keyof InvoiceFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!form.invoiceNumber.trim()) {
      setError('Invoice number is required.');
      return;
    }

    if (!form.issueDate) {
      setError('Issue date is required.');
      return;
    }

    const amountValue = Number(form.amount);
    if (!form.amount || Number.isNaN(amountValue) || amountValue <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    const clientIdValue = Number(form.clientId);
    if (!clientIdValue || !Number.isFinite(clientIdValue)) {
      setError('Client is required.');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && invoiceId) {
        const payload: UpdateInvoiceRequest = {
          invoiceNumber: form.invoiceNumber.trim(),
          issueDate: form.issueDate,
          amount: amountValue,
          description: form.description.trim() || undefined,
          clientId: clientIdValue,
        };

        await updateInvoice(invoiceId, payload);
      } else {
        const payload: CreateInvoiceRequest = {
          invoiceNumber: form.invoiceNumber.trim(),
          issueDate: form.issueDate,
          amount: amountValue,
          description: form.description.trim() || undefined,
          clientId: clientIdValue,
        };

        await createInvoice(payload);
      }

      navigate('/invoices', { replace: true });
    } catch (submitError: unknown) {
      const message = getErrorMessage(submitError);

      if ((submitError as { response?: { status?: number } })?.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else if ((submitError as { response?: { status?: number } })?.response?.status === 409) {
        setError(message || 'Invoice can only be edited while it is in Created status.');
      } else {
        setError(message || 'Unable to save invoice.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnlyEditBlocked = isEditMode && !loadingInvoice && Boolean(error && error.includes('delivery workflow'));

  return (
    <div className="min-h-[240px] rounded-[6px] border border-line bg-surface p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-slate-500">Invoices</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{pageTitle}</h1>
        </div>

        <Link to="/invoices" className="text-sm font-medium text-route hover:underline">
          Cancel
        </Link>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loadingClients || loadingInvoice ? (
        <div className="text-sm text-slate-500">Loading...</div>
      ) : isReadOnlyEditBlocked ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{error}</p>
          <Link to="/invoices">
            <Button type="button" variant="primary">Back to invoices</Button>
          </Link>
        </div>
      ) : (
        <form className="mx-auto max-w-2xl space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Invoice number" name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange('invoiceNumber')} required />
            <Field label="Issue date" type="date" name="issueDate" value={form.issueDate} onChange={handleChange('issueDate')} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" type="number" step="0.01" min="0.01" name="amount" value={form.amount} onChange={handleChange('amount')} required />
            <label className="block space-y-1.5 text-sm text-ink">
              <span className="font-medium">Client</span>
              <select
                value={form.clientId}
                onChange={handleChange('clientId')}
                className="w-full rounded-[6px] border border-line bg-surface px-3 py-2 text-base text-ink focus:border-route focus:outline-none focus:ring-2 focus:ring-route/20"
                required
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={String(client.id)}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-sm text-ink">
            <span className="font-medium">Description</span>
            <textarea
              value={form.description}
              onChange={handleChange('description')}
              rows={5}
              className="w-full rounded-[6px] border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-slate-400 focus:border-route focus:outline-none focus:ring-2 focus:ring-route/20"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/invoices">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" disabled={submitting} loading={submitting}>
              {submitting ? (isEditMode ? 'Saving changes...' : 'Creating invoice...') : isEditMode ? 'Save changes' : 'Save invoice'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default InvoiceFormPage;
