"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-fg-subtle hover:text-danger"
    >
      Sign out
    </button>
  );
}
