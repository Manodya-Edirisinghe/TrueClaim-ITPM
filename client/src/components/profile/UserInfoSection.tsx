'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  User2, IdCard, Mail, Phone, GraduationCap, CalendarDays,
  ShieldCheck, Pencil, X, LogOut, Save,
} from 'lucide-react';
import api from '@/lib/axios';

type User = {
  fullName: string;
  studentId: string;
  universityEmail: string;
  phoneNumber?: string;
  faculty: string;
  academicYear: string;
  role: string;
};

const FACULTIES = [
  'Faculty of IT',
  'Faculty of Engineering',
  'Faculty of Business',
  'Faculty of Science',
  'Faculty of Arts',
  'Faculty of Medicine',
  'Faculty of Law',
];

const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-500 focus:bg-white/8';
const selectCls =
  'w-full rounded-xl border border-white/10 bg-[#0c1424] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500';

export default function UserInfoSection() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone]       = useState('');
  const [faculty, setFaculty]   = useState('');
  const [acadYear, setAcadYear] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ user: User }>('/auth/me');
        const u = data?.user ?? null;
        setUser(u);
        if (u) {
          setPhone(u.phoneNumber ?? '');
          setFaculty(u.faculty);
          setAcadYear(u.academicYear);
        }
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('trueclaim_user_id');
      localStorage.removeItem('trueclaim_plain_password');
    }
    toast.success('Signed out successfully.');
    router.push('/login');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      setSaving(true);
      const body: Record<string, string> = { phoneNumber: phone, faculty, academicYear: acadYear };
      if (password) body.password = password;
      const { data } = await api.put<{ user: User }>('/auth/me', body);
      setUser(data.user);
      setPhone(data.user.phoneNumber ?? '');
      setFaculty(data.user.faculty);
      setAcadYear(data.user.academicYear);
      setPassword('');
      setEditing(false);
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-4">
          <div className="size-16 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </section>
    );
  }

  const fields: { icon: React.ReactNode; label: string; value: string | undefined }[] = [
    { icon: <IdCard className="size-4" />,         label: 'Student ID',   value: user?.studentId },
    { icon: <Mail className="size-4" />,           label: 'Email',        value: user?.universityEmail },
    { icon: <Phone className="size-4" />,          label: 'Phone',        value: user?.phoneNumber || '—' },
    { icon: <GraduationCap className="size-4" />,  label: 'Faculty',      value: user?.faculty },
    { icon: <CalendarDays className="size-4" />,   label: 'Academic Year',value: user?.academicYear },
    { icon: <ShieldCheck className="size-4" />,    label: 'Role',         value: user?.role },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/30">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#53a2ff] text-xl font-bold text-white shadow-lg shadow-blue-900/40">
            {user?.fullName ? getInitials(user.fullName) : <User2 className="size-7" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.fullName ?? 'User'}</h2>
            <span className="mt-0.5 inline-block rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 capitalize">
              {user?.role ?? 'user'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            editing
              ? 'border-white/20 bg-white/10 text-white'
              : 'border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
          }`}
        >
          {editing ? <><X className="size-3.5" /> Cancel</> : <><Pencil className="size-3.5" /> Edit</>}
        </button>
      </div>

      {/* Info fields */}
      <div className="mt-6 space-y-2">
        {fields.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
          >
            <span className="text-white/40">{icon}</span>
            <span className="w-28 shrink-0 text-xs text-white/45">{label}</span>
            <span className="truncate text-sm font-medium text-white">{value || 'N/A'}</span>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="mt-5 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Edit Details</p>

          <div>
            <label className="mb-1.5 block text-xs text-white/60">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
              placeholder="e.g. 0771234567"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/60">Faculty</label>
            <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className={selectCls}>
              {FACULTIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/60">Academic Year</label>
            <select value={acadYear} onChange={(e) => setAcadYear(e.target.value)} className={selectCls}>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/60">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="Leave empty to keep current"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0A66C2] to-[#1789FF] py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:opacity-90 disabled:opacity-60"
          >
            <Save className="size-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Sign out */}
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </section>
  );
}
