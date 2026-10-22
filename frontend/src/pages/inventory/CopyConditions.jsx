import { useEffect, useState } from "react";
import { API_BASE_URL as API } from "../../lib/api";
export default function CopyConditions() {
  const [events, setEvents] = useState([]),
    [copyId, setCopyId] = useState(""),
    [condition, setCondition] = useState("Damaged"),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  const auth = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });
  const load = async () => {
    const r = await fetch(`${API}/api/copy-conditions`, { headers: auth() });
    if (!r.ok) throw Error("Condition history unavailable");
    setEvents(await r.json());
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch(`${API}/api/copy-conditions`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ copyId, condition, note }),
      });
      if (!r.ok) throw Error((await r.json()).message || "Update failed");
      setCopyId("");
      setNote("");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Lost and Damaged Copies</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          required
          aria-label="Copy ID"
          className="border p-2"
          placeholder="Copy ID"
          value={copyId}
          onChange={(e) => setCopyId(e.target.value)}
        />
        <select
          className="border p-2"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          {["Good", "Worn", "Damaged", "Lost", "Repair"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <input
          className="border p-2"
          placeholder="Assessment note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="rounded border px-3">Record condition</button>
      </form>
      {events.map((e) => (
        <article className="rounded border p-3" key={e.id}>
          {e.title} · {e.barcode} · {e.previous_condition} → {e.new_condition} ·{" "}
          {e.note || "No note"}
        </article>
      ))}
    </main>
  );
}
