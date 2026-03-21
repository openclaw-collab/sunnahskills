import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, UserPlus, UserX } from "lucide-react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminShell, type AdminPermissions, type AdminUser, hasAdminAccess } from "@/components/admin/AdminShell";

type AdminMeResponse = { ok: true; user: AdminUser } | { ok: false };
type AdminRole = "tech" | "admin";
type AdminStatus = "active" | "disabled";
type PermissionLevel = "none" | "read" | "write";

type ManagedUser = {
  id: number;
  email: string;
  name: string | null;
  role: AdminRole;
  status: AdminStatus;
  permissions: AdminPermissions;
  lastLogin: string | null;
  createdAt: string | null;
};

type ActivityItem = {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string | null;
  details: Record<string, unknown>;
  actor: {
    name: string | null;
    email: string | null;
  };
  subject: {
    name: string | null;
    email: string | null;
  };
};

type UserFormState = {
  id?: number;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  password: string;
  permissions: AdminPermissions;
};

const PERMISSION_LABELS: Array<{ key: keyof AdminPermissions; label: string; description: string }> = [
  { key: "dashboard", label: "Dashboard", description: "Overview metrics and daily snapshot" },
  { key: "registrations", label: "Registrations", description: "Family records and registration detail" },
  { key: "payments", label: "Payments", description: "Payment ledger and status review" },
  { key: "discounts", label: "Discounts", description: "Promo code creation and edits" },
  { key: "pricing", label: "Pricing", description: "Program prices and Stripe ids" },
  { key: "sessions", label: "Sessions", description: "Visibility, status, and capacity control" },
  { key: "contacts", label: "Contacts", description: "Parent enquiries and inbox review" },
  { key: "sequences", label: "Sequences", description: "Technique builder and publishing" },
  { key: "exports", label: "Exports", description: "CSV exports and reporting" },
  { key: "users", label: "Users", description: "Staff accounts, roles, and audit activity" },
];

function getDefaultPermissions(role: AdminRole): AdminPermissions {
  if (role === "tech") {
    return {
      dashboard: "write",
      registrations: "write",
      payments: "write",
      discounts: "write",
      pricing: "write",
      sessions: "write",
      contacts: "write",
      sequences: "write",
      exports: "write",
      users: "write",
    };
  }

  return {
    dashboard: "read",
    registrations: "write",
    payments: "write",
    discounts: "write",
    pricing: "write",
    sessions: "write",
    contacts: "read",
    sequences: "write",
    exports: "read",
    users: "none",
  };
}

