import { type FormEvent, useState } from 'react';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { changePassword } from '../api/auth';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword.trim()) {
      setError('Current password is required.');
      return;
    }

    if (!newPassword.trim()) {
      setError('New password is required.');
      return;
    }

    if (!confirmNewPassword.trim()) {
      setError('Confirm new password is required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (changeError: unknown) {
      const message =
        typeof changeError === 'object' && changeError && 'response' in changeError
          ? (changeError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      setError(message || 'Unable to change password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Change password</h1>
      </div>

      <div className="w-full max-w-xl rounded-[6px] border border-line bg-surface p-5 sm:p-6">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter your current password"
          />

          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter a new password"
          />

          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            placeholder="Confirm your new password"
          />

          {error ? <Alert variant="error">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <Button type="submit" variant="primary" disabled={submitting} loading={submitting} className="w-full sm:w-auto">
            {submitting ? 'Changing...' : 'Change password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
