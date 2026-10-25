import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { deleteClient, getClients } from '../../api/clients';
import type { Client } from '../../types';

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getClients();
      setClients(data);
    } catch (loadError: unknown) {
      const message =
        typeof loadError === 'object' && loadError && 'response' in loadError
          ? String((loadError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to load clients.')
          : 'Unable to load clients.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const handleDelete = async (client: Client) => {
    const confirmed = window.confirm('Delete this client? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingId(client.id);
    setError('');

    try {
      await deleteClient(client.id);
      await loadClients();
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
        setError('You do not have permission to delete this client.');
        return;
      }

      if (status === 404) {
        setError('Client not found.');
        return;
      }

      if (status === 409) {
        setError(backendMessage || 'Client cannot be deleted because invoices are linked to it.');
        return;
      }

      setError('Unable to delete the client.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-[240px] rounded-[6px] border border-line bg-surface p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Manage client records and contact details.</p>
        </div>

        <Link to="/clients/new">
          <Button type="button" variant="primary">Add client</Button>
        </Link>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <div className="text-sm text-slate-500">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-line bg-paper p-6 text-center">
          <p className="text-base font-medium text-ink">No clients yet.</p>
          <div className="mt-4">
            <Link to="/clients/new">
              <Button type="button" variant="primary">Add client</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-ink">
            <thead>
              <tr>
                <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Name</th>
                <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">City</th>
                <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Contact name</th>
                <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600">Phone</th>
                <th className="border-b border-line bg-paper px-3 py-2.5 font-medium text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="align-middle">
                  <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{client.name}</td>
                  <td className="border-b border-line px-3 py-2.5 text-slate-600">{client.city}</td>
                  <td className="border-b border-line px-3 py-2.5 text-slate-600">{client.contactName || '—'}</td>
                  <td className="border-b border-line px-3 py-2.5 text-slate-600">{client.phone || '—'}</td>
                  <td className="border-b border-line px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/clients/${client.id}/edit`} className="text-sm font-medium text-route hover:underline">
                        Edit
                      </Link>
                      <Button
                        type="button"
                        variant="secondary"
                        className="border-0 bg-transparent px-0 py-0 text-sm font-medium text-[#A4262C] hover:bg-transparent hover:text-[#7F1D1D] focus-visible:ring-0"
                        disabled={deletingId === client.id}
                        loading={deletingId === client.id}
                        onClick={() => void handleDelete(client)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ClientsPage;
