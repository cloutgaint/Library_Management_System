import { useEffect, useState } from "react";

function RenewBook() {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch currently issued books
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/borrow-transactions",
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

        const issuedTransactions = (data.transactions || []).filter(
          (transaction) =>
            transaction.transaction_status === "Issued"
        );

        setTransactions(issuedTransactions);
      } catch (err) {
        console.error("Renew Book Data Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((transaction) =>
    (transaction.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDefaultNewDueDate = (currentDueDate) => {
    const date = new Date(currentDueDate);

    date.setDate(date.getDate() + 7);

    return date.toISOString().split("T")[0];
  };

  const handleSelectBook = (transaction) => {
    setSelectedTransaction(transaction);
    setNewDueDate(getDefaultNewDueDate(transaction.due_date));
    setError("");
    setSuccessMessage("");
  };

  const handleRenewBook = async () => {
    if (!selectedTransaction) {
      alert("Please select a book.");
      return;
    }

    if (!newDueDate) {
      alert("Please select a new due date.");
      return;
    }

    try {
      setRenewing(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/borrow-transactions/renew",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactionId: selectedTransaction.id,
            newDueDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to renew book"
        );
      }

      const memberName =
        selectedTransaction.full_name ||
        selectedTransaction.member_name ||
        `Member ${selectedTransaction.member_id}`;

      setSuccessMessage(
        `"${selectedTransaction.title}" has been renewed successfully for ${memberName}. New due date: ${formatDate(newDueDate)}.`
      );

      // Update the transaction in the page
      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) =>
          transaction.id === selectedTransaction.id
            ? {
                ...transaction,
                due_date: newDueDate,
              }
            : transaction
        )
      );

      setSelectedTransaction(null);
      setNewDueDate("");
    } catch (err) {
      console.error("Renew Book Error:", err);
      setError(err.message);
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <h1 className="text-3xl sm:text-4xl font-bold">
            🔄 Renew Book
          </h1>

          <p className="mt-2 text-blue-100">
            Extend the borrowing period for library members.
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
              Loading issued books...
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 mb-8">

              <label className="block font-semibold text-gray-700 mb-3">
                Search Issued Book
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
            {filteredTransactions.length > 0 ? (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {filteredTransactions.map((transaction) => (

                  <div
                    key={transaction.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >

                    {transaction.image ? (
                      <img
                        src={transaction.image}
                        alt={transaction.title}
                        className="w-full h-56 object-contain bg-gray-100"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-6xl">
                        📚
                      </div>
                    )}

                    <div className="p-6">

                      <h2 className="text-2xl font-bold text-gray-800">
                        {transaction.title}
                      </h2>

                      <p className="text-gray-600 mt-1">
                        {transaction.author}
                      </p>

                      <div className="mt-4 space-y-2 text-gray-600">

                        <p>
                          <span className="font-semibold">
                            Issued To:
                          </span>{" "}
                          {transaction.full_name ||
                            transaction.member_name ||
                            `Member ${transaction.member_id}`}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Current Due Date:
                          </span>{" "}
                          {formatDate(transaction.due_date)}
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          handleSelectBook(transaction)
                        }
                        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
                      >
                        Renew Book
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
                  No issued books found
                </h2>

                <p className="text-gray-500 mt-2">
                  There are currently no books available for renewal.
                </p>

              </div>

            )}
          </>
        )}

      </main>

      {/* Renew Modal */}
      {selectedTransaction && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Renew Book
            </h2>

            <div className="bg-gray-100 rounded-xl p-4 mt-4">

              <p className="font-bold text-gray-800">
                {selectedTransaction.title}
              </p>

              <p className="text-gray-600 text-sm mt-1">
                {selectedTransaction.author}
              </p>

              <p className="text-gray-600 text-sm mt-2">
                Member:{" "}
                {selectedTransaction.full_name ||
                  selectedTransaction.member_name ||
                  `Member ${selectedTransaction.member_id}`}
              </p>

              <p className="text-gray-600 text-sm mt-1">
                Current Due Date:{" "}
                {formatDate(selectedTransaction.due_date)}
              </p>

            </div>

            {/* New Due Date */}
            <div className="mt-5">

              <label className="block font-semibold text-gray-700 mb-2">
                New Due Date
              </label>

              <input
                type="date"
                value={newDueDate}
                min={selectedTransaction.due_date}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-sm text-gray-500 mt-2">
                Default renewal extends the current due date by 7 days.
              </p>

            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-7">

              <button
                onClick={() => {
                  setSelectedTransaction(null);
                  setNewDueDate("");
                }}
                disabled={renewing}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleRenewBook}
                disabled={renewing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
              >
                {renewing ? "Renewing..." : "Confirm Renewal"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default RenewBook;