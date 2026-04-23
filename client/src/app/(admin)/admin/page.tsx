'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Users, Package,
  LogOut, TrendingUp, TrendingDown, CheckCircle2,
  Star, MapPin, Tag, Calendar, ShieldCheck, Sparkles,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

type Stats = {
  totalItems: number; lostItems: number; foundItems: number;
  claimedItems: number; totalUsers: number; totalFeedbacks: number;
};
type TimePoint   = { _id: string; count: number };
type CategoryPoint = { _id: string; count: number };
type FeedbackAvg = { easeOfReporting: number; speedOfResponse: number; platformNavigation: number; staffHelpfulness: number; overallSatisfaction: number };
type DashData    = { stats: Stats; itemsOverTime: TimePoint[]; itemsByCategory: CategoryPoint[]; feedbackAvg: FeedbackAvg | null };

type User = { _id: string; fullName: string; universityEmail: string; role: string; faculty: string; academicYear: string; createdAt: string };
type FeedbackItem = { _id: string; caseNumber: string; interactionType: string; outcome: string; overallSatisfaction: number; improvementSuggestions: string; wouldRecommend: string; createdAt: string };
type Item = { _id: string; itemTitle: string; itemCategory: string; itemType: 'lost' | 'found'; location: string; claimStatus: string; imageUrl?: string; createdAt: string };

type Section = 'overview' | 'feedbacks' | 'users' | 'items';

