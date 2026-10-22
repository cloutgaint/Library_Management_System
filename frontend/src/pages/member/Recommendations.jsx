import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export default function Recommendations() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/recommendations`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw new Error("Unable to load recommendations");
      return response.json();
    }).then(data => setBooks(data.recommendations || []))
      .catch(e => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return <main className="mx-auto max-w-5xl p-6">
    <h1 className="mb-4 text-2xl font-bold">Recommended Books</h1>
    {loading ? <p>Loading recommendations…</p> : error ? <p role="alert">{error}</p> :
      books.length === 0 ? <p>No recommendations are available yet.</p> :
      <div className="grid gap-4 sm:grid-cols-2">{books.map(book =>
        <article key={book.id} className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">{book.title}</h2>
          <p>{book.author} · {book.category}</p>
          <p>{book.available_copies > 0 ? "Available" : "Currently unavailable"}</p>
        </article>)}</div>}
  </main>;
}