function createEmptyForm(): UserFormState {
  return {
    email: "",
    name: "",
    role: "admin",
    status: "active",
    password: "",
    permissions: getDefaultPermissions("admin"),
  };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAction(action: string) {
  return action.replace(/\./g, " ");
}

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [me, setMe] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(createEmptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setRefreshing(true);
    try {
      const [usersRes, activityRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/activity")]);
      const usersJson = (await usersRes.json().catch(() => null)) as { users?: ManagedUser[]; error?: string } | null;
      const activityJson = (await activityRes.json().catch(() => null)) as { activity?: ActivityItem[]; error?: string } | null;
      const nextUsers = usersJson?.users ?? [];

      if (usersRes.ok) {
        setUsers(nextUsers);
        setSelectedUserId((current) => {
          if (current && !nextUsers.some((user) => user.id === current)) {
            setForm(createEmptyForm());
            return null;
          }
          return current;
        });
      } else {
        setFeedback(usersJson?.error ?? "Could not load users.");
      }

      if (activityRes.ok) {
        setActivity(activityJson?.activity ?? []);
      }

      return nextUsers;
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const json = (await res.json().catch(() => null)) as AdminMeResponse | null;
        if (!res.ok || !json || json.ok === false) {
          setLocation("/admin");
          return;
        }
        if (cancelled) return;
        setMe(json.user);
        if (!hasAdminAccess(json.user, "users", "read")) {
          setLocation("/admin/dashboard");
          return;
        }
        await loadUsers();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadUsers, setLocation]);

  const filteredUsers = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.name ?? "", user.email, user.role, user.status].join(" ").toLowerCase().includes(needle),
    );
  }, [searchQuery, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const totals = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.status === "active").length;
    const disabled = users.filter((user) => user.status === "disabled").length;
    const tech = users.filter((user) => user.role === "tech").length;
    return { total, active, disabled, tech };
  }, [users]);

  function loadUserIntoForm(user: ManagedUser) {
    setSelectedUserId(user.id);
    setFeedback(null);
        setForm({
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          role: user.role,
          status: user.status,
          password: "",
          permissions: { ...user.permissions },
        });
  }

  function startNewUser() {
    setSelectedUserId(null);
    setFeedback(null);
    setForm(createEmptyForm());
  }

  async function saveUser(overrideStatus?: AdminStatus) {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role,
        status: overrideStatus ?? form.status,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
        permissions: form.permissions,
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => null)) as { error?: string; id?: number } | null;
      if (!response.ok) {
        throw new Error(json?.error ?? "Could not save user");
      }

      const nextUsers = await loadUsers();
      if (!form.id && json?.id) {
        const created = nextUsers.find((user) => user.id === json.id);
        if (created) loadUserIntoForm(created);
      }
      setForm((current) => ({ ...current, status: overrideStatus ?? current.status, password: "" }));
      setFeedback(form.id ? "User updated." : "User created.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not save user");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!form.id) return;
    setDeleting(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(String(form.id))}`, {
        method: "DELETE",
      });
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(json?.error ?? "Could not delete user");
      }
      startNewUser();
      await loadUsers();
      setFeedback("User deleted.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not delete user");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !me) {
    return (
      <div className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-7xl px-6 pt-28">
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="text-sm text-charcoal/70">Loading user management…</div>
          </PremiumCard>
        </main>
      </div>
    );
  }

  return (
    <AdminShell
      title="User Management"
      eyebrow="Admin"
      currentSection="users"
      user={me}
      summary="Manage tech and admin accounts, see role and last-login information, review audit activity, and adjust permissions without leaving the dashboard workflow."
      actions={
        <OutlineButton
          className="px-5 py-3 text-[11px] uppercase tracking-[0.18em]"
          onClick={() => loadUsers()}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh users"}
        </OutlineButton>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PremiumCard className="bg-white border border-charcoal/10 p-5">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Total staff</div>
          <div className="mt-2 text-3xl font-heading text-charcoal">{totals.total}</div>
        </PremiumCard>
        <PremiumCard className="bg-white border border-charcoal/10 p-5">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Active</div>
          <div className="mt-2 text-3xl font-heading text-charcoal">{totals.active}</div>
        </PremiumCard>
        <PremiumCard className="bg-white border border-charcoal/10 p-5">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Disabled</div>
          <div className="mt-2 text-3xl font-heading text-charcoal">{totals.disabled}</div>
        </PremiumCard>
        <PremiumCard className="bg-white border border-charcoal/10 p-5">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Tech roles</div>
          <div className="mt-2 text-3xl font-heading text-charcoal">{totals.tech}</div>
        </PremiumCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PremiumCard className="bg-white border border-charcoal/10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Roster</div>
              <h3 className="mt-2 font-heading text-2xl text-charcoal">Staff accounts</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <OutlineButton
                className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                onClick={startNewUser}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus size={14} />
                  New user
                </span>
              </OutlineButton>
            </div>
          </div>

          <div className="mt-5">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, role, or status…"
              className="bg-cream/50 border-charcoal/10"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-charcoal/15 bg-cream/45 p-5 text-sm text-charcoal/60">
                No staff users match that search.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => loadUserIntoForm(user)}
                  className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition-colors ${
                    selectedUserId === user.id
                      ? "border-moss/25 bg-moss/10"
                      : "border-charcoal/10 bg-cream/40 hover:border-moss/20 hover:bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-charcoal">{user.name ?? user.email}</div>
                      <div className="mt-1 truncate text-[11px] text-charcoal/60">{user.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-charcoal/10 bg-white/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-charcoal/60">
                        {user.role}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${
                          user.status === "active"
                            ? "border-moss/20 bg-moss/10 text-moss"
                            : "border-clay/20 bg-clay/10 text-clay"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 text-xs text-charcoal/55 md:grid-cols-2">
                    <div>Last login: {formatDateTime(user.lastLogin)}</div>
                    <div>Created: {formatDateTime(user.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </PremiumCard>

        <PremiumCard className="bg-white border border-charcoal/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Editor</div>
              <h3 className="mt-2 font-heading text-2xl text-charcoal">
                {form.id ? "Edit staff account" : "Create staff account"}
              </h3>
            </div>
            {selectedUser ? (
              <div className="rounded-[1.4rem] border border-charcoal/10 bg-cream/55 px-4 py-3 text-sm text-charcoal/70">
                Last login: <span className="text-charcoal">{formatDateTime(selectedUser.lastLogin)}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Name</div>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Staff name"
                className="bg-cream/50 border-charcoal/10"
              />
            </div>
            <div className="space-y-2">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Email</div>
              <Input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@sunnahskills.com"
                type="email"
                className="bg-cream/50 border-charcoal/10"
              />
            </div>
            <div className="space-y-2">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Role</div>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    role: value as AdminRole,
                    permissions: getDefaultPermissions(value as AdminRole),
                  }))
                }
              >
                <SelectTrigger className="bg-cream/50 border-charcoal/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">tech</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Status</div>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((current) => ({ ...current, status: value as AdminStatus }))}
              >
                <SelectTrigger className="bg-cream/50 border-charcoal/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="disabled">disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                Password {form.id ? "(leave blank to keep current)" : ""}
              </div>
              <Input
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={form.id ? "Optional new password" : "Minimum 8 characters"}
                type="password"
                className="bg-cream/50 border-charcoal/10"
              />
            </div>
          </div>

          <div className="mt-6 rounded-[1.8rem] border border-charcoal/10 bg-cream/40 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-moss/10 text-moss">
                <ShieldCheck size={16} />
              </span>
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Permissions</div>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                  Set read or write access per tool. Tech users always receive full write access everywhere.
                </p>
              </div>
            </div>

            {form.role === "tech" ? (
              <div className="mt-4 rounded-[1.4rem] border border-moss/20 bg-moss/10 p-4 text-sm text-charcoal/75">
                This account is a tech role, so all permissions are automatically set to full write access.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {PERMISSION_LABELS.map((permission) => (
                  <div key={permission.key} className="rounded-[1.4rem] border border-charcoal/10 bg-white/80 p-4">
                    <div className="text-sm text-charcoal">{permission.label}</div>
                    <div className="mt-1 text-xs leading-relaxed text-charcoal/55">{permission.description}</div>
                    <Select
                      value={form.permissions[permission.key]}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          permissions: {
                            ...current.permissions,
                            [permission.key]: value as PermissionLevel,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="mt-3 bg-cream/50 border-charcoal/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">none</SelectItem>
                        <SelectItem value="read">read</SelectItem>
                        <SelectItem value="write">write</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {feedback ? <div className="mt-4 text-sm text-moss">{feedback}</div> : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <ClayButton
              className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
              onClick={() => saveUser()}
              disabled={saving}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Create user"}
            </ClayButton>

            {form.id ? (
              <OutlineButton
                className="px-5 py-3 text-[11px] uppercase tracking-[0.18em]"
                onClick={() => saveUser(form.status === "active" ? "disabled" : "active")}
                disabled={saving}
              >
                {form.status === "active" ? "Disable user" : "Enable user"}
              </OutlineButton>
            ) : null}

            {form.id ? (
              <OutlineButton
                className="px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-clay hover:text-clay"
                onClick={deleteUser}
                disabled={deleting}
              >
                <span className="inline-flex items-center gap-2">
                  <UserX size={14} />
                  {deleting ? "Deleting…" : "Delete user"}
                </span>
              </OutlineButton>
            ) : null}

            <OutlineButton
              className="px-5 py-3 text-[11px] uppercase tracking-[0.18em]"
              onClick={startNewUser}
            >
              Reset form
            </OutlineButton>
          </div>
        </PremiumCard>
      </div>

      <div className="mt-6">
        <PremiumCard className="bg-white border border-charcoal/10">
          <div>
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Audit Activity</div>
            <h3 className="mt-2 font-heading text-2xl text-charcoal">Recent staff actions</h3>
          </div>

          <div className="mt-5 space-y-3">
            {activity.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-charcoal/15 bg-cream/45 p-5 text-sm text-charcoal/60">
                No activity has been recorded yet.
              </div>
            ) : (
              activity.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-[1.6rem] border border-charcoal/10 bg-cream/40 px-4 py-4 lg:grid-cols-[1fr_1fr_auto]"
                >
                  <div>
                    <div className="text-sm text-charcoal">{formatAction(item.action)}</div>
                    <div className="mt-1 text-xs text-charcoal/55">
                      {item.actor.name ?? item.actor.email ?? "Unknown"} acted on{" "}
                      {item.subject.name ?? item.subject.email ?? item.entityType}
                    </div>
                  </div>
                  <div className="text-xs leading-relaxed text-charcoal/55">
                    {Object.keys(item.details ?? {}).length > 0 ? JSON.stringify(item.details) : "No extra details"}
                  </div>
                  <div className="text-xs text-charcoal/55">{formatDateTime(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </PremiumCard>
      </div>
    </AdminShell>
  );
}
