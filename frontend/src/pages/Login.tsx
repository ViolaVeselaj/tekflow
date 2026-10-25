import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { useAuth } from '../auth/AuthContext';
import { getDefaultRoleRoute } from '../auth/ProtectedRoute';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);

    try {
      const currentUser = await login({ email: trimmedEmail, password: trimmedPassword });
      navigate(getDefaultRoleRoute(currentUser.role));
    } catch (loginError: unknown) {
      const message =
        typeof loginError === 'object' && loginError && 'response' in loginError
          ? (loginError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      setError(message || 'Invalid email or password.');
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
            <h1 className="mt-2 text-2xl font-semibold text-ink">Sign in to continue</h1>
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

            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button type="submit" variant="primary" disabled={submitting} loading={submitting} className="w-full">
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-medium text-route hover:text-[#1d49ae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-route focus-visible:ring-offset-2 rounded-[6px] px-1 py-1"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
