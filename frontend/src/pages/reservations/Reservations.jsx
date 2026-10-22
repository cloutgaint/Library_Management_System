import { useEffect, useState } from "react";

function Reservation() {
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadBooks = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/books",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load books");
      }

      setBooks(data.books || []);
    } catch (error) {
      console.error("Books Error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      setLoadingReservations(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/reservations/my-reservations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load reservations"
        );
      }

      setReservations(data.reservations || []);
    } catch (error) {
      console.error("Reservations Error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    loadBooks();
    loadReservations();
  }, []);

  const handleReservation = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedBook) {
      setErrorMessage("Please select a book.");
      return;
    }

    try {
      setReserving(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookId: Number(selectedBook),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create reservation"
        );
      }

      setSuccessMessage(
        "Book has been reserved successfully!"
      );

      setSelectedBook("");

      await loadReservations();
    } catch (error) {
      console.error("Reservation Error:", error);
      setErrorMessage(error.message);
    } finally {
      setReserving(false);
    }
  };

  const handleCancel = () => {
    setSelectedBook("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleCancelReservation = async (reservationId) => {
    try {
      setCancelling(reservationId);
      setSuccessMessage("");
      setErrorMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/reservations/${reservationId}`,
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
          data.message || "Failed to cancel reservation"
        );
      }

      setSuccessMessage(
        "Reservation cancelled successfully."
      );

      await loadReservations();
    } catch (error) {
      console.error("Cancel Reservation Error:", error);
      setErrorMessage(error.message);
    } finally {
      setCancelling(null);
    }
  };

  const getStatusClasses = (status) => {
    if (status === "Ready") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Cancelled") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            📋 Book Reservations
          </h1>

          <p className="mt-2 text-blue-100 text-sm sm:text-base">
            Reserve unavailable books and manage reservation requests.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Create Reservation
            </h2>

            <p className="text-gray-500 mt-1 text-sm">
              Select a book to create a reservation request.
            </p>
          </div>

          <form
            onSubmit={handleReservation}
            className="p-5 sm:p-6"
          >
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Select Book *
              </label>

              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                disabled={loading || reserving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loading
                    ? "Loading books..."
                    : "Select a book"}
                </option>

                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} — {book.author}
                  </option>
                ))}
              </select>
            </div>

            {errorMessage && (
              <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                ❌ {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
                ✅ {successMessage}
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={reserving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || reserving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md disabled:bg-gray-400"
              >
                {reserving
                  ? "Reserving..."
                  : "📋 Reserve Book"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              My Reservations
            </h2>

            <p className="text-gray-500 mt-1 text-sm">
              View and manage your reservation requests.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {loadingReservations ? (
              <p className="text-gray-500 text-center py-6">
                Loading your reservations...
              </p>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500">
                  You don't have any reservations yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border border-gray-200 rounded-xl p-4 sm:p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          {reservation.title}
                        </h3>

                        <p className="text-gray-500 mt-1">
                          Author: {reservation.author}
                        </p>

                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          <p>
                            Reservation Date:{" "}
                            {reservation.reservation_date
                              ? new Date(
                                  reservation.reservation_date
                                ).toLocaleDateString("en-IN")
                              : "N/A"}
                          </p>

                          <p>
                            Queue Position:{" "}
                            {reservation.queue_position ??
                              "Not applicable"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusClasses(
                            reservation.status
                          )}`}
                        >
                          {reservation.status}
                        </span>

                        {reservation.status === "Waiting" && (
                          <button
                            onClick={() =>
                              handleCancelReservation(
                                reservation.id
                              )
                            }
                            disabled={
                              cancelling === reservation.id
                            }
                            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:bg-gray-400"
                          >
                            {cancelling === reservation.id
                              ? "Cancelling..."
                              : "Cancel Reservation"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800">
            Reservation Information
          </h2>

          <div className="mt-4 space-y-3 text-gray-600">
            <p>📚 Select a book from the list above.</p>

            <p>
              📋 Click <strong>Reserve Book</strong> to create
              your reservation.
            </p>

            <p>
              ⏳ Your reservation will be added to the library
              reservation queue.
            </p>

            <p>
              📌 Your existing reservations are displayed in
              <strong> My Reservations</strong>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Reservation;