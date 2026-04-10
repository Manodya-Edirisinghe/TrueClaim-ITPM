'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

type AuthMeResponse = {
  user?: {
    fullName?: string;
  };
};

export default function UserInfoSection() {
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
    </section>
  );
}
