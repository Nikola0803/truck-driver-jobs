import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  phone?: string;
  is_admin: boolean;
  has_cdl: boolean;
  cdl_state?: string;
  experience?: string;
  driver_type?: string;
  preferred_route?: string;
  preferred_equipment?: string;
}

const token = () => localStorage.getItem("tdj_token") ?? "";
const authHeader = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "driver">("all");

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: authHeader() });
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRoleToggle = async (user: User) => {
    const newRole = !user.is_admin;
    await fetch(`/api/admin/users/${user.id}/role`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ is_admin: newRole }),
    });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_admin: newRole } : u));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) { setCreateError("Email and password required"); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, is_admin: newIsAdmin }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.message ?? "Failed"); return; }
      setShowCreate(false);
      setNewEmail(""); setNewPassword(""); setNewName(""); setNewIsAdmin(false);
      loadUsers();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE", headers: authHeader() });
    setDeleteTarget(null);
    setDeleting(false);
    loadUsers();
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search.trim() ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || (filterRole === "admin" ? u.is_admin : !u.is_admin);
    return matchSearch && matchRole;
  });

  const adminCount = users.filter((u) => u.is_admin).length;
  const driverCount = users.length - adminCount;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground-950">User Management</h1>
          <p className="mt-1 text-sm text-foreground-600">
            {users.length} registered users — {adminCount} admin{adminCount !== 1 ? "s" : ""}, {driverCount} driver{driverCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 whitespace-nowrap"
        >
          <i className="ri-user-add-line" /> Create User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
          className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400 sm:w-72"
        />
        <div className="flex gap-1.5">
          {(["all", "admin", "driver"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase transition-colors ${
                filterRole === r
                  ? "bg-primary-500 text-white"
                  : "border border-brand-border text-foreground-500 hover:border-primary-400 hover:text-primary-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-foreground-400">
            <i className="ri-user-search-line text-3xl mb-2" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border bg-background-50">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">User</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Role</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Profile</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Joined</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-brand-border/50 last:border-0 hover:bg-background-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-foreground-950">{user.full_name || <span className="italic text-foreground-400">No name</span>}</p>
                      <p className="text-xs text-foreground-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleRoleToggle(user)}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                          user.is_admin
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                        title={user.is_admin ? "Click to demote to Driver" : "Click to promote to Admin"}
                      >
                        {user.is_admin ? "Admin" : "Driver"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-xs text-foreground-600">
                      <div className="flex flex-wrap gap-1">
                        {user.has_cdl && <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">CDL</span>}
                        {user.cdl_state && <span className="rounded bg-background-100 px-1.5 py-0.5 text-[10px] font-semibold text-foreground-600">{user.cdl_state}</span>}
                        {user.preferred_route && <span className="rounded bg-background-100 px-1.5 py-0.5 text-[10px] font-semibold text-foreground-600">{user.preferred_route}</span>}
                        {user.preferred_equipment && <span className="rounded bg-background-100 px-1.5 py-0.5 text-[10px] font-semibold text-foreground-600">{user.preferred_equipment}</span>}
                        {user.experience && <span className="rounded bg-background-100 px-1.5 py-0.5 text-[10px] text-foreground-500">{user.experience}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:border-red-400"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground-950">Create User</h2>
              <button onClick={() => setShowCreate(false)} className="text-foreground-400 hover:text-foreground-700">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground-600">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground-600">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="driver@example.com"
                  required
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground-600">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-bg px-4 py-3">
                <input
                  type="checkbox"
                  id="newIsAdmin"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="h-4 w-4 accent-purple-600"
                />
                <label htmlFor="newIsAdmin" className="flex-1 cursor-pointer">
                  <p className="text-sm font-semibold text-foreground-950">Admin access</p>
                  <p className="text-xs text-foreground-500">Full admin panel access — use for team members only</p>
                </label>
              </div>
              {createError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{createError}</div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-primary-500 py-2.5 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-foreground-600 hover:border-foreground-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold text-foreground-950">Delete User?</h2>
            <p className="mb-5 text-sm text-foreground-600">
              This will permanently delete <strong>{deleteTarget.email}</strong> and all their data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-foreground-600 hover:border-foreground-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
