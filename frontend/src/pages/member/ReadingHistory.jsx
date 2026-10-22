import { useEffect, useState } from "react";
import HistoryTable from "../../components/member/HistoryTable";

function ReadingHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
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
            data.message || "Failed to fetch reading history"
          );
        }

        setHistory(data.history || []);
      } catch (err) {
        console.error("Reading History Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const totalBooks = history.length;

  const returnedBooks = history.filter(
    (book) => book.transaction_status === "Returned"
  ).length;

  const currentlyIssued = history.filter(
    (book) => book.transaction_status === "Issued"
  ).length;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

          <h1 className="text-3xl sm:text-4xl font-bold">
            📖 Reading History
          </h1>

          <p className="text-blue-100 mt-2">
            View your previous and current library book activity
          </p>

        </div>

      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <p className="text-gray-600">
              Loading reading history...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <p className="text-gray-500 text-sm">
                Total Books
              </p>

              <h2 className="text-3xl font-bold text-blue-600 mt-2">
                {totalBooks}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <p className="text-gray-500 text-sm">
                Books Returned
              </p>

              <h2 className="text-3xl font-bold text-green-600 mt-2">
                {returnedBooks}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <p className="text-gray-500 text-sm">
                Currently Issued
              </p>

              <h2 className="text-3xl font-bold text-orange-600 mt-2">
                {currentlyIssued}
              </h2>
            </div>

          </div>
        )}

        {/* History Section */}
        {!loading && !error && (
          <section className="bg-white rounded-2xl shadow-md overflow-hidden">

            <div className="p-5 sm:p-6 border-b border-gray-200">

              <h2 className="text-2xl font-bold text-gray-800">
                Book Activity
              </h2>

              <p className="text-gray-500 mt-1">
                Your library borrowing history
              </p>

            </div>

            <div className="overflow-x-auto">

              <HistoryTable history={history} />

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default ReadingHistory;