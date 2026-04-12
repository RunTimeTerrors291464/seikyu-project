"use client";

import { useAuthStore } from "@/stores/auth.store";

/**
 * Admin dashboard home: greeting for the signed-in user.
 */
export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <p className="mt-4">Welcome {user?.username}</p>
    </div>
  );
}
