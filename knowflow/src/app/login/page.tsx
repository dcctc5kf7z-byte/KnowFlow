'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">KnowFlow</h1>
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Sign in to sync your knowledge
          </h2>
          <LoginForm onSuccess={() => router.push('/')} />
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">
            Continue without account
          </button>
        </p>
      </div>
    </div>
  );
}
