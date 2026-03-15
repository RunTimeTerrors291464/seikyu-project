"use client";

import { useAuthStore } from "@/store/auth.store";
import { useEffect } from "react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    console.log("DASHBOARD → user state", user);
  }, [user]);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-semibold">
        Dashboard
      </h1>

      <p className="mt-4">
        Welcome {user?.username}
      </p>
    </div>
  );
}