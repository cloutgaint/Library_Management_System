import { useState } from "react";

function QRScanner() {
  const [searchTerm, setSearchTerm] = useState("");
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a Book ID or ISBN.");
      setBook(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setBook(null);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/books/search?query=${encodeURIComponent(
          searchTerm.trim()
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Book search failed");
      }

      const books = data.books || data.data || [];

      if (books.length === 0) {
        setError("No book found.");
        return;
      }

      setBook(books[0]);
    } catch (error) {
      console.error("Book Search Error:", error);
      setError(error.message || "Failed to search book.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          <h1 className="text-3xl sm:text-4xl font-bold">
            📷 QR Code Scanner
          </h1>

          <p className="text-blue-100 mt-2 text-sm sm:text-base">
            Scan a book QR code to quickly access book information.
          </p>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Scanner */}
          <section className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">

            <h2 className="text-2xl font-bold text-gray-800">
              Scan Book QR Code
            </h2>

            <p className="text-gray-500 mt-2">
              Position the QR code inside the scanning area.
            </p>

            {/* Camera Area */}
            <div className="mt-6 border-4 border-dashed border-blue-300 rounded-2xl h-64 sm:h-80 flex items-center justify-center bg-gray-50">

              <div className="text-center px-4">

                <div className="text-6xl sm:text-7xl">
                  📷
                </div>

                <p className="text-gray-600 font-semibold mt-4">
                  Camera Preview
                </p>

                <p className="text-gray-400 text-sm mt-1">
                  QR scanning will be connected during integration.
                </p>

              </div>

            </div>

            <button
              onClick={() =>
                alert("QR Scanner will be connected during integration.")
              }
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
            >
              📷 Start Scanning
            </button>

          </section>

          {/* Manual Search */}
          <section className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">

            <h2 className="text-2xl font-bold text-gray-800">
              Search Book Manually
            </h2>

            <p className="text-gray-500 mt-2">
              If scanning is unavailable, enter the Book ID or ISBN.
            </p>

            <div className="mt-6">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Book ID / ISBN
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Enter Book ID or ISBN"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition"
            >
              {loading ? "Searching..." : "🔍 Search Book"}
            </button>

            {/* Search Error */}
            {error && (
              <div className="mt-4 bg-red-50 text-red-700 rounded-xl p-4">
                {error}
              </div>
            )}

            {/* Book Result */}
            {book && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">

                <h3 className="text-lg font-bold text-green-800 mb-3">
                  Book Found
                </h3>

                <div className="space-y-2 text-sm text-gray-700">

                  <p>
                    <span className="font-semibold">Title:</span>{" "}
                    {book.title || "N/A"}
                  </p>

                  <p>
                    <span className="font-semibold">Author:</span>{" "}
                    {book.author || "N/A"}
                  </p>

                  <p>
                    <span className="font-semibold">ISBN:</span>{" "}
                    {book.isbn || "N/A"}
                  </p>

                  <p>
                    <span className="font-semibold">Book ID:</span>{" "}
                    {book.id || "N/A"}
                  </p>

                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {book.status || "N/A"}
                  </p>

                </div>

              </div>
            )}

            {/* Information */}
            <div className="mt-8 bg-blue-50 rounded-xl p-5">

              <h3 className="font-bold text-blue-800">
                How it works
              </h3>

              <div className="mt-4 space-y-3 text-sm text-gray-600">

                <p>
                  <span className="font-semibold">1.</span> Start the QR scanner.
                </p>

                <p>
                  <span className="font-semibold">2.</span> Point the camera at the book QR code.
                </p>

                <p>
                  <span className="font-semibold">3.</span> If scanning is unavailable, search using Book ID or ISBN.
                </p>

                <p>
                  <span className="font-semibold">4.</span> Book information will be displayed.
                </p>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default QRScanner;