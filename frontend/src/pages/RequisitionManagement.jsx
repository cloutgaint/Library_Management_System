import { useEffect, useState } from "react";
import { API_BASE_URL as API } from "../lib/api";
export default function RequisitionManagement() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const load = async () => {
    const response = await fetch(`${API}/api/requisitions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Could not load requisitions");
    setItems(await response.json());
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  const change = async (id, status) => {
    const note = window.prompt("Decision note (optional)") || "";
    try {
      const response = await fetch(`${API}/api/requisitions/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, note }),
      });
      if (!response.ok)
        throw new Error((await response.json()).message || "Update failed");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const next = {
    Pending: ["Approved", "Rejected"],
    Approved: ["Ordered", "Rejected"],
    Ordered: ["Acquired"],
  };
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Book Requisition Management</h1>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">
            {item.title} — {item.author}
          </h2>
          <p>
            Requested by: {item.member_name} · Status: {item.status}
          </p>
          <p>{item.reason}</p>
          <div className="mt-2 flex gap-2">
            {(next[item.status] || []).map((status) => (
              <button
                key={status}
                onClick={() => change(item.id, status)}
                className="rounded border px-3 py-1"
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
