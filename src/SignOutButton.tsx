"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { api } from "../convex/_generated/api";

/**
 * PROTECTED TEMPLATE COMPONENT
 *
 * Account dropdown for signed-in users. Renders an avatar/email button that
 * opens a menu with: identity, admin badge (when applicable), inline
 * change-password form, and sign-out.
 *
 * Despite the name, this component covers the full authenticated-user UI —
 * place it once in your app header and the user automatically gets account
 * management without needing a separate Settings page. Returns null when no
 * user is signed in.
 */
export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "password">("menu");
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the (portaled) menu just under the trigger, right-aligned to it.
  const positionMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  };

  useEffect(() => {
    if (!open) return;
    positionMenu();
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
        setView("menu");
      }
    };
    const onReposition = () => positionMenu();
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  if (!isAuthenticated) {
    return null;
  }

  const email = user?.email ?? "Account";
  const initials = email.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setView("menu");
        }}
        className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold">
          {initials}
        </span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[10rem] truncate">
          {email}
        </span>
        {user?.isAdmin && (
          <span className="hidden sm:inline px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            Admin
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gray-400"
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>

      {open && menuPos &&
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
          className="w-72 rounded-xl bg-white shadow-xl border border-gray-200 z-[1000] overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Signed in as
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">
                {email}
              </span>
              {user?.isAdmin && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  Admin
                </span>
              )}
            </div>
          </div>

          {view === "menu" ? (
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => setView("password")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Change password
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <ChangePasswordPanel onDone={() => setView("menu")} />
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function ChangePasswordPanel({ onDone }: { onDone: () => void }) {
  const changePassword = useAction(api.auth.changePassword);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ newPassword });
      toast.success("Password changed.");
      setNewPassword("");
      setConfirmPassword("");
      onDone();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not change password.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-900">Change password</h4>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={submitting || !newPassword || !confirmPassword}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {submitting ? "Changing…" : "Save new password"}
        </button>
      </form>
      <button
        type="button"
        onClick={onDone}
        className="mt-3 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back
      </button>
    </div>
  );
}
