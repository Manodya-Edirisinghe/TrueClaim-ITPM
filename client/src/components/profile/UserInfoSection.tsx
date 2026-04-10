'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/axios';

type AuthMeResponse = {
  user?: {
    fullName?: string;
  };
};

export default function UserInfoSection() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get<AuthMeResponse>('/auth/me');
        setUsername(data?.user?.fullName ?? 'N/A');
      } catch {
        setUsername('N/A');
      } finally {
        const rememberedPassword =
          typeof window !== 'undefined' ? localStorage.getItem('trueclaim_plain_password') : null;
        setPassword(rememberedPassword ?? 'N/A');
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/60">
        Loading user info...
      </section>
    );
  }

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('trueclaim_user_id');
      localStorage.removeItem('trueclaim_plain_password');
    }

    toast.success('Signed out successfully.');
    router.push('/login');
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20">
      <h2 className="text-xl font-semibold text-white">Your Info</h2>
      <p className="mt-1 text-sm text-white/60">Current logged-in user details.</p>

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">Username</p>
          <p className="mt-1 break-all text-sm font-medium text-white">{username || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">Password</p>
          <p className="mt-1 break-all text-sm font-medium text-white">{password || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-red-400/40 bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-600/30"
        >
          Sign Out
        </button>
      </div>
    </section>
  );
}
