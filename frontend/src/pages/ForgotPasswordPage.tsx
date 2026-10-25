import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { forgotPassword } from '../api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await forgotPassword(trimmedEmail);
      setSuccess('If an account exists for this email, password reset instructions have been sent.');
      setEmail('');
    } catch {
      setError('Unable to process password reset request. Please try again.');
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
            <h1 className="mt-2 text-2xl font-semibold text-ink">Forgot password</h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@tekflow.com"
            />

            {error ? <Alert variant="error">{error}</Alert> : null}
            {success ? <Alert variant="success">{success}</Alert> : null}

            <Button type="submit" variant="primary" disabled={submitting} loading={submitting} className="w-full">
              {submitting ? 'Sending...' : 'Send reset link'}
            </Button>

            <div className="pt-1 text-center">
              <Link to="/login" className="text-sm font-medium text-route hover:text-[#1d49ae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-route focus-visible:ring-offset-2 rounded-[6px] px-1 py-1">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
