"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AdminNav } from "@/components/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";
import type {
  AdminUser,
  AdminUserPlan,
  AdminUserRole,
  AdminUserStatus,
} from "@/lib/admin-users";

type UsersPayload = {
  ok: boolean;
  users?: AdminUser[];
  user?: AdminUser;
  error?: string;
};

const planOptions: Array<{ label: string; value: AdminUserPlan }> = [
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
];

const statusOptions: Array<{ label: string; value: AdminUserStatus }> = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "disabled" },
];

const roleOptions: Array<{ label: string; value: AdminUserRole }> = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setMessage("");
    setAccessDenied(false);

    try {
      const response = await fetch("/api/admin/users", {
        headers: await getAuthHeaders(),
        signal,
      });
      const payload = (await response.json()) as UsersPayload;

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        setUsers([]);
        setMessage(payload.error ?? "Access denied.");
        return;
      }

      if (!response.ok || !payload.ok || !payload.users) {
        throw new Error(payload.error ?? "Users could not be loaded.");
      }

      setUsers(payload.users);
      setMessage("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessage(error instanceof Error ? error.message : "Users could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const frameId = window.requestAnimationFrame(() => {
      void loadUsers(controller.signal);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      controller.abort();
    };
  }, [loadUsers]);

  async function updateUser(
    userId: string,
    update: Partial<Pick<AdminUser, "plan" | "role" | "status">>,
  ) {
    setSavingUserId(userId);
    setMessage("Saving user...");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ userId, ...update }),
      });
      const payload = (await response.json()) as UsersPayload;

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        setMessage(payload.error ?? "Access denied.");
        return;
      }

      if (!response.ok || !payload.ok || !payload.user) {
        throw new Error(payload.error ?? "User could not be updated.");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === payload.user?.id ? payload.user : user)),
      );
      setMessage("User updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User could not be updated.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Review" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Admin
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Users
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              View registered players and manage access for early Kevixo accounts.
            </p>
          </div>
          <span className="w-fit rounded-full border border-slate-800 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-slate-400">
            Internal
          </span>
        </div>

        <AdminNav active="users" />

        <div className="mt-8 grid gap-5">
          {message ? (
            <div
              className={[
                "rounded-xl border p-4 text-sm leading-6",
                accessDenied
                  ? "border-rose-500/25 bg-rose-950/20 text-rose-100"
                  : "border-slate-800 bg-slate-950/48 text-slate-300",
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          ) : null}

          {accessDenied ? (
            <Card className="p-5 md:p-6">
              <CardTitle>Access Denied</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                This page is available only to Kevixo admin accounts.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-2 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div>
                  <CardTitle>Registered Users</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {isLoading ? "Loading users..." : `${users.length} users found`}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">User</th>
                      <th className="px-5 py-4 font-semibold">Joined</th>
                      <th className="px-5 py-4 font-semibold">Plan</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Role</th>
                      <th className="px-5 py-4 text-right font-semibold">Review Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        isSaving={savingUserId === user.id}
                        onUpdate={updateUser}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {!isLoading && users.length === 0 ? (
                <div className="p-6 text-sm leading-6 text-slate-400">No users found.</div>
              ) : null}
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

function UserRow({
  isSaving,
  onUpdate,
  user,
}: {
  isSaving: boolean;
  onUpdate: (
    userId: string,
    update: Partial<Pick<AdminUser, "plan" | "role" | "status">>,
  ) => void;
  user: AdminUser;
}) {
  return (
    <tr className="align-top text-sm text-slate-300">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div>
            <p className="font-semibold text-slate-100">{user.email || "No email"}</p>
            <p className="mt-1 text-xs text-slate-500">
              {user.displayName ? user.displayName : "No display name"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-slate-400">{formatDate(user.joinedAt)}</td>
      <td className="px-5 py-4">
        <SelectControl
          label="Plan"
          disabled={isSaving}
          value={user.plan}
          options={planOptions}
          onChange={(plan) => onUpdate(user.id, { plan })}
        />
      </td>
      <td className="px-5 py-4">
        <SelectControl
          label="Status"
          disabled={isSaving}
          value={user.status}
          options={statusOptions}
          onChange={(status) => onUpdate(user.id, { status })}
        />
      </td>
      <td className="px-5 py-4">
        <SelectControl
          label="Role"
          disabled={isSaving}
          value={user.role}
          options={roleOptions}
          onChange={(role) => onUpdate(user.id, { role })}
        />
      </td>
      <td className="px-5 py-4 text-right">
        <span className="inline-flex min-w-10 justify-center rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 font-semibold text-slate-100">
          {user.reviewCount}
        </span>
        {isSaving ? <p className="mt-2 text-xs text-primary">Saving...</p> : null}
      </td>
    </tr>
  );
}

function Avatar({ user }: { user: AdminUser }) {
  const label = user.displayName || user.email || "User";

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={`${label} avatar`}
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 rounded-xl border border-slate-800 object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm font-semibold text-primary">
      {label.trim().charAt(0).toUpperCase() || "U"}
    </div>
  );
}

function SelectControl<T extends string>({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-10 rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm font-medium text-slate-100 outline-none transition hover:border-slate-700 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}
