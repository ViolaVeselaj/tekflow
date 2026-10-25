import { type FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { resetPassword } from '../api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const invalidToken = !token;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (invalidToken) {
      setError('Password reset link is invalid or has expired.');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      setError('Please enter a new password and confirm it.');
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
      await resetPassword({
        token,
        newPassword,
        confirmNewPassword,
      });

      setSuccess('Password has been reset successfully.');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (resetError: unknown) {
      const message =
        typeof resetError === 'object' && resetError && 'response' in resetError
          ? (resetError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      setError(message || 'Unable to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[6px] border border-line bg-surface p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-route">TekFlow</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">Reset password</h1>
          </div>

          {invalidToken ? (
            <div className="space-y-4">
              <Alert variant="error">Password reset link is invalid or has expired.</Alert>
              <div className="pt-1 text-center">
                <Link to="/login" className="text-sm font-medium text-route hover:text-[#1d49ae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-route focus-visible:ring-offset-2 rounded-[6px] px-1 py-1">
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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

              <Button type="submit" variant="primary" disabled={submitting} loading={submitting} className="w-full">
                {submitting ? 'Resetting...' : 'Reset password'}
              </Button>

              <div className="pt-1 text-center">
                <Link to="/login" className="text-sm font-medium text-route hover:text-[#1d49ae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-route focus-visible:ring-offset-2 rounded-[6px] px-1 py-1">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
