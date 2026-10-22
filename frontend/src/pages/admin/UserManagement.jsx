import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const EMPTY_LIBRARIAN = { full_name: "", email: "", branch_ids: [] };
const EMPTY_BRANCH = { code: "", name: "", address: "" };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

function Feedback({ feedback }) {
  if (!feedback) return null;

  return (
    <p
      role={feedback.ok ? "status" : "alert"}
      className={`rounded-lg px-4 py-3 text-sm ${feedback.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
    >
      {feedback.message}
    </p>
  );
}

function BranchPicker({ branches, selected, onChange }) {
  if (!branches.length) {
    return <p className="text-sm text-slate-500">No branches yet. Create a branch first.</p>;
  }

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((b) => b !== id) : [...selected, id]);

  return (
    <fieldset className="flex flex-wrap gap-3">
      <legend className="mb-1 text-sm font-medium text-slate-700">Branches</legend>
      {branches
        .filter((branch) => branch.is_active)
        .map((branch) => (
          <label key={branch.id} className="flex items-center gap-2 rounded-lg border px-3 py-1 text-sm">
            <input type="checkbox" checked={selected.includes(String(branch.id))} onChange={() => toggle(String(branch.id))} />
            {branch.name} ({branch.code})
          </label>
        ))}
    </fieldset>
  );
}

// Admin-only management of librarian accounts and library branches.
function UserManagement() {
  const [librarians, setLibrarians] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newLibrarian, setNewLibrarian] = useState(EMPTY_LIBRARIAN);
  const [newBranch, setNewBranch] = useState(EMPTY_BRANCH);
  const [editing, setEditing] = useState(null);

  const loadLibrarians = useCallback(async () => {
    const params = new URLSearchParams({ search, status });
    const { ok, data } = await apiRequest(`/api/users/librarians?${params}`);

    if (ok) {
      setLibrarians(data.librarians);
      setLoadError("");
    } else {
      setLoadError(data.message || "Unable to load librarians");
    }

    setLoading(false);
  }, [search, status]);

  const loadBranches = useCallback(async () => {
    const { ok, data } = await apiRequest("/api/branches");
    if (ok) setBranches(data.branches);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest("/api/branches").then(({ ok, data }) => active && ok && setBranches(data.branches));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadLibrarians, 250);
    return () => clearTimeout(timer);
  }, [loadLibrarians]);

  // Runs an API call, shows its message, and refreshes the list on success.
  const act = async (request, { onSuccess } = {}) => {
    setBusy(true);
    setFeedback(null);
    const { ok, data } = await request();
    setFeedback({ ok, message: data.message || (ok ? "Done" : "Request failed") });

    if (ok) {
      onSuccess?.(data);
      await loadLibrarians();
    }

    setBusy(false);
    return ok;
  };

  const createLibrarian = (e) => {
    e.preventDefault();
    act(() => apiRequest("/api/users/librarians", { method: "POST", body: newLibrarian }), {
      onSuccess: () => setNewLibrarian(EMPTY_LIBRARIAN),
    });
  };

  const createBranch = (e) => {
    e.preventDefault();
    act(() => apiRequest("/api/branches", { method: "POST", body: newBranch }), {
      onSuccess: () => {
        setNewBranch(EMPTY_BRANCH);
        loadBranches();
      },
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    // Details and branch assignments are separate operations; stop at the first failure.
    const detailsSaved = await act(() =>
      apiRequest(`/api/users/librarians/${editing.id}`, {
        method: "PATCH",
        body: { full_name: editing.full_name, email: editing.email },
      })
    );

    if (!detailsSaved) return;

    await act(
      () =>
        apiRequest(`/api/users/librarians/${editing.id}/branches`, {
          method: "PUT",
          body: { branch_ids: editing.branch_ids },
        }),
      { onSuccess: () => setEditing(null) }
    );
  };

  const toggleActive = (librarian) => {
    if (librarian.is_active && !window.confirm(`Deactivate ${librarian.full_name}? They will be signed out immediately.`)) {
      return;
    }

    act(() =>
      apiRequest(`/api/users/librarians/${librarian.id}/status`, {
        method: "PATCH",
        body: { is_active: !librarian.is_active },
      })
    );
  };

  const sendPasswordLink = (librarian) =>
    act(() => apiRequest(`/api/users/librarians/${librarian.id}/password-link`, { method: "POST" }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-4 py-6 text-white shadow-lg sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Admin</p>
            <h1 className="text-2xl font-bold sm:text-3xl">User Management</h1>
          </div>
          <Link to="/admin" className="rounded-lg bg-white/15 px-4 py-2 font-semibold hover:bg-white/25">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        <Feedback feedback={feedback} />

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createLibrarian} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Add librarian</h2>
            <p className="text-sm text-slate-500">
              The librarian receives an emailed invitation link to choose their own password.
            </p>
            <label className="block text-sm font-medium">
              Full name
              <input
                required
                maxLength={150}
                className={inputClass}
                value={newLibrarian.full_name}
                onChange={(e) => setNewLibrarian({ ...newLibrarian, full_name: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input
                required
                type="email"
                className={inputClass}
                value={newLibrarian.email}
                onChange={(e) => setNewLibrarian({ ...newLibrarian, email: e.target.value })}
              />
            </label>
            <BranchPicker
              branches={branches}
              selected={newLibrarian.branch_ids}
              onChange={(branch_ids) => setNewLibrarian({ ...newLibrarian, branch_ids })}
            />
            <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              Create librarian
            </button>
          </form>

          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Branches</h2>
            <ul className="divide-y text-sm">
              {branches.map((branch) => (
                <li key={branch.id} className="flex justify-between py-2">
                  <span>
                    <strong>{branch.code}</strong> · {branch.name}
                  </span>
                  {!branch.is_active && <span className="text-slate-400">inactive</span>}
                </li>
              ))}
              {!branches.length && <li className="py-2 text-slate-500">No branches yet.</li>}
            </ul>
            <form onSubmit={createBranch} className="grid gap-3 sm:grid-cols-3">
              <input
                required
                maxLength={32}
                placeholder="Code"
                aria-label="Branch code"
                className={inputClass}
                value={newBranch.code}
                onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
              />
              <input
                required
                maxLength={160}
                placeholder="Name"
                aria-label="Branch name"
                className={inputClass}
                value={newBranch.name}
                onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
              />
              <button disabled={busy} className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900 disabled:opacity-60">
                Add branch
              </button>
              <input
                placeholder="Address (optional)"
                aria-label="Branch address"
                className={`${inputClass} sm:col-span-3`}
                value={newBranch.address}
                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
              />
            </form>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-bold">Librarians</h2>
            <div className="flex flex-wrap gap-3">
              <input
                type="search"
                placeholder="Search name or email"
                aria-label="Search librarians"
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select aria-label="Filter by status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loading && <p className="text-slate-500">Loading librarians…</p>}
          {loadError && <p role="alert" className="text-red-600">{loadError}</p>}

          {!loading && !loadError && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Branches</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {librarians.map((librarian) => (
                    <tr key={librarian.id} className="align-top">
                      <td className="py-3 pr-4 font-medium">{librarian.full_name}</td>
                      <td className="py-3 pr-4">{librarian.email}</td>
                      <td className="py-3 pr-4">{librarian.branches.map((b) => b.code).join(", ") || "—"}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${librarian.is_active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"}`}>
                          {librarian.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="flex flex-wrap gap-2 py-3">
                        <button
                          disabled={busy}
                          className="rounded border px-2 py-1 hover:bg-slate-100"
                          onClick={() =>
                            setEditing({
                              id: librarian.id,
                              full_name: librarian.full_name,
                              email: librarian.email,
                              branch_ids: librarian.branches.map((b) => String(b.id)),
                            })
                          }
                        >
                          Edit
                        </button>
                        <button disabled={busy} className="rounded border px-2 py-1 hover:bg-slate-100" onClick={() => toggleActive(librarian)}>
                          {librarian.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          disabled={busy || !librarian.is_active}
                          className="rounded border px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
                          onClick={() => sendPasswordLink(librarian)}
                        >
                          Send password link
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!librarians.length && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No librarians found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {editing && (
          <form onSubmit={saveEdit} className="space-y-4 rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Edit librarian</h2>
            <label className="block text-sm font-medium">
              Full name
              <input
                required
                maxLength={150}
                className={inputClass}
                value={editing.full_name}
                onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input
                required
                type="email"
                className={inputClass}
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </label>
            <BranchPicker branches={branches} selected={editing.branch_ids} onChange={(branch_ids) => setEditing({ ...editing, branch_ids })} />
            <div className="flex gap-3">
              <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                Save changes
              </button>
              <button type="button" className="rounded-lg border px-4 py-2" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default UserManagement;
