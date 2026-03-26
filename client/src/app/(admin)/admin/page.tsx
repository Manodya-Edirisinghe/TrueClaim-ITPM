"use client";

import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-4 text-lg text-gray-500">
          Welcome to the TrueClaim admin panel. Full dashboard features will be implemented soon.
        </p>
        <p className="mt-2 text-sm text-gray-400">If you see this page, login was successful ✓</p>
        <button
          onClick={handleLogout}
          className="mt-8 rounded-lg bg-gray-900 px-6 py-2 text-white transition-colors hover:bg-gray-800"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
