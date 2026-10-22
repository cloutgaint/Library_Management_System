import { useEffect, useMemo, useState } from "react";

import BookCard from "../../components/books/BookCard";
import SearchBar from "../../components/books/SearchBar";
import FilterSection from "../../components/books/FilterSection";
import Pagination from "../../components/books/Pagination";
import BookDetailsModal from "../../components/books/BookDetailsModal";

function BookCatalog() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Books");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [savingBook, setSavingBook] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    status: "Available",
    description: "",
    image: "",
    total_copies: 1,
    available_copies: 1,
  });

  const booksPerPage = 6;

  const canManageBooks =
    user.role === "admin" || user.role === "librarian";

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/books", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to fetch books");
        return;
      }

      setBooks(data.books || []);
    } catch (error) {
      console.error("Book Fetch Error:", error);

      setError(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const categories = useMemo(() => {
    return [
      "All Categories",
      ...new Set(books.map((book) => book.category)),
    ];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search) ||
        book.isbn.toLowerCase().includes(search);

      const matchesCategory =
        category === "All Categories" ||
        book.category === category;

      const matchesStatus =
        status === "All Books" ||
        book.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [books, searchTerm, category, status]);

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  const startIndex = (currentPage - 1) * booksPerPage;

  const displayedBooks = filteredBooks.slice(
    startIndex,
    startIndex + booksPerPage
  );

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setCurrentPage(1);
  };

  const availableBooks = books.filter(
    (book) => book.status === "Available"
  ).length;

  const issuedBooks = books.filter(
    (book) => book.status === "Issued"
  ).length;

  const resetBookForm = () => {
    setBookForm({
      title: "",
      author: "",
      isbn: "",
      category: "",
      status: "Available",
      description: "",
      image: "",
      total_copies: 1,
      available_copies: 1,
    });

    setEditingBook(null);
    setFormError("");
  };

  const openAddBookForm = () => {
    resetBookForm();
    setShowBookForm(true);
  };

  const openEditBookForm = (book) => {
    setEditingBook(book);

    setBookForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      category: book.category || "",
      status: book.status || "Available",
      description: book.description || "",
      image: book.image || "",
      total_copies: Number(book.total_copies) || 1,
      available_copies: Number(book.available_copies) || 1,
    });

    setFormError("");
    setShowBookForm(true);
  };

  const closeBookForm = () => {
    if (savingBook) return;

    setShowBookForm(false);
    resetBookForm();
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setBookForm((previous) => ({
      ...previous,
      [name]:
        name === "total_copies" || name === "available_copies"
          ? Number(value)
          : value,
    }));
  };

  const handleBookSubmit = async (event) => {
    event.preventDefault();

    try {
      setSavingBook(true);
      setFormError("");

      const token = localStorage.getItem("token");

      if (
        !bookForm.title.trim() ||
        !bookForm.author.trim() ||
        !bookForm.isbn.trim() ||
        !bookForm.category.trim()
      ) {
        setFormError(
          
          "Title, author, ISBN and category are required."
        );
        return;
      }

      if (bookForm.total_copies < 1) {
        setFormError("Total copies must be at least 1.");
        return;
      }

      if (
        bookForm.available_copies < 0 ||
        bookForm.available_copies > bookForm.total_copies
      ) {
        setFormError(
          "Available copies must be between 0 and total copies."
        );
        return;
      }

      const url = editingBook
        ? `http://localhost:5000/api/books/${editingBook.id}`
        : "http://localhost:5000/api/books";

      const method = editingBook ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: bookForm.title.trim(),
          author: bookForm.author.trim(),
          isbn: bookForm.isbn.trim(),
          category: bookForm.category.trim(),
          status: bookForm.status,
          description: bookForm.description.trim(),
          image: bookForm.image.trim(),
          total_copies: bookForm.total_copies,
          available_copies: bookForm.available_copies,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (editingBook
              ? "Failed to update book"
              : "Failed to create book")
        );
      }

      setShowBookForm(false);
      resetBookForm();

      await fetchBooks();
    } catch (error) {
      console.error("Book Save Error:", error);
      setFormError(error.message);
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(book.id);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/books/${book.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete book"
        );
      }

      if (selectedBook?.id === book.id) {
        setSelectedBook(null);
      }

      await fetchBooks();
    } catch (error) {
      console.error("Delete Book Error:", error);

      alert(error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-sm font-medium text-blue-100">
                Library Management System
              </p>

              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                📚 Library Book Catalog
              </h1>

              <p className="mt-2 text-blue-100">
                Search and explore books available in the library
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-blue-700">
                {(user.full_name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <p className="font-semibold">
                  {user.full_name || "User"}
                </p>

                <p className="text-sm text-blue-100">
                  {user.role === "admin"
                    ? "Administrator"
                    : user.role === "librarian"
                    ? "Librarian"
                    : "Member"}
                </p>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Statistics */}
        {!loading && !error && (
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Books
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {books.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Available Books
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {availableBooks}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Currently Issued
              </p>

              <h2 className="mt-2 text-3xl font-bold text-orange-600">
                {issuedBooks}
              </h2>
            </div>

          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              Loading books...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Search + Add Book */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex-1">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          </div>

          {canManageBooks && (
            <button
              type="button"
              onClick={openAddBookForm}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Book
            </button>
          )}

        </div>

        {/* Filters */}
        <FilterSection
          category={category}
          status={status}
          categories={categories}
          onCategoryChange={handleCategoryChange}
          onStatusChange={handleStatusChange}
        />

        {/* Results Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Books
            </h2>

            <p className="mt-1 text-slate-500">
              Showing {displayedBooks.length} of{" "}
              {filteredBooks.length} books
            </p>
          </div>

          {(searchTerm ||
            category !== "All Categories" ||
            status !== "All Books") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategory("All Categories");
                setStatus("All Books");
                setCurrentPage(1);
              }}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          )}

        </div>

        {/* Book Grid */}
        {!loading && !error && displayedBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {displayedBooks.map((book) => (
              <div key={book.id} className="relative">

                <BookCard
                  book={book}
                  onViewDetails={setSelectedBook}
                />

                {canManageBooks && (
                  <div className="mt-3 grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() => openEditBookForm(book)}
                      className="rounded-xl border border-blue-200 bg-blue-50 py-2.5 font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBook(book)}
                      disabled={deleteLoading === book.id}
                      className="rounded-xl border border-red-200 bg-red-50 py-2.5 font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleteLoading === book.id
                        ? "Deleting..."
                        : "🗑️ Delete"}
                    </button>

                  </div>
                )}

              </div>
            ))}

          </div>
        ) : !loading && !error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mb-4 text-5xl">
              📚
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              No books found
            </h3>

            <p className="mt-2 text-slate-500">
              Try changing your search or filter options.
            </p>

          </div>
        ) : null}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Book Details */}
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />

      </main>

      {/* Add/Edit Book Modal */}
      {showBookForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeBookForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingBook ? "Edit Book" : "Add New Book"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingBook
                    ? "Update the book information below."
                    : "Enter the details for the new book."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBookForm}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleBookSubmit}
              className="space-y-5 p-6"
            >

              {formError && (
                <div className="rounded-xl bg-red-100 p-4 text-sm font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Book Title *
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={bookForm.title}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter book title"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Author *
                  </label>

                  <input
                    type="text"
                    name="author"
                    value={bookForm.author}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter author name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ISBN *
                  </label>

                  <input
                    type="text"
                    name="isbn"
                    value={bookForm.isbn}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter ISBN"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category *
                  </label>

                  <input
                    type="text"
                    name="category"
                    value={bookForm.category}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Fiction"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={bookForm.status}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Available">Available</option>
                    <option value="Issued">Issued</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Total Copies
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="total_copies"
                    value={bookForm.total_copies}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Available Copies
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="available_copies"
                    value={bookForm.available_copies}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Image URL
                  </label>

                  <input
                    type="text"
                    name="image"
                    value={bookForm.image}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="https://..."
                  />
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={bookForm.description}
                  onChange={handleFormChange}
                  rows="4"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter book description"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeBookForm}
                  disabled={savingBook}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingBook}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingBook
                    ? "Saving..."
                    : editingBook
                    ? "Update Book"
                    : "Add Book"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default BookCatalog;