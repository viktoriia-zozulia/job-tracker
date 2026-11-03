"use client";

import { logOut } from "@/lib/actions/auth";

export function LogoutButton() {
  async function handleLogOut() {
    await logOut();
    // A full page load is deliberate. Next.js keeps visited routes hidden in the
    // page, so a client-side redirect would leave this user's data behind for the
    // Back button to restore.
    window.location.replace("/login");
  }

  return (
    <form action={handleLogOut}>
      <button type="submit" className="text-sm font-medium underline">
        Log out
      </button>
    </form>
  );
}
