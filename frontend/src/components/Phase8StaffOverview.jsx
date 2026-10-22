import { useEffect, useState } from "react";
import { API_BASE_URL as API } from "../lib/api";
export default function Phase8StaffOverview() {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API}/api/dashboard-overview`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async (r) => {
        if (!r.ok) throw Error("Overview unavailable");
        setData((await r.json()).overview);
      })
      .catch((e) => setError(e.message));
  }, []);
  const fields = [
    ["Catalog Titles", "catalog_titles"],
    ["Physical Copies", "physical_copies"],
    ["Available Copies", "available_copies"],
    ["Members", "members"],
    ["Active Loans", "active_loans"],
    ["Overdue Loans", "overdue_loans"],
    ["Waiting Reservations", "waiting_reservations"],
    ["Ready Reservations", "ready_reservations"],
    ["Unpaid Fines (₹)", "unpaid_fines"],
  ];
  return (
    <section
      aria-label="Verified library overview"
      className="m-4 rounded-xl border bg-white p-5 text-black"
    >
      <h2 className="mb-3 text-lg font-semibold">
        Library Operations Overview
      </h2>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>Loading overview...</p>}
      {data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {fields.map(([label, key]) => (
            <div key={key} className="rounded-lg bg-slate-100 p-3">
              <p className="text-xs text-slate-600">{label}</p>
              <strong>{data[key] ?? "—"}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
