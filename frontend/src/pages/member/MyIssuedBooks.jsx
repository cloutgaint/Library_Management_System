import { useEffect, useState } from "react";

function MyIssuedBooks() {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIssuedBooks = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/borrow-transactions/my-history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch issued books"
          );
        }

        const currentBooks = (data.history || []).filter(
          (book) => book.transaction_status === "Issued"
        );

        setIssuedBooks(currentBooks);
      } catch (err) {
        console.error("My Issued Books Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssuedBooks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="text-3xl sm:text-4xl font-bold">
            📖 My Issued Books
          </h1>

          <p className="text-blue-100 mt-2">
            View the books currently issued to you
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-gray-600">
              Loading issued books...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <p className="text-gray-500 text-sm">
                Currently Issued
              </p>

              <h2 className="text-3xl font-bold text-blue-600 mt-2">
                {issuedBooks.length}
              </h2>
            </div>

            {issuedBooks.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <div className="text-5xl mb-4">📚</div>

                <h2 className="text-xl font-bold text-gray-800">
                  No Books Currently Issued
                </h2>

                <p className="text-gray-500 mt-2">
                  You don't have any books currently issued to you.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Currently Issued Books
                  </h2>

                  <p className="text-gray-500 mt-1">
                    Books that are currently issued to you
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          Book
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          Author
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          Issue Date
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          Due Date
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {issuedBooks.map((book) => (
                        <tr key={book.id}>
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {book.title}
                          </td>

                          <td className="px-6 py-4 text-gray-600">
                            {book.author || "—"}
                          </td>

                          <td className="px-6 py-4 text-gray-600">
                            {book.issue_date
                              ? new Date(
                                  book.issue_date
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-6 py-4 text-gray-600">
                            {book.due_date
                              ? new Date(
                                  book.due_date
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                              Issued
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default MyIssuedBooks;