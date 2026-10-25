import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { createClient, getClient, updateClient } from '../../api/clients';
import type { Client, CreateClientRequest, UpdateClientRequest } from '../../types';

interface ClientFormValues {
  name: string;
  address: string;
  city: string;
  contactName: string;
  phone: string;
  email: string;
  password: string;
}

const emptyForm: ClientFormValues = {
  name: '',
  address: '',
  city: '',
  contactName: '',
  phone: '',
  email: '',
  password: '',
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

function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const clientId = id ? Number(id) : null;
  const isEditMode = Boolean(clientId && Number.isFinite(clientId));

  const [form, setForm] = useState<ClientFormValues>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetchingClient, setFetchingClient] = useState(isEditMode);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const pageTitle = useMemo(() => (isEditMode ? 'Edit client' : 'Add client'), [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !clientId) {
      return;
    }

    const loadClient = async () => {
      try {
        setFetchingClient(true);
        setError('');

        const client: Client = await getClient(clientId);
        setForm({
          name: client.name ?? '',
          address: client.address ?? '',
          city: client.city ?? '',
          contactName: client.contactName ?? '',
          phone: client.phone ?? '',
          email: '',
          password: '',
        });
      } catch (loadError: unknown) {
        const message = getErrorMessage(loadError);

        if (message === 'Client not found.' || (loadError && typeof loadError === 'object' && 'response' in loadError && (loadError as { response?: { status?: number } }).response?.status === 404)) {
          setError('Client not found.');
        } else {
          setError(message || 'Unable to load client.');
        }
      } finally {
        setFetchingClient(false);
      }
    };

    void loadClient();
  }, [clientId, isEditMode]);

  const handleChange = (field: keyof ClientFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Name, address, and city are required.');
      return;
    }

    if (!isEditMode && (!form.email.trim() || !form.password.trim())) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && clientId) {
        const payload: UpdateClientRequest = {
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          contactName: form.contactName.trim() || undefined,
          phone: form.phone.trim() || undefined,
        };

        await updateClient(clientId, payload);
      } else {
        const payload: CreateClientRequest = {
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          contactName: form.contactName.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim(),
          password: form.password,
        };

        await createClient(payload);
        setSuccessMessage('Client created successfully.');
      }

      navigate('/clients', { replace: true });
    } catch (submitError: unknown) {
      const message = getErrorMessage(submitError);

      if (message === 'A user with this email already exists.') {
        setError(message);
      } else if ((submitError as { response?: { status?: number } })?.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else {
        setError(message || 'Unable to save client.');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = loading ? (isEditMode ? 'Saving changes...' : 'Saving client...') : isEditMode ? 'Save changes' : 'Save client';

  return (
    <div className="min-h-[240px] rounded-[6px] border border-line bg-surface p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-slate-500">Clients</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{pageTitle}</h1>
        </div>

        <Link to="/clients" className="text-sm font-medium text-route hover:underline">
          Cancel
        </Link>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

      {fetchingClient ? (
        <div className="text-sm text-slate-500">Loading client...</div>
      ) : (
        <form className="mx-auto max-w-2xl space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" value={form.name} onChange={handleChange('name')} required />
            <Field label="City" name="city" value={form.city} onChange={handleChange('city')} required />
          </div>

          <Field label="Address" name="address" value={form.address} onChange={handleChange('address')} required />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name" name="contactName" value={form.contactName} onChange={handleChange('contactName')} />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange('phone')} />
          </div>

          {!isEditMode ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" type="email" name="email" value={form.email} onChange={handleChange('email')} required />
              <Field label="Password" type="password" name="password" value={form.password} onChange={handleChange('password')} required />
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/clients">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              {submitLabel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ClientFormPage;
