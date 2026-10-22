import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export default function MyRequisitions() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", reason: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");
  const load = async () => {
    const response = await fetch(`${API}/api/requisitions/mine`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Could not load requisitions");
    setItems(await response.json());
  };
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  const submit = async e => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch(`${API}/api/requisitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error((await response.json()).message || "Request failed");
      setForm({ title: "", author: "", isbn: "", reason: "" });
      await load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  return <main className="mx-auto max-w-4xl p-6 space-y-6">
    <h1 className="text-2xl font-bold">My Book Requisitions</h1>
    <form onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-5 shadow">
      {["title", "author", "isbn", "reason"].map(key => <label key={key} className="grid gap-1 capitalize">
        {key}<input className="rounded border p-2" required={key === "title" || key === "author"}
          maxLength={key === "isbn" ? 32 : key === "reason" ? 2000 : 255}
          value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} />
      </label>)}
      <button disabled={saving} className="rounded bg-blue-700 p-2 text-white">{saving ? "Submitting…" : "Request Book"}</button>
    </form>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <section className="space-y-2">{items.map(item => <article key={item.id} className="rounded border bg-white p-4">
      <strong>{item.title}</strong> — {item.author} <span className="ml-2 font-semibold">{item.status}</span>
      {item.decision_note && <p>{item.decision_note}</p>}
    </article>)}</section>
  </main>;
}
