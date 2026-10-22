import { useEffect, useState } from "react";
import { API_BASE_URL as API } from "../../lib/api";
export default function Reports() {
  const [rows, setRows] = useState([]),
    [summary, setSummary] = useState(null),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      fetch(
        `${API}/api/reports/borrowing?status=${encodeURIComponent(status)}&page=${page}&pageSize=50`,
        { headers: headers() },
      ),
      fetch(`${API}/api/reports/summary`, { headers: headers() }),
    ])
      .then(async ([a, b]) => {
        if (!a.ok || !b.ok) throw Error("Reports unavailable");
        const [r, s] = await Promise.all([a.json(), b.json()]);
        if (!cancelled) {
          setRows(r.report || []);
          setSummary(s.summary);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, page]);
  const exportCsv = () => {
    const fields = [
      "id",
      "title",
      "full_name",
      "issue_date",
      "due_date",
      "return_date",
      "transaction_status",
    ];
    const quote = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [
      fields.join(","),
      ...rows.map((r) => fields.map((k) => quote(r[k])).join(",")),
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "borrowing-report-page.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="mx-auto max-w-6xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">Library Reports</h1>
      {error && <p role="alert">{error}</p>}
      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(summary).map(([k, v]) => (
            <div className="rounded border p-3" key={k}>
              <p>{k.replaceAll("_", " ")}</p>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <select
          aria-label="Transaction status"
          className="rounded border p-2"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option>Issued</option>
          <option>Returned</option>
        </select>
        <button className="rounded border px-3" onClick={exportCsv}>
          Export current page CSV
        </button>
      </div>
      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                {["Book", "Member", "Issue", "Due", "Return", "Status"].map(
                  (x) => (
                    <th className="p-2" key={x}>
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td>{r.title}</td>
                  <td>{r.full_name}</td>
                  <td>{r.issue_date?.slice(0, 10)}</td>
                  <td>{r.due_date?.slice(0, 10)}</td>
                  <td>{r.return_date?.slice(0, 10) || "—"}</td>
                  <td>{r.transaction_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-3">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={rows.length < 50}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </main>
  );
}
