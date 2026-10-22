import { useEffect, useState } from "react";

function IssueBook() {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [memberId, setMemberId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  // Default due date = 15 days from today
  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 15);

    const formattedDate = date.toISOString().split("T")[0];
    setDueDate(formattedDate);
  }, []);

  // Fetch books and members
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [booksResponse, membersResponse] = await Promise.all([
          fetch("http://localhost:5000/api/books", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch("http://localhost:5000/api/members", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const booksData = await booksResponse.json();
        const membersData = await membersResponse.json();

        if (!booksResponse.ok) {
          throw new Error(
            booksData.message || "Failed to fetch books"
          );
        }

        if (!membersResponse.ok) {
          throw new Error(
            membersData.message || "Failed to fetch members"
          );
        }

        setBooks(booksData.books || []);
        setMembers(membersData.members || []);
      } catch (err) {
        console.error("Issue Book Data Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleIssueBook = async () => {
    if (!selectedBook) {
      alert("Please select a book.");
      return;
    }

    if (!memberId) {
      alert("Please select a member.");
      return;
    }

    if (!dueDate) {
      alert("Please select a due date.");
      return;
    }

    try {
      setIssuing(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/borrow-transactions/issue",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            memberId: Number(memberId),
            bookId: selectedBook.id,
            dueDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to issue book");
      }

      const selectedMember = members.find(
        (member) => member.id === Number(memberId)
      );

      setSuccessMessage(
        `"${selectedBook.title}" has been issued successfully to ${
          selectedMember?.full_name || "the selected member"
        }.`
      );

      // Reduce available copies in the UI
      setBooks((currentBooks) =>
        currentBooks.map((book) =>
          book.id === selectedBook.id
            ? {
                ...book,
                available_copies: Math.max(
                  0,
                  Number(book.available_copies || 0) - 1
                ),
              }
            : book
        )
      );

      setSelectedBook(null);
      setMemberId("");
    } catch (err) {
      console.error("Issue Book Error:", err);
      setError(err.message);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <h1 className="text-3xl sm:text-4xl font-bold">
            📚 Issue Book
          </h1>

          <p className="mt-2 text-blue-100">
            Issue available books to library members.
          </p>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-5 py-4 rounded-xl">
            ✓ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-5 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <p className="text-gray-600">
              Loading books and members...
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 mb-8">

              <label className="block font-semibold text-gray-700 mb-3">
                Search Book
              </label>

              <input
                type="text"
                placeholder="Search by book title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Books */}
            {filteredBooks.length > 0 ? (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {filteredBooks.map((book) => (

                  <div
                    key={book.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >

                    {book.image ? (
                      <img
                        src={book.image}
                        alt={book.title}
                       className="w-full h-64 object-contain bg-gray-100"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-6xl">
                        📚
                      </div>
                    )}

                    <div className="p-6">

                      <h2 className="text-2xl font-bold text-gray-800">
                        {book.title}
                      </h2>

                      <p className="text-gray-600 mt-1">
                        {book.author}
                      </p>

                      <div className="mt-4 space-y-2 text-gray-600">

                        <p>
                          <span className="font-semibold">
                            Category:
                          </span>{" "}
                          {book.category}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Available:
                          </span>{" "}
                          {book.available_copies}
                        </p>

                      </div>

                      <button
                        onClick={() => setSelectedBook(book)}
                        disabled={Number(book.available_copies) === 0}
                        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition"
                      >
                        {Number(book.available_copies) > 0
                          ? "Select Book"
                          : "Not Available"}
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div className="bg-white rounded-2xl shadow-md p-12 text-center">

                <div className="text-5xl mb-4">
                  📚
                </div>

                <h2 className="text-xl font-bold text-gray-800">
                  No books found
                </h2>

                <p className="text-gray-500 mt-2">
                  Try searching for another book.
                </p>

              </div>

            )}
          </>
        )}

      </main>

      {/* Issue Book Modal */}
      {selectedBook && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Issue Book
            </h2>

            <p className="text-gray-500 mt-2">
              Selected Book
            </p>

            <div className="bg-gray-100 rounded-xl p-4 mt-3">

              <p className="font-bold text-gray-800">
                {selectedBook.title}
              </p>

              <p className="text-gray-600 text-sm mt-1">
                {selectedBook.author}
              </p>

              <p className="text-gray-600 text-sm mt-1">
                Available copies: {selectedBook.available_copies}
              </p>

            </div>

            {/* Member */}
            <div className="mt-5">

              <label className="block font-semibold text-gray-700 mb-2">
                Select Member
              </label>

              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="">
                  Select a member
                </option>

                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} — {member.email}
                  </option>
                ))}

              </select>

            </div>

            {/* Due Date */}
            <div className="mt-5">

              <label className="block font-semibold text-gray-700 mb-2">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-sm text-gray-500 mt-2">
                Default due date is 15 days from today.
              </p>

            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-7">

              <button
                onClick={() => {
                  setSelectedBook(null);
                  setMemberId("");
                }}
                disabled={issuing}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleIssueBook}
                disabled={issuing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
            >
                {issuing ? "Issuing..." : "Issue Book"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default IssueBook;