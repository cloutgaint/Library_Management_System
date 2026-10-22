import { useEffect, useState } from "react";

function EbookPage() {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    bookId: "",
    title: "",
    author: "",
    fileUrl: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const userRole = String(user.role || "").toLowerCase();

  const canManageEbooks =
    userRole === "admin" || userRole === "librarian";

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        "http://localhost:5000/api/ebooks",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch e-books."
        );
      }

      setEbooks(Array.isArray(data.ebooks) ? data.ebooks : []);
    } catch (err) {
      console.error("E-Books Error:", err);
      setError(
        err.message || "Unable to load e-books."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbooks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddEbook = async (e) => {
    e.preventDefault();

    if (!canManageEbooks) {
      alert("You are not authorized to add e-books.");
      return;
    }

    if (
      !formData.bookId ||
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.fileUrl.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    const bookId = Number(formData.bookId);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      alert("Please enter a valid Book ID.");
      return;
    }

    try {
      setAdding(true);

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/ebooks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookId,
            title: formData.title.trim(),
            author: formData.author.trim(),
            fileUrl: formData.fileUrl.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add e-book."
        );
      }

      alert("E-book added successfully.");

      setFormData({
        bookId: "",
        title: "",
        author: "",
        fileUrl: "",
      });

      setShowForm(false);

      await fetchEbooks();
    } catch (err) {
      console.error("Add E-Book Error:", err);
      alert(
        err.message || "Unable to add e-book."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManageEbooks) {
      alert("You are not authorized to delete e-books.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this e-book?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        `http://localhost:5000/api/ebooks/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete e-book."
        );
      }

      alert("E-book deleted successfully.");

      await fetchEbooks();
    } catch (err) {
      console.error("Delete E-Book Error:", err);
      alert(
        err.message || "Unable to delete e-book."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const closeForm = () => {
    if (adding) {
      return;
    }

    setShowForm(false);

    setFormData({
      bookId: "",
      title: "",
      author: "",
      fileUrl: "",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Library Management System
              </p>

              <h1 className="mt-1 text-3xl font-bold md:text-4xl">
                E-Books
              </h1>

              <p className="mt-2 text-blue-100">
                Access and manage digital library resources.
              </p>
            </div>

            {canManageEbooks && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-indigo-600 shadow-md transition hover:bg-indigo-50"
              >
                + Add E-Book
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Loading e-books...
            </p>
          </div>
        ) : ebooks.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mb-4 text-5xl">
              📚
            </div>

            <h2 className="text-xl font-bold text-slate-800">
              No E-Books Available
            </h2>

            <p className="mt-2 text-slate-500">
              Digital books will appear here when they are added.
            </p>

            {canManageEbooks && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                + Add First E-Book
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ebooks.map((ebook) => (
              <div
                key={ebook.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-3xl">
                  📖
                </div>

                <h2 className="text-xl font-bold text-slate-800">
                  {ebook.title}
                </h2>

                <p className="mt-2 text-slate-600">
                  <span className="font-medium">
                    Author:
                  </span>{" "}
                  {ebook.author}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Book ID: {ebook.book_id}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={ebook.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[120px] flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center font-medium text-white transition hover:bg-indigo-700"
                  >
                    📖 Open E-Book
                  </a>

                  {canManageEbooks && (
                    <button
                      type="button"
                      onClick={() => handleDelete(ebook.id)}
                      disabled={deletingId === ebook.id}
                      className="rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === ebook.id
                        ? "Deleting..."
                        : "🗑️"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Add E-Book
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a digital book to the library.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={adding}
                className="text-2xl text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAddEbook}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Book ID
                </label>

                <input
                  type="number"
                  name="bookId"
                  value={formData.bookId}
                  onChange={handleChange}
                  placeholder="Enter existing book ID"
                  min="1"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Use the ID of an existing book from your Book Catalog.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-Book Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter e-book title"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Author
                </label>

                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Enter author name"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-Book URL
                </label>

                <input
                  type="url"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/book.pdf"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Enter the URL where the digital book can be opened.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={adding}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add E-Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EbookPage;