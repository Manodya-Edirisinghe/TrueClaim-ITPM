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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-12 rounded-2xl border border-gray-200 shadow-lg bg-white max-w-lg w-full">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-4 text-gray-500 text-lg">
          Welcome to the TrueClaim admin panel. Full dashboard features will be implemented soon.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          If you see this page, login was successful ✓
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 px-6 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
