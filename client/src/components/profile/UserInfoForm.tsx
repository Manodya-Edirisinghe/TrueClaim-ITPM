'use client';

import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';

type AuthMeResponse = {
  user?: {
    _id: string;
    fullName?: string;
    universityEmail?: string;
    email?: string;
  };
};

export default function UserInfoForm() {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await api.get<AuthMeResponse>('/auth/me');
        const name = data?.user?.fullName ?? '';
        const userEmail = data?.user?.universityEmail ?? data?.user?.email ?? '';

        setDisplayName(name);
        setEmail(userEmail);
        setNewName(name);
      } catch {
        toast.error('Failed to load user profile. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = newName.trim();
    const trimmedPassword = newPassword.trim();

    if (!trimmedName) {
      toast.error('Name cannot be empty.');
      return;
    }

    if (trimmedPassword && trimmedPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);

      // Existing backend currently does not expose a profile update endpoint.
      // Keep UI editable without introducing backend changes.
      setDisplayName(trimmedName);
      setNewPassword('');

      toast.success('Profile form updated. Backend profile update endpoint is not available yet.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/60">
        Loading profile...
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20">
      <h2 className="text-xl font-semibold text-white">My Info</h2>
      <p className="mt-1 text-sm text-white/60">Manage your profile details.</p>

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">Current Name</p>
          <p className="mt-1 text-sm font-medium text-white">{displayName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">Email</p>
          <p className="mt-1 text-sm font-medium text-white">{email || 'N/A'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">Update Name</label>
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">Update Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
            placeholder="Leave empty to keep current password"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0A66C2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0958a8] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </section>
  );
}
