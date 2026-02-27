// /admin page
// Owner: Osanda | Admin Dashboard & User Management

export default function AdminPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 rounded-xl border border-slate-200 shadow-md">
        <h1 className="text-3xl font-bold text-primary">🛡️ Admin Module</h1>
        <p className="mt-2 text-slate-500">
          Owner: <strong>Osanda</strong>
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Dashboard, User Management &amp; Dispute Resolution
        </p>
      </div>
    </div>
  );
}