const API = 'http://localhost:5000/api/admin';
const PIE_COLORS = ['#0A66C2', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function Badge({ type }: { type: string }) {
  const map: Record<string, string> = {
    lost:               'bg-red-100 text-red-600',
    found:              'bg-green-100 text-green-700',
    open:               'bg-blue-100 text-blue-600',
    under_verification: 'bg-amber-100 text-amber-600',
    claim_verified:     'bg-purple-100 text-purple-600',
    claimed:            'bg-green-100 text-green-700',
    admin:              'bg-violet-100 text-violet-700',
    user:               'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`size-3.5 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('overview');
  const [dash, setDash]       = useState<DashData | null>(null);
  const [users, setUsers]     = useState<User[]>([]);
  const [feedbacks, setFeeds] = useState<FeedbackItem[]>([]);
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, u, f, i] = await Promise.all([
          fetch(`${API}/dashboard`).then((r) => r.json()),
          fetch(`${API}/users`).then((r) => r.json()),
          fetch(`${API}/feedback`).then((r) => r.json()),
          fetch(`${API}/items`).then((r) => r.json()),
        ]);
        setDash(d);
        setUsers(u.users ?? []);
        setFeeds(f.feedbacks ?? []);
        setItems(i.items ?? []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('trueclaim_user_id');
    router.push('/login');
  };

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',  icon: <LayoutDashboard className="size-4" /> },
    { id: 'feedbacks', label: 'Feedbacks', icon: <MessageSquare className="size-4" /> },
    { id: 'users',     label: 'Users',     icon: <Users className="size-4" /> },
    { id: 'items',     label: 'Items',     icon: <Package className="size-4" /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="flex w-60 shrink-0 flex-col bg-[#050e1d] shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0A66C2] to-[#53a2ff] shadow-lg">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">TrueClaim</p>
            <p className="text-[10px] text-white/40">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">Menu</p>
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                section === id
                  ? 'bg-[#0A66C2] text-white shadow-lg shadow-blue-900/40'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 py-4 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-semibold capitalize text-slate-800">{section}</h1>
            <p className="text-xs text-slate-400">TrueClaim · Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="group inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 shadow-sm transition-all hover:border-red-300 hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-200"
          >
            <LogOut className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Log Out
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">Loading data...</div>
          ) : (

            <>
              {/* ─── OVERVIEW ───────────────────────────────────────────── */}
              {section === 'overview' && dash && (
                <div className="space-y-6">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    <StatCard icon={<Package className="size-5 text-blue-600" />}      label="Total Items"     value={dash.stats.totalItems}     color="bg-blue-50" />
                    <StatCard icon={<TrendingDown className="size-5 text-red-500" />}  label="Lost Items"      value={dash.stats.lostItems}      color="bg-red-50" />
                    <StatCard icon={<TrendingUp className="size-5 text-green-600" />}  label="Found Items"     value={dash.stats.foundItems}     color="bg-green-50" />
                    <StatCard icon={<CheckCircle2 className="size-5 text-purple-600" />} label="Claimed Items" value={dash.stats.claimedItems}   color="bg-purple-50" />
                    <StatCard icon={<Users className="size-5 text-amber-600" />}       label="Total Users"     value={dash.stats.totalUsers}     color="bg-amber-50" />
                    <StatCard icon={<MessageSquare className="size-5 text-cyan-600" />} label="Feedbacks"      value={dash.stats.totalFeedbacks} color="bg-cyan-50" />
                  </div>

                  {/* Charts row 1 */}
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {/* Line chart - items over time */}
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                      <p className="mb-4 text-sm font-semibold text-slate-700">Items Reported (Last 7 Days)</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={dash.itemsOverTime}>
                          <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                          <Line type="monotone" dataKey="count" stroke="#0A66C2" strokeWidth={2.5} dot={{ fill: '#0A66C2', r: 4 }} name="Items" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar chart - items by category */}
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                      <p className="mb-4 text-sm font-semibold text-slate-700">Items by Category</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={dash.itemsByCategory}>
                          <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="count" name="Items" radius={[6, 6, 0, 0]}>
                            {dash.itemsByCategory.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Charts row 2 */}
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {/* Pie chart - lost vs found */}
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                      <p className="mb-4 text-sm font-semibold text-slate-700">Lost vs Found</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Lost',  value: dash.stats.lostItems },
                              { name: 'Found', value: dash.stats.foundItems },
                            ]}
                            cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                            paddingAngle={4} dataKey="value"
                          >
                            <Cell fill="#ef4444" />
                            <Cell fill="#22c55e" />
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} />
                          <Legend iconType="circle" iconSize={8} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Feedback ratings */}
                    {dash.feedbackAvg && (
                      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                        <p className="mb-4 text-sm font-semibold text-slate-700">Avg. Feedback Ratings</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart layout="vertical" data={[
                            { label: 'Ease of Reporting',    val: +dash.feedbackAvg.easeOfReporting.toFixed(1) },
                            { label: 'Speed of Response',    val: +dash.feedbackAvg.speedOfResponse.toFixed(1) },
                            { label: 'Navigation',           val: +dash.feedbackAvg.platformNavigation.toFixed(1) },
                            { label: 'Staff Helpfulness',    val: +dash.feedbackAvg.staffHelpfulness.toFixed(1) },
                            { label: 'Overall Satisfaction', val: +dash.feedbackAvg.overallSatisfaction.toFixed(1) },
                          ]}>
                            <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} />
                            <Bar dataKey="val" name="Rating" fill="#0A66C2" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── FEEDBACKS ──────────────────────────────────────────── */}
              {section === 'feedbacks' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">{feedbacks.length} submissions total</p>
                  {feedbacks.length === 0 ? (
                    <p className="text-center text-slate-400 py-16">No feedback yet.</p>
                  ) : (
                    feedbacks.map((f) => (
                      <div key={f._id} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-400">Case #{f.caseNumber || '—'}</span>
                              <Badge type={f.interactionType || 'unknown'} />
                              <Badge type={f.outcome || 'unknown'} />
                            </div>
                            <p className="mt-2 text-sm text-slate-700">{f.improvementSuggestions || '—'}</p>
                            {f.wouldRecommend && (
                              <p className="mt-1 text-xs text-slate-400">Would recommend: <span className="font-medium text-slate-600 capitalize">{f.wouldRecommend.replace(/-/g, ' ')}</span></p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <Stars value={f.overallSatisfaction} />
                            <p className="mt-1 text-[11px] text-slate-400">{fmt(f.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ─── USERS ──────────────────────────────────────────────── */}
              {section === 'users' && (
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">{users.length} registered users</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Faculty</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Year</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <tr key={u._id} className={`border-b border-slate-100 transition hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0A66C2] to-[#53a2ff] text-xs font-bold text-white">
                                  {u.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                </div>
                                <span className="font-medium text-slate-700">{u.fullName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500">{u.universityEmail}</td>
                            <td className="px-6 py-3.5 text-slate-500">{u.faculty}</td>
                            <td className="px-6 py-3.5 text-slate-500">{u.academicYear}</td>
                            <td className="px-6 py-3.5"><Badge type={u.role} /></td>
                            <td className="px-6 py-3.5 text-slate-400">{fmt(u.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── ITEMS ──────────────────────────────────────────────── */}
              {section === 'items' && (
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">{items.length} items reported</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={item._id} className={`border-b border-slate-100 transition hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.itemTitle} className="size-9 rounded-lg object-cover" />
                                ) : (
                                  <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100">
                                    <Package className="size-4 text-slate-400" />
                                  </div>
                                )}
                                <span className="font-medium text-slate-700 max-w-[160px] truncate">{item.itemTitle}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5"><Badge type={item.itemType} /></td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Tag className="size-3" />{item.itemCategory}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <MapPin className="size-3" />{item.location}
                              </span>
                            </td>
                            <td className="px-6 py-3.5"><Badge type={item.claimStatus} /></td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Calendar className="size-3" />{fmt(item.createdAt)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
