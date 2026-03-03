'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if already authenticated
    if (authService.isAuthenticated()) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!login.trim() || !password.trim()) {
        setError('Login va parol talab qilinadi');
        setLoading(false);
        return;
      }

      await authService.login({ login, password });
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Kirishda xatolik. Iltimos, ma\'lumotlarni tekshiring.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Kirish</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Loginni kiriting"
            error={error}
            required
          />
          <Input
            type="password"
            label="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolni kiriting"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </Button>
        </form>
      </div>
    </div>
  );
}
