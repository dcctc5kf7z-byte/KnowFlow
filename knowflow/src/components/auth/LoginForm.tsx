'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signIn, signUp } from '@/lib/auth/auth';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (authError) {
        setError(authError.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
      </Button>
      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full text-sm text-blue-600 hover:underline"
      >
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </button>
    </form>
  );
}
