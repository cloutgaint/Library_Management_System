import { useEffect, useState } from "react";
import { API_BASE_URL as API } from "../../lib/api";
const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
export default function Periodicals() {
  const [subs, setSubs] = useState([]),
    [issues, setIssues] = useState([]),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    branchId: "",
    title: "",
    issn: "",
    frequency: "",
  });
  const load = async () => {
    const [a, b] = await Promise.all(
      ["subscriptions", "issues"].map((x) =>
        fetch(`${API}/api/periodicals/${x}`, { headers: headers() }),
      ),
    );
    if (!a.ok || !b.ok) throw Error("Periodical data unavailable");
    setSubs(await a.json());
    setIssues(await b.json());
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/api/periodicals/subscriptions`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw Error("Unable to create subscription");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const mark = async (id, status) => {
    try {
      const r = await fetch(`${API}/api/periodicals/issues/${id}`, {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw Error("Unable to update issue");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">Periodicals</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        {["branchId", "title", "issn", "frequency"].map((k) => (
          <input
            key={k}
            required={k === "branchId" || k === "title"}
            aria-label={k}
            placeholder={k}
            className="border p-2"
            value={form[k]}
            onChange={(e) => setForm((v) => ({ ...v, [k]: e.target.value }))}
          />
        ))}
        <button className="rounded border px-3">Add subscription</button>
      </form>
      <h2 className="text-lg font-semibold">Subscriptions</h2>
      {subs.map((s) => (
        <div key={s.id} className="border p-3">
          {s.title} · {s.branch_name} · {s.status}
        </div>
      ))}
      <h2 className="text-lg font-semibold">Issues</h2>
      {issues.map((i) => (
        <div key={i.id} className="flex gap-3 border p-3">
          #{i.issue_number || i.id} · {i.status}
          {["Received", "Missing"].map((status) => (
            <button
              key={status}
              className="rounded border px-2"
              onClick={() => mark(i.id, status)}
            >
              {status}
            </button>
          ))}
        </div>
      ))}
    </main>
  );
}
