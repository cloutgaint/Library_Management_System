import { useEffect, useState } from "react";
import { API_BASE_URL as API } from "../../lib/api";
const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
export default function TransferManagement() {
  const [items, setItems] = useState([]),
    [copyId, setCopyId] = useState(""),
    [destinationBranchId, setDestinationBranchId] = useState(""),
    [error, setError] = useState("");
  const load = async () => {
    const r = await fetch(`${API}/api/inventory/transfers`, {
      headers: headers(),
    });
    if (!r.ok) throw Error("Transfers unavailable");
    setItems(await r.json());
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  const send = async (url, method, body) => {
    setError("");
    try {
      const r = await fetch(`${API}${url}`, {
        method,
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok)
        throw Error((await r.json()).message || "Transfer operation failed");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const actions = {
    Requested: ["Approved", "Rejected", "Cancelled"],
    Approved: ["Dispatched", "Cancelled"],
    Dispatched: ["Received"],
  };
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Inter-branch Transfers</h1>
      {error && <p role="alert">{error}</p>}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send("/api/inventory/transfers", "POST", {
            copyId,
            destinationBranchId,
          });
        }}
      >
        <input
          required
          className="border p-2"
          placeholder="Copy ID"
          value={copyId}
          onChange={(e) => setCopyId(e.target.value)}
        />
        <input
          required
          className="border p-2"
          placeholder="Destination branch ID"
          value={destinationBranchId}
          onChange={(e) => setDestinationBranchId(e.target.value)}
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">
          Request transfer
        </button>
      </form>
      {items.map((t) => (
        <article key={t.id} className="rounded border p-4">
          <strong>{t.title}</strong> · {t.barcode} · {t.status}
          <div className="mt-2 flex gap-2">
            {(actions[t.status] || []).map((status) => (
              <button
                className="rounded border px-3 py-1"
                key={status}
                onClick={() =>
                  send(`/api/inventory/transfers/${t.id}/status`, "PATCH", {
                    status,
                  })
                }
              >
                {status}
              </button>
            ))}
          </div>
        </article>
      ))}
    </main>
  );
}
